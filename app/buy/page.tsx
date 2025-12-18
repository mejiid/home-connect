import React from "react";
import db from "@/lib/db";
import { Property } from "@/types";
import { PropertyCard } from "@/components/property-card";

const Buy = () => {
  const properties = db
    .prepare("SELECT * FROM properties WHERE status = 'Available' AND listingType = 'sell'")
    .all() as Property[];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Buy Properties</h1>
          <p className="text-zinc-500">Explore properties available for purchase.</p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-zinc-900">No properties found</h3>
            <p className="text-zinc-500 mt-2">Check back later for new listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-x-10 gap-y-12">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Buy;
