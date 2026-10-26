import { salesContacts } from "./business";

export const quoteAreas = {
  "eastern-cape": "Eastern Cape",
  "free-state": "Free State",
  "gauteng": "Gauteng",
  "kwazulu-natal": "KwaZulu-Natal",
  "limpopo": "Limpopo",
  "mpumalanga": "Mpumalanga",
  "north-west": "North West",
  "northern-cape": "Northern Cape",
  "western-cape": "Western Cape",
  "outside-sa": "Outside South Africa",
  "not-sure": "Not sure / please help me",
} as const;
export type QuoteArea = keyof typeof quoteAreas;
type RegionalRep = Exclude<typeof salesContacts[number]["name"], "Gary">;
export type QuoteTerritories = Partial<Record<Exclude<QuoteArea, "not-sure">, RegionalRep>>;
export const quoteCoordinator = salesContacts.find(contact => contact.name === "Gary")!;

// DCB-confirmed assignments. Gary coordinates areas without an assigned rep.
export const quoteTerritories: QuoteTerritories = {
  "western-cape": "Shane",
  "northern-cape": "Shane",
  "eastern-cape": "Shane",
  "kwazulu-natal": "Hans",
  "mpumalanga": "Hans",
  "limpopo": "Hans",
  "gauteng": "Sean",
  "free-state": "Sean",
  "north-west": "Sean",
};

export function isQuoteArea(area: string): area is QuoteArea {
  return Object.hasOwn(quoteAreas, area);
}
export function quoteAreaLabel(area: string) {
  return isQuoteArea(area) ? quoteAreas[area] : "Not specified";
}
export function getQuoteRouting(area: string, territories: QuoteTerritories = quoteTerritories) {
  const name = isQuoteArea(area) && area !== "not-sure" && Object.hasOwn(territories, area) ? territories[area] : undefined;
  const rep = salesContacts.find(contact => contact !== quoteCoordinator && contact.name === name);
  return { to: rep ?? quoteCoordinator, cc: rep ? quoteCoordinator : undefined };
}
