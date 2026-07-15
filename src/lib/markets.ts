import { OUTREACH_CHANNELS, type OutreachChannel } from "./constants";

const COUNTRY_CODE_VALUES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY
QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ
VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`;

const CURRENCY_CODE_VALUES = `
AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL
BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUC CUP CVE CZK DJF DKK DOP DZD
EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS
INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD
LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK
NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK
SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH
UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWG
`;

const countryCodes = COUNTRY_CODE_VALUES.trim().split(/\s+/);
const currencyCodes = CURRENCY_CODE_VALUES.trim().split(/\s+/);

export type CountryCode = string;
export type CurrencyCode = string;

export const PACKAGE_KEYS = [
  "landingPageRescue",
  "completeBusinessWebsite",
  "bookingCatalogueWebsite",
] as const;
export type PackageKey = (typeof PACKAGE_KEYS)[number];
export type CampaignPackagePrices = Record<PackageKey, number>;

export const PACKAGE_NAMES: Record<PackageKey, string> = {
  landingPageRescue: "Landing page rescue",
  completeBusinessWebsite: "Complete business website",
  bookingCatalogueWebsite: "Booking or catalogue website",
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export const MARKETS = countryCodes
  .map((code) => ({
    code,
    name: code === "XK" ? "Kosovo" : (countryNames.of(code) ?? code),
    regionCode: code,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

export const CURRENCY_CODES = [...currencyCodes].sort();

const countryCodeSet = new Set(countryCodes);
const currencyCodeSet = new Set(currencyCodes);

// Brave Web Search accepts a smaller country-bias enum than its location
// headers. Unsupported markets remain explicit in the query text.
const braveCountryCodes = new Set(
  `AR AU AT BE BR CA CL DK FI FR DE HK IN ID IT JP KR MY MX NL NZ NO CN PL PT PH RU SA ZA ES SE CH TW TR GB US`.split(
    " ",
  ),
);

export function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized === "UK" ? "GB" : normalized;
}

export function isCountryCode(value: string): value is CountryCode {
  return countryCodeSet.has(normalizeCountryCode(value));
}

export function countryName(value: string) {
  const code = normalizeCountryCode(value);
  return code === "XK" ? "Kosovo" : (countryNames.of(code) ?? code);
}

export function googleRegionCode(value: string) {
  return normalizeCountryCode(value);
}

export function braveCountryCode(value: string) {
  const code = normalizeCountryCode(value);
  return braveCountryCodes.has(code) ? code.toLowerCase() : null;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return currencyCodeSet.has(value.trim().toUpperCase());
}

export function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function isOutreachChannel(value: string): value is OutreachChannel {
  return (OUTREACH_CHANNELS as readonly string[]).includes(value);
}

export function packagePricesFromCampaign(input: {
  landingPagePrice: number;
  completeWebsitePrice: number;
  bookingCataloguePrice: number;
}): CampaignPackagePrices {
  return {
    landingPageRescue: input.landingPagePrice,
    completeBusinessWebsite: input.completeWebsitePrice,
    bookingCatalogueWebsite: input.bookingCataloguePrice,
  };
}

export function packageKeyFromName(name: string | null | undefined): PackageKey {
  const match = PACKAGE_KEYS.find((key) => PACKAGE_NAMES[key] === name);
  return match ?? "completeBusinessWebsite";
}
