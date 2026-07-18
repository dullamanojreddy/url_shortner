import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Link2, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";

export const RedirectPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRedirect = async (submitPassword = "") => {
    setLoading(true);
    setError(null);
    try {
      // In demo mode or real mode, we fetch from public redirect gateway
      const response = await api.get(`/urls/public/${shortCode}`, {
        headers: submitPassword ? { "X-Link-Password": submitPassword } : {}
      });

      const { original_url, hasPassword } = response.data;

      if (hasPassword && !submitPassword) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      toast.success("Destination unlocked! Redirecting...");
      // Delay slightly for visual feedback
      setTimeout(() => {
        window.location.href = original_url;
      }, 800);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setNeedsPassword(true);
        setError(err.response.data?.error || "Password required.");
      } else {
        setError("This short link does not exist, has expired, or is disabled.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shortCode) {
      handleRedirect();
    }
  }, [shortCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter the password");
      return;
    }
    handleRedirect(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10 text-center space-y-6">
        <div className="inline-flex p-3 bg-gradient-premium rounded-2xl shadow-glow-primary">
          <Link2 className="h-8 w-8 text-white animate-pulse" />
        </div>

        {loading && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-text">Loading Destination...</h2>
            <p className="text-secondaryText text-sm">Verifying node redirection through API Gateway</p>
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mt-4"></div>
          </div>
        )}

        {needsPassword && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text flex items-center justify-center gap-2">
                <Lock className="h-5 w-5 text-accent animate-bounce" />
                <span>Password Protected</span>
              </h2>
              <p className="text-secondaryText text-sm">This short URL requires a password to access.</p>
            </div>

            <div className="space-y-1">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter link password"
                className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm"
              />
              {error && <p className="text-error text-xs text-left mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Unlock & Redirect</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {!loading && !needsPassword && error && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5 text-error animate-pulse" />
                <span>Link Unreachable</span>
              </h2>
              <p className="text-secondaryText text-sm">{error}</p>
            </div>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              Back to Shortener
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
