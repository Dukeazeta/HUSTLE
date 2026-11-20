# Phase 0: SaaS decisions

Recorded 2026-11-20. This is the starting point for turning HUSTLE from a single-owner tool into a paid SaaS. Prices and terms were read from official pages on this date; anything not confirmed from an official page is marked **unconfirmed**. None of this is legal advice.

## Decisions

| Decision | Choice | Effect on later phases |
|---|---|---|
| Customer | Solo freelance web designers and developers | Pitch engine, audits and the proposal-to-payment flow stay as they are. One user per workspace at launch; team seats later. |
| Market | Worldwide from day one, priced in USD | GDPR and UK/EU marketing rules apply at launch, so the legal phase must finish before a public launch. |
| Pricing | Monthly plans with quotas | Billing phase adds subscriptions and a monthly quota per workspace, replacing the global `GEMINI_DAILY_LIMIT` and `BRAVE_DAILY_LIMIT`. |
| Shared leads | Shared opt-outs only | `suppressions` stays global (no workspace filter). It is already keyed on email, phone, domain and profile URL. Every other table gets scoped to a workspace. |
| AI model | `gemini-3.8-flash` (done in this phase) | Set through `geminiModel()` in `src/lib/gemini.ts`; `GEMINI_MODEL` still overrides it. |

## AI model change

