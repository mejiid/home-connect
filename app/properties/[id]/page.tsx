import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPin,
  Share,
  Heart,
  Check,
  Home,
  BedDouble,
  Bath,
  Ruler,
} from "lucide-react";
import db from "@/lib/db";
import { Property } from "@/types";
import ContactAgent, { AgentInfo } from "@/components/contact-agent";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = db.prepare("SELECT * FROM properties WHERE id = ?").get(id) as Property;

  if (!property) {
    notFound();
  }

  const listingType = property.listingType === "rent" || property.listingType === "sell"
    ? property.listingType
    : null;

  const images = JSON.parse(property.images || "[]");
  const displayImages = images.length > 0 ? images : ["/placeholder-property.jpg"];

  const formattedPrice = new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: property.currency,
    maximumFractionDigits: 0,
  }).format(property.price);

  const userHasPhoneColumn = () => {
    const columns = db.prepare('PRAGMA table_info("user")').all() as Array<{
      name: string;
    }>;
    return columns.some((column) => column.name === "phone");
  };

  const includeAgentPhone = userHasPhoneColumn();
  const agent = property.agentId
    ? ((db
        .prepare(
          includeAgentPhone
            ? 'SELECT id, name, email, phone FROM "user" WHERE id = ?'
            : 'SELECT id, name, email FROM "user" WHERE id = ?'
        )
        .get(property.agentId) as AgentInfo | undefined) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{property.title}</h1>
          <div className="flex items-center justify-end gap-4">
            <button className="flex items-center gap-2 text-zinc-900 hover:bg-zinc-100 px-3 py-2 rounded-lg transition-colors">
              <Share className="w-4 h-4" />
              <span className="underline font-medium">Share</span>
            </button>
            <button className="flex items-center gap-2 text-zinc-900 hover:bg-zinc-100 px-3 py-2 rounded-lg transition-colors">
              <Heart className="w-4 h-4" />
              <span className="underline font-medium">Save</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          <div className="md:col-span-2 relative h-full">
            <Image
              src={displayImages[0]}
              alt={property.title}
              fill
              className="object-cover hover:opacity-95 transition-opacity cursor-pointer"
            />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
            <div className="relative h-full">
              <Image
                src={displayImages[1] || displayImages[0]}
                alt="Property view"
                fill
                className="object-cover hover:opacity-95 transition-opacity cursor-pointer"
              />
            </div>
            <div className="relative h-full">
              <Image
                src={displayImages[2] || displayImages[0]}
                alt="Property view"
                fill
                className="object-cover hover:opacity-95 transition-opacity cursor-pointer"
              />
            </div>
          </div>
          <div className="hidden md:grid grid-rows-2 gap-2 h-full">
            <div className="relative h-full">
              <Image
                src={displayImages[3] || displayImages[0]}
                alt="Property view"
                fill
                className="object-cover hover:opacity-95 transition-opacity cursor-pointer"
              />
            </div>
            <div className="relative h-full">
              <Image
                src={displayImages[4] || displayImages[0]}
                alt="Property view"
                fill
                className="object-cover hover:opacity-95 transition-opacity cursor-pointer"
              />
              {displayImages.length > 5 && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                  <span className="text-white font-semibold text-lg">Show all photos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2 border-b border-zinc-200 pb-6">
              <h2 className="text-xl font-semibold text-zinc-900">Location</h2>
              <div className="flex items-start gap-2 text-zinc-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div>{property.city}</div>
                  {property.kebele && <div>Kebele: {property.kebele}</div>}
                  <div>Woreda: {property.woreda}</div>
                </div>
              </div>
            </div>

            <div className="border-b border-zinc-200 pb-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">What this place offers</h2>
              <div className="flex flex-col gap-4">
                {property.water === 1 && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Check className="w-5 h-5" />
                    <span>Water Supply</span>
                  </div>
                )}
                {property.electricity && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Check className="w-5 h-5" />
                    <span>Electricity ({property.electricity})</span>
                  </div>
                )}
                {property.condition && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Check className="w-5 h-5" />
                    <span>Condition: {property.condition}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-zinc-200 pb-6">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-3">Home Futures</h2>
              <div className="flex flex-col gap-1 text-zinc-600">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 shrink-0" />
                  <span>{property.type}</span>
                </div>
                {property.bedrooms ? (
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <span>{property.bedrooms} bedrooms</span>
                  </div>
                ) : null}
                {property.bathrooms ? (
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 shrink-0" />
                    <span>{property.bathrooms} baths</span>
                  </div>
                ) : null}
                {property.area ? (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 shrink-0" />
                    <span>{property.area} m²</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 border-b border-zinc-200 pb-6">
              {property.furnished === 1 && (
                <div className="flex gap-4">
                  <Check className="w-6 h-6 text-zinc-900" />
                  <div>
                    <h3 className="font-semibold text-zinc-900">Furnished</h3>
                    <p className="text-zinc-500">This property comes fully furnished.</p>
                  </div>
                </div>
              )}
              {property.parking === 1 && (
                <div className="flex gap-4">
                  <Check className="w-6 h-6 text-zinc-900" />
                  <div>
                    <h3 className="font-semibold text-zinc-900">Parking available</h3>
                    <p className="text-zinc-500">Includes free parking on the premises.</p>
                  </div>
                </div>
              )}
              {property.internet === 1 && (
                <div className="flex gap-4">
                  <Check className="w-6 h-6 text-zinc-900" />
                  <div>
                    <h3 className="font-semibold text-zinc-900">Fast Wifi</h3>
                    <p className="text-zinc-500">Stay connected with high-speed internet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-b border-zinc-200 pb-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">About this place</h2>
              <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                {property.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-zinc-200 rounded-xl p-6 shadow-xl shadow-zinc-100">
              <div className="flex justify-between items-baseline mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-zinc-900">{formattedPrice}</span>
                  <span className="text-zinc-500">{listingType === "rent" ? "/ month" : ""}</span>
                </div>
                {property.priceNegotiable === 1 && (
                  <span className="text-sm text-green-600 font-medium">Negotiable</span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="border border-zinc-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-zinc-800 uppercase mb-1">Status</div>
                  <div className="text-zinc-600">{property.status}</div>
                </div>
                <div className="border border-zinc-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-zinc-800 uppercase mb-1">Listed</div>
                  <div className="text-zinc-600">{new Date(property.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <ContactAgent agent={agent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
