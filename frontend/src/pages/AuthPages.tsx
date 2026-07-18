import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Link2, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// LOGIN PAGE
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const expiredSession = searchParams.get("expired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative py-12">
      {/* Background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-premium rounded-2xl mb-4 shadow-glow-primary">
            <Link2 className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-text">Sign In</h2>
          <p className="text-secondaryText text-sm mt-2">Access your distributed URL dashboard</p>
        </div>

        {expiredSession && (
          <div className="mb-6 p-3 rounded-lg border border-warning/30 bg-warning/10 text-warning text-xs text-center">
            Your session has expired. Please log in again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
              <input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-text text-sm"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:text-blue-400 font-medium"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                className="w-full pl-11 pr-10 py-3 rounded-xl glass-input text-text text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondaryText hover:text-text"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-sm text-secondaryText mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:text-blue-400 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

// REGISTER PAGE
export const RegisterPage: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await signup(data.name, data.email, data.password);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative py-12">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-premium rounded-2xl mb-4 shadow-glow-primary">
            <Link2 className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-text">Register</h2>
          <p className="text-secondaryText text-sm mt-2">Get started with short URLs & analytics</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
              <input
                type="text"
                {...register("name")}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-text text-sm"
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-error text-xs mt-1.5">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
              <input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-text text-sm"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Min. 8 characters"
                className="w-full pl-11 pr-10 py-3 rounded-xl glass-input text-text text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondaryText hover:text-text"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Register"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-sm text-secondaryText mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-blue-400 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

// FORGOT PASSWORD
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Verification token sent to your email!");
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-text">Forgot Password</h2>
          <p className="text-secondaryText text-sm mt-2">
            {!sent ? "Enter your email to receive a password reset token" : "Instructions have been sent"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-text text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl"
            >
              Send Reset Token
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-secondaryText">
              We've simulated a reset token dispatch to <strong className="text-text">{email}</strong>.
            </p>
            <Link
              to="/reset-password"
              className="inline-block w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
            >
              Proceed to Reset
            </Link>
          </div>
        )}
        <p className="text-center text-sm text-secondaryText mt-8">
          <Link to="/login" className="text-primary hover:text-blue-400 font-semibold">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// RESET PASSWORD
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Password reset successfully! Please log in.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-text">Reset Password</h2>
          <p className="text-secondaryText text-sm mt-2">Enter token and new password</p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              Reset Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter mock token (e.g. 123456)"
              className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};
