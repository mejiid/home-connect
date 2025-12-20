import React from "react";
import db from "@/lib/db";
import { Property } from "@/types";
import { PropertyCard } from "@/components/property-card";

type SearchParams = Record<string, string | string[] | undefined>;

function normalizeSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseNumberParam(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const Rent = ({
  searchParams,
}: {
  searchParams?: SearchParams;
}) => {
  const location = normalizeSingleParam(searchParams?.location)?.trim();
  const propertyType = normalizeSingleParam(searchParams?.type)?.trim();
  const minPrice = parseNumberParam(
    normalizeSingleParam(searchParams?.minPrice)?.trim()
  );
  const maxPrice = parseNumberParam(
    normalizeSingleParam(searchParams?.maxPrice)?.trim()
  );

  const conditions: string[] = [
    "status = 'Available'",
    "listingType = 'rent'",
  ];
  const params: Array<string | number> = [];

  if (location) {
    conditions.push("(lower(city) LIKE lower(?) OR lower(title) LIKE lower(?))");
    const like = `%${location}%`;
    params.push(like, like);
  }

  if (propertyType) {
    conditions.push("lower(type) = lower(?)");
    params.push(propertyType);
  }

  if (minPrice !== null) {
    conditions.push("price >= ?");
    params.push(minPrice);
  }

  if (maxPrice !== null) {
    conditions.push("price <= ?");
    params.push(maxPrice);
  }

  const sql = `SELECT * FROM properties WHERE ${conditions.join(" AND ")}`;
  const properties = db.prepare(sql).all(...params) as Property[];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Rent Properties
          </h1>
          <p className="text-zinc-500">
            Find your next home from our curated list of rental properties.
          </p>
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

export default Rent;
