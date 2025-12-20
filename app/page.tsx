"use client";

import React from "react";

import Features from "@/components/futures";
import Hero, { HeroSearchPayload } from "@/components/hero";
import FilteredHomes from "@/components/filtered-homes";
import { Property } from "@/types";

const Home = () => {
  const [homes, setHomes] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleSearch = async (payload: HeroSearchPayload) => {
    setHasSearched(true);
    setIsLoading(true);
    setError("");
    setHomes([]);

    try {
      const params = new URLSearchParams();
      const apiListingType = payload.listingType === "buy" ? "sell" : "rent";
      params.set("listingType", apiListingType);

      if (payload.type) {
        params.set("type", payload.type);
      }
      if (typeof payload.minPrice === "number") {
        params.set("minPrice", String(payload.minPrice));
      }
      if (typeof payload.maxPrice === "number") {
        params.set("maxPrice", String(payload.maxPrice));
      }

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = (await response.json()) as
        | { properties: Property[] }
        | { error: string };

      if (!response.ok) {
        const message = "error" in data ? data.error : "Search failed";
        setError(message);
        return;
      }

      setHomes("properties" in data ? data.properties : []);
    } catch {
      setError("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <Hero onSearch={handleSearch} />
      <FilteredHomes homes={homes} isLoading={isLoading} error={error} hasSearched={hasSearched} />
      <Features />
    </main>
  );
};

export default Home;