- `gemini-2.5-flash` is deprecated. From **1 December 2026** Google routes all its requests to `gemini-3.5-flash-lite`. ([models list](https://aistudio.google.com/docs/models))
- `gemini-3.8-flash` is the current stable Flash model. ([model page](https://aistudio.google.com/docs/models/gemini-3.8-flash))
- Price per 1M tokens, paid tier: **$0.75 input / $3.75 output until 31 Dec 2026, then $1.50 / $7.50 from 1 Jan 2027.** Output includes thinking tokens. ([pricing](https://aistudio.google.com/docs/pricing))
- Behaviour change: Gemini 3.8 thinks at `medium` level by default, which adds output tokens and latency. Google says to drop `temperature`, `top_p` and `top_k`; HUSTLE never set them, so no other call changes were needed. ([what's new in 3.8](https://aistudio.google.com/docs/whats-new-gemini-3.8))
- **Not yet confirmed:** that `responseJsonSchema` with `additionalProperties`, `minItems` and `maxItems` behaves the same on 3.8. The first real pitch after deploying is the live check. The existing Zod validation and fallback pitch catch bad output either way.
- **Tracking gap:** `ai_usage.output_tokens` records `candidatesTokenCount` only, so thinking tokens (billed as output) aren't counted. Fix this before quotas are built on it.

## Cost per lead

A fully worked lead = imported from search, audited, enriched, one pitch generated.

| Step | Call | Official price | Per lead |
|---|---|---|---|
| Search | Places Text Search. Phone, rating and website fields make it **Text Search Enterprise** (`src/lib/places.ts:67`) | $35 / 1,000 after 1,000 free a month ([pricing](https://developers.google.com/maps/billing-and-pricing/pricing)) | ~$0.002 (20 results per call) |
| Audit | Place Details. Same fields make it **Place Details Enterprise** (`src/lib/places.ts:89`) | $20 / 1,000 after 1,000 free a month | ~$0.020 |
| Enrich | 1 Brave web search (`src/lib/web-enrichment.ts:266`) | $5 / 1,000 (from the summary of Brave's page, **unconfirmed**) | ~$0.005 |
| AI | Gemini 3.8 Flash: audit summary + 3 pitch variants | see above | ~$0.02 now, ~$0.04 from Jan 2027 (**estimate**) |
| **Total** | | | **~$0.05 now, ~$0.065 from Jan 2027** |

The AI figure is an estimate: about 4k input and 4k output tokens per lead across both calls, counting medium thinking. Real numbers are in the `ai_usage` table on Turso once it counts thinking tokens. Setting `thinkingLevel: "low"` would probably cut the AI cost a lot; measure before and after.

The billing rule that matters: "the request is billed at the highest SKU rate among the fields requested." Dropping phone, rating and website from the Text Search field mask would move it to the cheaper Pro SKU ($25 / 1,000), but the search cost is already small.

## Draft plans (to test with beta users)

Quota unit: **lead credits**, one used when a lead is audited (where most of the cost is). Searches are capped separately so bulk imports can't be abused.

| Plan | Price | Lead credits / month | Worst-case API cost (2027 prices) | Margin after ~5% + $0.50 fee |
|---|---|---|---|---|
| Trial | Free, 14 days | 25 | ~$1.60 | n/a |
| Starter | $19 / mo | 150 | ~$10 | ~40% |
| Pro | $49 / mo | 400 | ~$26 | ~40% |

Worst case means every credit used and every lead fully worked; most users won't do that. To get margins back to ~60%: set thinking to `low`, or move prices to about $24 and $59. Decide after measuring real token use in the beta.

## Open questions

### 1. Google Places storage (blocks the workspace phase)
What the [Places policies page](https://developers.google.com/maps/documentation/places/web-service/policies) says:
- Not allowed: "copy and save business names, addresses, or user reviews" and "pre-fetch, index, store, or redistribute Google Maps Content outside the Services."
- Allowed: "You can therefore store place ID values indefinitely." Latitude and longitude for up to 30 days.
- Google's advice: store the place ID and "fetch fresh details when a user interacts with a place."
- Attribution: showing Places content needs a "Google Maps" logo or text, and links back to Google Maps.
- **Not read:** the [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) (the page didn't load in full). They give the exact rules and must be read before deciding.

HUSTLE currently stores name, address, phone, website and rating permanently in `businesses`. **Recommended direction:** treat Google as discovery only. Keep `place_id` for good. Store data HUSTLE gets elsewhere (the business's own website from the audit, contacts the user confirms). Re-fetch or expire Google-sourced fields instead of keeping them forever. Watch the cost: re-fetching details on every page view would be expensive, so the pipeline list should show HUSTLE's own data. Add Google Maps attribution wherever Places data is shown. This goes into the workspace-phase schema change.

### 2. Brave storage rights (blocks the workspace phase)
From the [Brave API terms](https://api-dashboard.search.brave.com/terms-of-service) (updated 1 Sep 2026):
- §3(b)(i) bans storing, caching or building a database of search results "in whole or in part, other than transient storage." Storage rights come only through a custom Order Form with Brave sales. No standard plan includes them.
- Use in a commercial product is allowed, but §4(c) says every end user must be bound by an agreement with obligations similar to §3(b), and §3(b)(xii) bans reselling or redistributing the results.
- `business_links` currently stores Brave result URLs permanently, which almost certainly counts as storing results.

**Recommended:** keep Brave results transient. Show the candidates for the user to confirm and store only what the user confirms or what was found on the business's own website. Otherwise, ask Brave sales for a storage-rights quote. Either way, the terms of service must include Brave's end-user obligations. Brave's page shows both "$5" and "Up to $20" in free monthly credit; check which applies.

### 3. Getting paid from Nigeria (blocks the billing phase)
Stripe doesn't open accounts for Nigerian businesses, so a Merchant of Record (which handles VAT and sales tax worldwide) is the route.

| Provider | Nigeria-based seller | Payouts | Fees | Notes |
|---|---|---|---|---|
| [Polar](https://polar.sh/docs/merchant-of-record/supported-countries.md) | Nigeria is on its payout country list (through Stripe Connect Express). Individuals allowed where Stripe allows them; for Nigeria this is **unconfirmed** | Manual payouts, 7-day hold, $10 minimum, Stripe payout fees on top | 5% + 50¢, +1.5% for non-US cards ([fees](https://polar.sh/docs/merchant-of-record/fees.md)) | Built-in subscriptions, usage metering, credits, customer portal, webhooks |
| [Paddle](https://www.paddle.com/pricing) | Nigeria not on the unsupported list. Whether an individual can sign up without a company is **unconfirmed** | Monthly, wire or Payoneer, $100 minimum, no NGN | 5% + 50¢ | Most established. Webhooks and portal not checked |
| [Dodo Payments](https://docs.dodopayments.com/miscellaneous/accepted-countries-and-territories.md) | **Not accepting new Nigerian sellers** (Nigeria is only grandfathered for existing merchants) | Not available to Nigeria | n/a | Ruled out |

**Recommended:** start the Polar signup and check whether a Nigerian individual passes Stripe Connect Express verification. Its credits and metering match the lead-credit quota model. Apply to Paddle at the same time as the fallback (slightly cheaper per sale for non-US cards). Nigerian customers paying in USD by card often get declined, so add Paystack in NGN later, not at launch.

### 4. Cold outreach rules by market (decided 2026-11-20)
**Decision: all markets are open at launch.** HUSTLE keeps its existing per-market safeguards instead of blocking countries: outside Nigeria, every campaign and lead needs a recorded compliance review before drafting (`src/lib/outreach-compliance.ts`), and `legalForm` separates companies from sole traders. The legal phase must make the user responsible for following their own market's rules (for example UK consent rules for sole traders, Germany's strict B2B email rules) and should show market-specific warnings.

### 5. Business registration (decided 2026-11-20)
**Decision: no CAC registration yet.** Sign up to the payment provider as an individual. That favours Polar, which allows individual sellers where Stripe Connect Express does; check Nigeria qualifies during signup. Paddle may require a company (unconfirmed). Revisit registration when revenue or the provider requires it.

### 6. Name and domain (needs your input)
"HUSTLE" is a common word. Check trademarks and domain availability before building the public landing page.
