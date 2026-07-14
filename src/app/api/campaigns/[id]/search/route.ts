import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns, contacts } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id, normalizeDomain, normalizePhone } from "@/lib/ids";
import { preferredPlacePhone, searchPlaces } from "@/lib/places";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const campaignId = (await params).id;
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    if (campaign.status !== "active")
      return NextResponse.json(
        { error: "This campaign is stopped and cannot run new searches" },
        { status: 409 },
      );
    const estimatedCost = Number(
      process.env.GOOGLE_PLACES_ESTIMATED_REQUEST_MINOR ?? 0,
    );
    if (
      campaign.budgetMinor > 0 &&
      campaign.spentMinor + estimatedCost > campaign.budgetMinor
    )
      return NextResponse.json(
        { error: "Campaign budget limit reached" },
        { status: 409 },
      );
    const places = await searchPlaces({
      city: campaign.city,
      country: campaign.country,
      category: campaign.category,
      limit: campaign.resultLimit,
    });
    let imported = 0;
    for (const place of places) {
      const sourceUrl =
        place.googleMapsUri ??
        `https://www.google.com/maps/search/?api=1&query_place_id=${place.id}`;
      const phone = preferredPlacePhone(place);
      const result = await db
        .insert(businesses)
        .values({
          id: id("biz"),
          campaignId,
          placeId: place.id,
          name: place.displayName.text,
          category: place.primaryType ?? campaign.category,
          country: campaign.country,
          city: campaign.city,
          address: place.formattedAddress,
          websiteUrl: place.websiteUri,
          normalizedDomain: normalizeDomain(place.websiteUri),
          phone: normalizePhone(phone),
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          sourceUrl,
          sourceDiscoveredAt: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: businesses.placeId })
        .returning({ id: businesses.id });

      const businessId =
        result[0]?.id ??
        (
          await db.query.businesses.findFirst({
            columns: { id: true },
            where: eq(businesses.placeId, place.id),
          })
        )?.id;

      if (businessId)
        await db
          .update(businesses)
          .set({
            address: place.formattedAddress,
            websiteUrl: place.websiteUri,
            normalizedDomain: place.websiteUri
              ? normalizeDomain(place.websiteUri)
              : undefined,
            phone: phone ? normalizePhone(phone) : undefined,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            sourceUrl,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(businesses.id, businessId));

      if (businessId && phone)
        await db
          .insert(contacts)
          .values({
            id: id("con"),
            businessId,
            channel: "phone",
            value: phone,
            normalizedValue: normalizePhone(phone)!,
            sourceUrl,
            discoveredAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
      imported += result.length;
    }
    await db
      .update(campaigns)
      .set({
        spentMinor: campaign.spentMinor + estimatedCost,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, campaignId));
    return NextResponse.json({
      imported,
      duplicates: places.length - imported,
      rejected: 0,
      estimatedCostMinor: estimatedCost,
    });
  } catch (error) {
    return apiError(error);
  }
}
