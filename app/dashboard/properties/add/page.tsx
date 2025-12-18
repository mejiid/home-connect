"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Zap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { authClient } from "@/lib/client";

export default function AddPropertyPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    listingType: "rent",
    type: "",
    city: "Harari",
    kebele: "",
    woreda: "",
    street: "",
    landmarks: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerId: "",
    ownerAltPhone: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    floors: "",
    area: "",
    furnished: false,
    water: false,
    electricity: "Prepaid",
    internet: false,
    parking: false,
    price: "",
    currency: "ETB",
    priceNegotiable: false,
    condition: "New",
    yearBuilt: "",
    renovationStatus: "",
    images: [] as string[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImagesUploaded = (urls: string[]) => {
    setFormData((prev) => ({ ...prev, images: urls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit property");
      }

      setSubmitSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => {
        const destination =
          userRole === "admin"
            ? "/dashboard/admin"
            : userRole === "agent"
              ? "/dashboard/agent"
              : "/dashboard";
        router.push(destination);
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit property";
      setError(message);
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const userRole =
    session?.user && typeof (session.user as unknown as { role?: unknown }).role === "string"
      ? (session.user as unknown as { role: string }).role
      : null;

  if (!session || (userRole !== "admin" && userRole !== "agent")) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                <p className="text-zinc-600">You must be an admin or agent to access this page.</p>
                <Button onClick={() => router.push("/")} className="mt-4">Go Home</Button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Add New Property</h1>
          <p className="text-zinc-600 mt-2">
            Fill in the details below to list a new property on the dashboard.
          </p>
        </div>

        {submitSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-8 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Property Listed Successfully!
            </h2>
            <p className="text-green-700">
              Redirecting you to the dashboard...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            {/* 1. Basic House Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="col-span-2">
                  <Label htmlFor="title">Property Title / Short Name *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Modern Villa in Harar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="listingType">Listing Type *</Label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleInputChange}
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="rent">Rent</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="type">Property Type *</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select type</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Condo">Condo</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* 2. Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="kebele">Kebele</Label>
                  <Input
                    id="kebele"
                    name="kebele"
                    value={formData.kebele}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="woreda">Woreda</Label>
                  <Input
                    id="woreda"
                    name="woreda"
                    value={formData.woreda}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="street">Street / Village Name</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="landmarks">Nearby Landmarks (Optional)</Label>
                  <Input
                    id="landmarks"
                    name="landmarks"
                    value={formData.landmarks}
                    onChange={handleInputChange}
                    placeholder="e.g. Near the main market"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Owner / Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Owner / Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="ownerName">Full Name *</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerPhone">Phone Number *</Label>
                  <Input
                    id="ownerPhone"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email (Optional)</Label>
                  <Input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerId">ID Number (Optional)</Label>
                  <Input
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerAltPhone">
                    Alternative Contact (Optional)
                  </Label>
                  <Input
                    id="ownerAltPhone"
                    name="ownerAltPhone"
                    value={formData.ownerAltPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4. House Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  House Features
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="kitchens">Kitchens</Label>
                  <Input
                    id="kitchens"
                    name="kitchens"
                    type="number"
                    value={formData.kitchens}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="livingRooms">Living Rooms</Label>
                  <Input
                    id="livingRooms"
                    name="livingRooms"
                    type="number"
                    value={formData.livingRooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="floors">Floors</Label>
                  <Input
                    id="floors"
                    name="floors"
                    type="number"
                    value={formData.floors}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Total Area (m²)</Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    value={formData.area}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 5. Utilities & Facilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Utilities & Facilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCheckboxChange("furnished", e.target.checked)
                      }
                    />
                    <Label htmlFor="furnished">Furniture Included</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="water"
                      checked={formData.water}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCheckboxChange("water", e.target.checked)
                      }
                    />
                    <Label htmlFor="water">Water Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internet"
                      checked={formData.internet}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCheckboxChange("internet", e.target.checked)
                      }
                    />
                    <Label htmlFor="internet">Internet Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="parking"
                      checked={formData.parking}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCheckboxChange("parking", e.target.checked)
                      }
                    />
                    <Label htmlFor="parking">Parking Available</Label>
                  </div>
                </div>
                <div className="pt-4">
                  <Label htmlFor="electricity">Electricity</Label>
                  <select
                    id="electricity"
                    name="electricity"
                    value={formData.electricity}
                    onChange={handleInputChange}
                    className="flex h-10 w-full md:w-1/3 mt-1 items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="Postpaid">Postpaid</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* 6. Price Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Price Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">Price (Sale or Monthly Rent) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox
                    id="priceNegotiable"
                    checked={formData.priceNegotiable}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCheckboxChange("priceNegotiable", e.target.checked)
                    }
                  />
                  <Label htmlFor="priceNegotiable">Price Negotiable</Label>
                </div>
              </CardContent>
            </Card>

            {/* 7. Property Condition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Property Condition
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="renovationStatus">Renovation Status</Label>
                  <Input
                    id="renovationStatus"
                    name="renovationStatus"
                    value={formData.renovationStatus}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">
                    Additional Notes / Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 8. Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Property Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onUploadComplete={handleImagesUploaded}
                  maxImages={8}
                  label="Upload Exterior & Interior Pictures (At least 3 recommended)"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Property"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
