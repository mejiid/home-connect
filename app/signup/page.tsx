"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/client";

// Social login icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const RESEND_SECONDS = 45;
const OTP_LENGTH = 6;

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    "google" | "github" | null
  >(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get("notice")?.trim();

    if (!notice) {
      return;
    }

    // Only set the notice on the signup form step.
    if (step !== "form") {
      return;
    }

    setGeneralMessage((prev) => prev || notice);
  }, [searchParams, step]);

  useEffect(() => {
    if (!resendCooldown) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password
  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "otp") {
      return;
    }

    // Validate form
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // If there are errors, don't submit
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    setIsLoading(true);
    setGeneralMessage("");
    setOtpError("");

    try {
      const response = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = (await response.json()) as {
        message?: string;
        expiresAt?: string;
      };

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          email: data.message || "Unable to send verification code",
        }));
        setIsLoading(false);
        return;
      }

      setStep("otp");
      setGeneralMessage(
        data.message || "We sent a verification code to your email."
      );
      setOtpExpiresAt(data.expiresAt ?? null);
      setResendCooldown(RESEND_SECONDS);
      setIsLoading(false);
    } catch (error: any) {
      console.error("OTP request error:", error);
      setErrors((prev) => ({
        ...prev,
        email: error?.message || "Failed to send verification code",
      }));
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!otpCode.trim()) {
      setOtpError("Please enter the verification code you received.");
      return;
    }

    if (otpCode.trim().length !== OTP_LENGTH) {
      setOtpError(`Verification code must be ${OTP_LENGTH} digits.`);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const response = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.email.split("@")[0],
          code: otpCode,
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setOtpError(data.message || "Failed to verify the code");
        setIsVerifyingOtp(false);
        return;
      }

      setGeneralMessage(data.message || "Account created successfully.");

      const result = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        callbackURL: "/",
      });

      if (result.error) {
        console.error("Auto sign-in error:", result.error);
        setGeneralMessage(
          "Account verified. Please sign in with your email and password."
        );
        setIsVerifyingOtp(false);
        return;
      }

      window.location.href = "/";
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setOtpError(
        error?.message || "Failed to verify the code. Please try again."
      );
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || step !== "otp") {
      return;
    }

    setIsLoading(true);
    setOtpError("");
    setGeneralMessage("");

    try {
      const response = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = (await response.json()) as {
        message?: string;
        expiresAt?: string;
      };

      if (!response.ok) {
        setOtpError(data.message || "Unable to resend code right now.");
        setIsLoading(false);
        return;
      }

      setGeneralMessage(
        data.message || "We sent a fresh verification code to your email."
      );
      setOtpExpiresAt(data.expiresAt ?? null);
      setResendCooldown(RESEND_SECONDS);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      setOtpError("Failed to resend the code. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: "google" | "github") => {
    setSocialLoading(provider);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      console.log("Social login result:", result);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r  from-blue-50 via-white to-sky-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-zinc-200/60 shadow-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-r  from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
              <span className="text-2xl font-bold text-white">HC</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-base">
              Join HomeConnect to explore amazing properties
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "form" ? (
              <>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-medium hover:border-zinc-300 hover:bg-zinc-50"
                    onClick={() => handleSocialLogin("google")}
                    disabled={socialLoading !== null || isLoading}
                  >
                    {socialLoading === "google" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span>Continue with Google</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-medium hover:border-zinc-300 hover:bg-zinc-50"
                    onClick={() => handleSocialLogin("github")}
                    disabled={socialLoading !== null || isLoading}
                  >
                    {socialLoading === "github" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <GitHubIcon />
                    )}
                    <span>Continue with GitHub</span>
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-zinc-500">
                      or continue with
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {generalMessage && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                      {generalMessage}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      "Send verification code"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                  <p>We sent a verification code to {formData.email}.</p>
                  <p className="mt-1">
                    Enter the {OTP_LENGTH}-digit code to finish creating your
                    account.
                    {otpExpiresAt
                      ? ` The code expires at ${new Date(
                          otpExpiresAt
                        ).toLocaleTimeString()}.`
                      : ""}
                  </p>
                  {generalMessage && (
                    <p className="mt-2 text-blue-600">{generalMessage}</p>
                  )}
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      maxLength={OTP_LENGTH}
                      value={otpCode}
                      onChange={(event) => {
                        const value = event.target.value.replace(/[^0-9]/g, "");
                        setOtpCode(value);
                        if (otpError) {
                          setOtpError("");
                        }
                      }}
                      disabled={isVerifyingOtp}
                      className="tracking-[0.4em] text-lg"
                    />
                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {otpError}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      className="h-11 text-base font-semibold sm:flex-1"
                      disabled={isVerifyingOtp}
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        "Verify and create account"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 sm:w-48"
                      onClick={handleResendOtp}
                      disabled={
                        resendCooldown > 0 || isVerifyingOtp || isLoading
                      }
                    >
                      {resendCooldown > 0 ? (
                        <span>Resend in {resendCooldown}s</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Resend code
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                <p className="text-xs text-zinc-500">
                  Didn&apos;t get the email? Check your spam folder or resend
                  the code above.
                </p>
              </div>
            )}

            <p className="text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-zinc-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-zinc-700">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
