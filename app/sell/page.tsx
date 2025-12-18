"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Upload,
  FileText,
  Map,
  User,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/client";

const SellPage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    woreda: "",
    kebele: "",
    village: "",
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [homeMap, setHomeMap] = useState<File | null>(null);
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState<string>("");
  const [homeMapUrl, setHomeMapUrl] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    identity: boolean;
    homeMap: boolean;
  }>({
    identity: false,
    homeMap: false,
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto-fill full name from session
  useEffect(() => {
    if (session?.user?.name && !formData.fullName) {
      setFormData((prev) => ({ ...prev, fullName: session.user.name || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  // Upload file to ImageKit
  const uploadToImageKit = async (
    file: File,
    fileName: string
  ): Promise<string> => {
    try {
      // Upload via our server (avoids browser CORS/network issues)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);

      const uploadResponse = await fetch("/api/imagekit/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch {
          errorMessage = `${errorMessage} (${uploadResponse.status} ${uploadResponse.statusText})`;
        }
        throw new Error(errorMessage);
      }

      let uploadData;
      try {
        uploadData = await uploadResponse.json();
      } catch (parseError) {
        throw new Error("Failed to parse upload response from ImageKit");
      }
      
      if (!uploadData || !uploadData.url) {
        throw new Error("Upload succeeded but no URL was returned from ImageKit");
      }

      return uploadData.url;
    } catch (error) {
      console.error("ImageKit upload error:", error);
      // Re-throw with a more user-friendly message if needed
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during upload");
    }
  };

  // Handle identity document upload
  const handleIdentityDocumentChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        identityDocument: "Please upload a valid image (JPEG, PNG) or PDF file",
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        identityDocument: "File size must be less than 10MB",
      }));
      return;
    }

    setIdentityDocument(file);
    setErrors((prev) => ({ ...prev, identityDocument: "" }));
    setUploadProgress((prev) => ({ ...prev, identity: true }));

    try {
      const fileName = `identity-${Date.now()}-${file.name}`;
      const url = await uploadToImageKit(file, fileName);
      setIdentityDocumentUrl(url);
      setUploadProgress((prev) => ({ ...prev, identity: false }));
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        identityDocument: error.message || "Failed to upload document",
      }));
      setUploadProgress((prev) => ({ ...prev, identity: false }));
      setIdentityDocument(null);
    }
  };

  // Handle home map upload
  const handleHomeMapChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        homeMap: "Please upload a valid image (JPEG, PNG) or PDF file",
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        homeMap: "File size must be less than 10MB",
      }));
      return;
    }

    setHomeMap(file);
    setErrors((prev) => ({ ...prev, homeMap: "" }));
    setUploadProgress((prev) => ({ ...prev, homeMap: true }));

    try {
      const fileName = `home-map-${Date.now()}-${file.name}`;
      const url = await uploadToImageKit(file, fileName);
      setHomeMapUrl(url);
      setUploadProgress((prev) => ({ ...prev, homeMap: false }));
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        homeMap: error.message || "Failed to upload document",
      }));
      setUploadProgress((prev) => ({ ...prev, homeMap: false }));
      setHomeMap(null);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }
    if (!formData.woreda.trim()) {
      newErrors.woreda = "Woreda is required";
    }
    if (!formData.kebele.trim()) {
      newErrors.kebele = "Kebele is required";
    }
    if (!formData.village.trim()) {
      newErrors.village = "Village is required";
    }
    if (!identityDocumentUrl) {
      newErrors.identityDocument = "Please upload an identity document";
    }
    if (!homeMapUrl) {
      newErrors.homeMap = "Please upload a government home map";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/sell/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          identityDocumentUrl,
          homeMapUrl,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit form";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // Add details if available (in development mode)
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          
          // Add missing fields if available
          if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
            errorMessage += ` Missing fields: ${errorData.missingFields.join(", ")}`;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Submission successful:", result);

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        fullName: session?.user?.name || "",
        phoneNumber: "",
        woreda: "",
        kebele: "",
        village: "",
      });
      setIdentityDocument(null);
      setHomeMap(null);
      setIdentityDocumentUrl("");
      setHomeMapUrl("");

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "An error occurred. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign in/sign up message for non-authenticated users
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-zinc-200/60 shadow-xl">
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
                <Home className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Authentication Required
              </CardTitle>
              <CardDescription className="text-base">
                You must sign in or sign up first before you can sell your home.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/signin")}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  variant="outline"
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show form for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
              Sell Your Home
        </h1>
            <p className="text-lg text-zinc-600">
              Welcome, {session.user.name || "User"}! Fill out the form to list
              your home for sale.
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Your submission has been received successfully! We'll review it
                and get back to you soon.
              </p>
            </motion.div>
          )}

          {/* Form */}
          <Card className="border-zinc-200/60 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Property Information</CardTitle>
              <CardDescription>
                Please provide all the required information to list your home
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Woreda */}
                <div className="space-y-2">
                  <Label htmlFor="woreda" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Woreda
                  </Label>
                  <Input
                    id="woreda"
                    name="woreda"
                    type="text"
                    value={formData.woreda}
                    onChange={handleInputChange}
                    placeholder="Enter your woreda"
                    className={errors.woreda ? "border-red-500" : ""}
                  />
                  {errors.woreda && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.woreda}
                    </p>
                  )}
                </div>

                {/* Kebele */}
                <div className="space-y-2">
                  <Label htmlFor="kebele" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Kebele
                  </Label>
                  <Input
                    id="kebele"
                    name="kebele"
                    type="text"
                    value={formData.kebele}
                    onChange={handleInputChange}
                    placeholder="Enter your kebele"
                    className={errors.kebele ? "border-red-500" : ""}
                  />
                  {errors.kebele && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.kebele}
                    </p>
                  )}
                </div>

                {/* Village */}
                <div className="space-y-2">
                  <Label htmlFor="village" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Village
                  </Label>
                  <Input
                    id="village"
                    name="village"
                    type="text"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Enter your village"
                    className={errors.village ? "border-red-500" : ""}
                  />
                  {errors.village && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.village}
                    </p>
                  )}
                </div>

                {/* Upload Identity Document */}
                <div className="space-y-2">
                  <Label
                    htmlFor="identityDocument"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Upload Identity Document
                  </Label>
                  <p className="text-sm text-zinc-500 mb-2">
                    Accepted: Passport, National ID, Kebele ID, or Driving
                    License (JPEG, PNG, or PDF, max 10MB)
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      id="identityDocument"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleIdentityDocumentChange}
                      className="cursor-pointer"
                      disabled={uploadProgress.identity}
                    />
                    {uploadProgress.identity && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                    {identityDocumentUrl && !uploadProgress.identity && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {errors.identityDocument && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.identityDocument}
                    </p>
                  )}
                  {identityDocumentUrl && !errors.identityDocument && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Document uploaded successfully
                    </p>
                  )}
                </div>

                {/* Upload Government Home Map */}
                <div className="space-y-2">
                  <Label htmlFor="homeMap" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Upload Government Home Map
                  </Label>
                  <p className="text-sm text-zinc-500 mb-2">
                    Upload an image or document of your government home map
                    (JPEG, PNG, or PDF, max 10MB)
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      id="homeMap"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleHomeMapChange}
                      className="cursor-pointer"
                      disabled={uploadProgress.homeMap}
                    />
                    {uploadProgress.homeMap && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                    {homeMapUrl && !uploadProgress.homeMap && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {errors.homeMap && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.homeMap}
                    </p>
                  )}
                  {homeMapUrl && !errors.homeMap && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Home map uploaded successfully
                    </p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || uploadProgress.identity || uploadProgress.homeMap}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Listing"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SellPage;
