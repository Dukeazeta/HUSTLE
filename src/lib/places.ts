import { z } from "zod";

const placeSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }),
  formattedAddress: z.string().optional(),
  websiteUri: z.string().url().optional(),
  nationalPhoneNumber: z.string().optional(),
  googleMapsUri: z.string().url().optional(),
  primaryType: z.string().optional(),
});

const responseSchema = z.object({ places: z.array(placeSchema).default([]) });

export async function searchPlaces(input: {
  city: string;
  country: "NG" | "UK";
  category: string;
  limit: number;
}) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("Google Places API key is missing");
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.primaryType",
      },
      body: JSON.stringify({
        textQuery: `${input.category.replaceAll("_", " ")} in ${input.city}, ${input.country === "NG" ? "Nigeria" : "United Kingdom"}`,
        pageSize: Math.min(input.limit, 20),
        languageCode: "en",
      }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error(`Places returned ${response.status}`);
  return responseSchema
    .parse(await response.json())
    .places.slice(0, input.limit);
}
