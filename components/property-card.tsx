"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = JSON.parse(property.images || "[]");
  
  // Fallback image if no images are provided
  const displayImages = images.length > 0 ? images : ["/placeholder-property.jpg"];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const listingType = property.listingType === "sell" || property.listingType === "rent"
    ? property.listingType
    : null;

  return (
    <Link href={`/properties/${property.id}`} className="block group cursor-pointer">
      <div className="relative aspect-[4/3.2] overflow-hidden rounded-xl bg-zinc-100 mb-3">
        <Image
          src={displayImages[currentImageIndex]}
          alt={property.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Image Navigation */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-zinc-800" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.map((_: string, idx: number) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Favorite Button */}
        <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors">
          <Heart className="w-6 h-6 text-white drop-shadow-md" />
        </button>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-zinc-900 shadow-sm">
          {property.type}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-zinc-900 truncate pr-4">{property.title}</h3>
          <div className="flex items-center gap-1 text-zinc-500 text-sm">
            <MapPin className="w-3 h-3" />
            <span>{property.city}</span>
          </div>
        </div>
        
        <p className="text-zinc-500 text-sm line-clamp-1">
          {property.description || "No description available"}
        </p>

        <div className="flex items-center gap-3 text-sm text-zinc-600 py-1">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms} beds</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms} baths</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              <span>{property.area} m²</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-semibold text-zinc-900">
            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: property.currency }).format(property.price)}
          </span>
          <span className="text-zinc-500 text-sm">
             {listingType === 'rent' ? '/ month' : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
