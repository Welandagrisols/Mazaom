export const CATEGORIES = [
  { id: "feeds", name: "Feeds", icon: "box" },
  { id: "fertilizers", name: "Fertilizers", icon: "droplet" },
  { id: "pesticides", name: "Pesticides", icon: "target" },
  { id: "herbicides", name: "Herbicides", icon: "slash" },
  { id: "veterinary", name: "Veterinary", icon: "heart" },
  { id: "seeds", name: "Seeds", icon: "sun" },
  { id: "poultry", name: "Poultry", icon: "feather" },
  { id: "livestock", name: "Livestock", icon: "activity" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

export const UNITS = [
  { id: "kg", name: "Kilograms", abbr: "kg" },
  { id: "liters", name: "Liters", abbr: "L" },
  { id: "bags", name: "Bags", abbr: "bags" },
  { id: "packets", name: "Packets", abbr: "pkt" },
  { id: "pieces", name: "Pieces", abbr: "pcs" },
  { id: "bottles", name: "Bottles", abbr: "btl" },
  { id: "boxes", name: "Boxes", abbr: "box" },
] as const;

export type UnitId = typeof UNITS[number]["id"];

export const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: "dollar-sign" },
  { id: "mpesa", name: "M-Pesa", icon: "smartphone" },
  { id: "airtel", name: "Airtel Money", icon: "phone" },
  { id: "bank", name: "Bank Transfer", icon: "credit-card" },
  { id: "credit", name: "Credit", icon: "file-text" },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"];
