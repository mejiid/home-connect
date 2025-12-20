"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import hararHero from "@/app/images/harar.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type HeroSearchPayload = {
  listingType: "buy" | "rent";
  type?: string;
  minPrice?: number;
  maxPrice?: number;
};

type HeroProps = {
  onSearch?: (payload: HeroSearchPayload) => void | Promise<void>;
};

const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const router = useRouter();
  const [listingType, setListingType] = React.useState<"buy" | "rent">("buy");
  const [propertyType, setPropertyType] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [formError, setFormError] = React.useState("");

  const clearFilters = () => {
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setFormError("");
  };

  const toNumberOrNull = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    setFormError("");

    const params = new URLSearchParams();

    const trimmedPropertyType = propertyType.trim();
    if (trimmedPropertyType) {
      params.set("type", trimmedPropertyType);
    }

    const trimmedMin = minPrice.trim();
    if (trimmedMin) {
      params.set("minPrice", trimmedMin);
    }

    const trimmedMax = maxPrice.trim();
    if (trimmedMax) {
      params.set("maxPrice", trimmedMax);
    }

    const min = toNumberOrNull(minPrice);
    const max = toNumberOrNull(maxPrice);

    if ((minPrice.trim() && min === null) || (maxPrice.trim() && max === null)) {
      setFormError("Please enter valid numbers for price.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setFormError("Min price cannot be greater than max price.");
      return;
    }

    if (!trimmedPropertyType && !trimmedMin && !trimmedMax) {
      setFormError("Choose at least one filter, or click Browse all.");
      return;
    }

    if (onSearch) {
      void onSearch({
        listingType,
        type: trimmedPropertyType || undefined,
        minPrice: min ?? undefined,
        maxPrice: max ?? undefined,
      });
      return;
    }

    const basePath = listingType === "rent" ? "/rent" : "/buy";
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative min-h-[560px] py-10 sm:min-h-[640px] sm:py-14 lg:min-h-[680px] lg:py-16">
        <Image
          src={hararHero}
          alt="Harar city skyline and homes"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

        <div className="relative z-10">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="text-white">
              <div className="max-w-2xl text-left sm:max-w-3xl lg:max-w-4xl">
              <p className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
                Real estate • Harar
              </p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Find your next home in Harar.
              </h1>
              <p className="mt-5 text-base text-white/85 sm:text-lg">
                Browse homes for rent and sale, contact verified agents, and move
                faster with a clean, modern listing experience.
              </p>
              </div>

              <div className="mt-10 flex justify-center sm:mt-12">
                <form
                  onSubmit={handleSearch}
                  className="w-full max-w-5xl rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="lg:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-white/80">
                      Type
                    </label>
                    <select
                      value={listingType}
                      onChange={(e) =>
                        setListingType(
                          e.target.value === "rent" ? "rent" : "buy"
                        )
                      }
                      className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                      <option value="buy" className="text-zinc-900">
                        Buy
                      </option>
                      <option value="rent" className="text-zinc-900">
                        Rent
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-white/80">
                      Property type
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                      <option value="" className="text-zinc-900">
                        Any type
                      </option>
                      <option value="House" className="text-zinc-900">
                        House
                      </option>
                      <option value="Apartment" className="text-zinc-900">
                        Apartment
                      </option>
                      <option value="Villa" className="text-zinc-900">
                        Villa
                      </option>
                      <option value="Condo" className="text-zinc-900">
                        Condo
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/80">
                      Min price
                    </label>
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={minPrice}
                      onChange={(e) =>
                        setMinPrice(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="0"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-offset-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/80">
                      Max price
                    </label>
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={maxPrice}
                      onChange={(e) =>
                        setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="Any"
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-offset-transparent"
                    />
                  </div>

                  <div className="lg:flex lg:items-end">
                    <Button type="submit" size="lg" className="w-full">
                      Search homes
                    </Button>
                  </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-left text-xs font-medium text-white/80 hover:text-white"
                    >
                      Clear filters
                    </button>

                    {formError ? (
                      <p className="text-xs text-red-200">{formError}</p>
                    ) : (
                      <p className="text-xs text-white/70">
                        Leave filters empty to browse all.
                      </p>
                    )}
                  </div>
                </form>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="hidden sm:inline-flex">
                  <Link href="/buy">Browse all</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  <Link href="/sell">List a Property</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
