"use client";

import React from "react";
import { Property } from "@/types";
import { PropertyCard } from "@/components/property-card";

type FilteredHomesProps = {
  homes: Property[];
  isLoading?: boolean;
  error?: string;
  hasSearched?: boolean;
};

export default function FilteredHomes({
  homes,
  isLoading = false,
  error = "",
  hasSearched = false,
}: FilteredHomesProps) {
  const shouldHide = !hasSearched;

  return (
    <section
      aria-label="Filtered homes"
      className={shouldHide ? "hidden" : "py-16 bg-white"}
    >
      <div className="container mx-auto px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-sora font-bold text-harar-dark">
              Filtered homes
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {isLoading
                ? "Searching…"
                : error
                  ? error
                  : homes.length > 0
                    ? `Showing ${homes.length} result${homes.length === 1 ? "" : "s"}.`
                    : "No homes matched your filters."}
            </p>
          </div>
        </div>

        {isLoading ? null : homes.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
            {homes.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
