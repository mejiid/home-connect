"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const RESEND_SECONDS = 45;
const OTP_LENGTH = 6;

export default function ForgotPasswordPage() {
  const router = useRouter();
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
  const [step, setStep] = useState<"email" | "reset">("email");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);

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

  // Handle email submission
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setErrors(newErrors);

    // If there are errors, don't submit
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    setIsLoading(true);
    setGeneralMessage("");
    setOtpError("");

    try {
      const response = await fetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = (await response.json()) as {
        message?: string;
        expiresAt?: string;
        error?: string;
      };

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Unable to send password reset code";
        setErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }));
        setGeneralMessage("");
        setIsLoading(false);
        return;
      }

      setStep("reset");
      setGeneralMessage(
        data.message || "We sent a password reset code to your email. Please check your inbox and spam folder."
      );
      setOtpExpiresAt(data.expiresAt ?? null);
      setResendCooldown(RESEND_SECONDS);
      setIsLoading(false);
    } catch (error: unknown) {
      console.error("Password reset request error:", error);
      setErrors((prev) => ({
        ...prev,
        email: error instanceof Error ? error.message : "Failed to send password reset code",
      }));
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!otpCode.trim()) {
      setOtpError("Please enter the verification code you received.");
      return;
    }

    if (otpCode.trim().length !== OTP_LENGTH) {
      setOtpError(`Verification code must be ${OTP_LENGTH} digits.`);
      return;
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

    setIsResetting(true);
    setOtpError("");

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          code: otpCode,
        }),
      });

      const data = (await response.json()) as { 
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Failed to reset password";
        setOtpError(errorMessage);
        setGeneralMessage("");
        setIsResetting(false);
        return;
      }

      setGeneralMessage(data.message || "Password reset successfully!");
      
      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      setOtpError(
        error instanceof Error ? error.message : "Failed to reset password. Please try again."
      );
      setIsResetting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || step !== "reset") {
      return;
    }

    setIsLoading(true);
    setOtpError("");
    setGeneralMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = (await response.json()) as {
        message?: string;
        expiresAt?: string;
        error?: string;
      };

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Unable to resend code right now.";
        setOtpError(errorMessage);
        setGeneralMessage("");
        setIsLoading(false);
        return;
      }

      setGeneralMessage(
        data.message || "We sent a fresh password reset code to your email."
      );
      setOtpExpiresAt(data.expiresAt ?? null);
      setResendCooldown(RESEND_SECONDS);
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      setOtpError("Failed to resend the code. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-sky-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-zinc-200/60 shadow-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
              <span className="text-2xl font-bold text-white">HC</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === "email" ? "Reset your password" : "Enter new password"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === "email"
                ? "Enter your email to receive a password reset code"
                : "Enter the code and your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "email" ? (
              <form onSubmit={handleSubmitEmail} className="space-y-4">
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
                    "Send reset code"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                {generalMessage && !otpError && (
                  <div className="rounded-lg border border-green-200 bg-green-50/80 px-4 py-3 text-sm text-green-700">
                    {generalMessage}
                  </div>
                )}

                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                  <p>We sent a password reset code to {formData.email}.</p>
                  <p className="mt-1">
                    Enter the {OTP_LENGTH}-digit code and your new password.
                    {otpExpiresAt
                      ? ` The code expires at ${new Date(
                          otpExpiresAt
                        ).toLocaleTimeString()}.`
                      : ""}
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
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
                      disabled={isResetting}
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

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
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
                        disabled={isResetting}
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                        disabled={isResetting}
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

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      className="h-11 text-base font-semibold sm:flex-1"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Resetting password...</span>
                        </>
                      ) : (
                        "Reset password"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 sm:w-48"
                      onClick={handleResendOtp}
                      disabled={
                        resendCooldown > 0 || isResetting || isLoading
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
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

