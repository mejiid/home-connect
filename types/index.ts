export interface Property {
  id: string;
  title: string;
  description: string | null;
  /** 'rent' | 'sell' (may be undefined for legacy rows before migration) */
  listingType?: "rent" | "sell" | string | null;
  type: string;
  city: string;
  kebele: string | null;
  woreda: string | null;
  street: string | null;
  landmarks: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
  ownerId: string | null;
  ownerAltPhone: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  kitchens: number | null;
  livingRooms: number | null;
  floors: number | null;
  area: number | null;
  furnished: number; // 0 or 1
  water: number; // 0 or 1
  electricity: string | null;
  internet: number; // 0 or 1
  parking: number; // 0 or 1
  price: number;
  currency: string;
  priceNegotiable: number; // 0 or 1
  condition: string | null;
  yearBuilt: number | null;
  renovationStatus: string | null;
  images: string; // JSON string
  status: string;
  createdAt: string;
  updatedAt: string;
  agentId: string | null;
}
