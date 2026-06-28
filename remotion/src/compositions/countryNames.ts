// Minimal ISO 3166-1 alpha-2 → display name map. Covers the countries offered in
// the frontend picker plus common football nations. Falls back to the uppercased
// code for anything not listed, so it never renders blank.
const COUNTRY_NAMES: Record<string, string> = {
  ZA: "South Africa",
  NG: "Nigeria",
  EG: "Egypt",
  MA: "Morocco",
  SN: "Senegal",
  GH: "Ghana",
  CM: "Cameroon",
  CI: "Ivory Coast",
  DZ: "Algeria",
  TN: "Tunisia",
  BR: "Brazil",
  AR: "Argentina",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  PT: "Portugal",
  GB: "England",
  IT: "Italy",
  NL: "Netherlands",
  BE: "Belgium",
  HR: "Croatia",
  US: "USA",
  MX: "Mexico",
  CA: "Canada",
  UY: "Uruguay",
  CO: "Colombia",
  JP: "Japan",
  KR: "South Korea",
  AU: "Australia",
  SA: "Saudi Arabia",
};

export function countryDisplayName(code: string): string {
  if (!code) return "";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
