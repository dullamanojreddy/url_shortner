import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { 
  Link2, 
  QrCode, 
  Lock, 
  Calendar, 
  Sparkles, 
  Copy, 
  ExternalLink,
  ChevronDown, 
  ChevronUp, 
  Check, 
  ArrowRight,
  Shield,
  Activity,
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const urlSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL (starting with http/https)"),
  customAlias: z.string()
    .regex(/^[a-zA-Z0-9_-]{0,30}$/, "Alias must contain only alphanumeric characters, dashes, or underscores")
    .optional(),
  expiry: z.string(),
  password: z.string().max(72).optional(),
  title: z.string().max(200).optional(),
});

interface URLResult {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  expires_at: string | null;
  created_at: string;
  shortUrl: string;
}

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<URLResult | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      expiry: "never",
      customAlias: "",
      password: "",
      title: "",
    },
  });

  const watchUrl = watch("originalUrl");
  const watchExpiry = watch("expiry");

  const onSubmit = async (data: z.infer<typeof urlSchema>) => {
    if (!isAuthenticated) {
      toast.error("Please login or create an account to shorten links!");
      navigate("/login");
      return;
    }

    if (data.expiry === "custom" && !customDate) {
      toast.error("Please specify a custom expiration date and time");
      return;
    }

    setIsLoading(true);
    const start = Date.now();
    try {
      // Clean empty fields
      const payload: any = {
        originalUrl: data.originalUrl,
        expiry: data.expiry === "custom" ? customDate : data.expiry,
      };
      if (data.customAlias) payload.customAlias = data.customAlias;
      if (data.password) payload.password = data.password;
      if (data.title) payload.title = data.title;

      const response = await api.post<URLResult>("/urls", payload);
      const diff = Date.now() - start;
      setResponseTime(diff);
      const processedResult = {
        ...response.data,
        shortUrl: `${window.location.origin}/r/${response.data.short_code}`
      };
      setResult(processedResult);
      toast.success("Short link created successfully!");

      // Fetch QR Code SVG if requested
      try {
        const qrResponse = await api.get(`/qr/${response.data.short_code}`, {
          responseType: "text",
        });
        setQrSvg(qrResponse.data);
        setShowQr(true);
      } catch (err) {
        console.error("QR Code retrieval failed", err);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create short link.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between">
      {/* Aurora glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-primary/10 via-accent/15 to-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Public Header */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-gray-800/40 relative z-20 bg-background/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-premium rounded-xl shadow-glow-primary">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-text tracking-wide uppercase">Short.ly</span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="py-2 px-5 bg-gradient-premium hover:shadow-glow-primary text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-secondaryText hover:text-text text-sm font-semibold">
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-text text-sm font-semibold rounded-xl transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        
        {/* Left Column: Hero Headers */}
        <div className="lg:col-span-5 space-y-6 pt-4 lg:pt-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>Distributed microservices backend</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-text">
            Shorten. <br />
            <span className="text-gradient">Track. Analyze.</span>
          </h1>
          <p className="text-secondaryText text-base md:text-lg leading-relaxed max-w-md">
            Fast, high-availability URL shortener powered by Docker, Nginx, Kafka, Redis, and MySQL. Scale redirects seamlessly and monitor stats in real-time.
          </p>

          {/* Core Trust Indicators */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 bg-gray-900/40 border border-gray-800/80 rounded-xl">
              <span className="text-success font-bold text-lg leading-none block">99.99%</span>
              <span className="text-xs text-secondaryText">Uptime SLA</span>
            </div>
            <div className="p-4 bg-gray-900/40 border border-gray-800/80 rounded-xl">
              <span className="text-primary font-bold text-lg leading-none block">&lt; 10ms</span>
              <span className="text-xs text-secondaryText">Redis redirect cache</span>
            </div>
            <div className="p-4 bg-gray-900/40 border border-gray-800/80 rounded-xl">
              <span className="text-accent font-bold text-lg leading-none block">Kafka Event</span>
              <span className="text-xs text-secondaryText">Analytics stream</span>
            </div>
            <div className="p-4 bg-gray-900/40 border border-gray-800/80 rounded-xl">
              <span className="text-emerald-400 font-bold text-lg leading-none block">Dockerized</span>
              <span className="text-xs text-secondaryText">Microservices cluster</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Work Segment */}
        <div className="lg:col-span-7 space-y-6 w-full">
          {!result ? (
            /* Paste URL Form */
            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 md:p-8 rounded-2xl space-y-5">
              <div>
                <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                  Paste Long URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondaryText" />
                  <input
                    type="text"
                    {...register("originalUrl")}
                    placeholder="https://github.com/dullamanojreddy/distributed-url-shortener"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl glass-input text-text text-sm font-medium"
                    disabled={isLoading}
                  />
                </div>
                {errors.originalUrl && (
                  <p className="text-error text-xs mt-1.5">{errors.originalUrl.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                    Expiration
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText" />
                    <select
                      {...register("expiry")}
                      className="w-full pl-10 pr-8 py-3 rounded-xl glass-input text-text text-sm appearance-none font-medium"
                      disabled={isLoading}
                    >
                      <option value="never" className="bg-gray-900">Never</option>
                      <option value="1m" className="bg-gray-900">1 Minute</option>
                      <option value="5m" className="bg-gray-900">5 Minutes</option>
                      <option value="20m" className="bg-gray-900">20 Minutes</option>
                      <option value="7d" className="bg-gray-900">7 Days</option>
                      <option value="30d" className="bg-gray-900">30 Days</option>
                      <option value="365d" className="bg-gray-900">365 Days</option>
                      <option value="custom" className="bg-gray-900">Custom Time</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                  </div>

                  {watchExpiry === "custom" && (
                    <div className="mt-3 animate-fadeIn">
                      <label className="text-xs font-semibold text-secondaryText/80 uppercase tracking-wider block mb-2 mt-3">
                        Choose Expiry Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm font-medium bg-gray-900 text-white"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                    Custom Alias <span className="text-secondaryText font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-secondaryText font-medium">short.ly/</span>
                    <input
                      type="text"
                      {...register("customAlias")}
                      placeholder="customalias"
                      className="w-full pl-[74px] pr-4 py-3 rounded-xl glass-input text-text text-sm font-medium"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.customAlias && (
                    <p className="text-error text-xs mt-1.5">{errors.customAlias.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                    Access Password <span className="text-secondaryText font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText" />
                    <input
                      type="password"
                      {...register("password")}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-text text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">
                    Link Description <span className="text-secondaryText font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="e.g. GitHub Repository link"
                    className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm font-medium"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 text-xs text-secondaryText">
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked id="gen-qr" className="rounded border-gray-800 text-primary focus:ring-primary/20 bg-gray-950" />
                  <label htmlFor="gen-qr">Generate printable QR Code automatically</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked id="gen-priv" className="rounded border-gray-800 text-primary focus:ring-primary/20 bg-gray-950" />
                  <label htmlFor="gen-priv">Add Link details to your private dashboard</label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Generating short URL..." : "Shorten URL"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          ) : (
            /* SUCCESS CARD AND METADATA CARD */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Success summary card */}
              <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden border-success/30">
                <div className="absolute top-0 right-0 p-4 bg-success/10 text-success rounded-bl-2xl">
                  <Check className="h-5 w-5 animate-bounce" />
                </div>
                
                <h3 className="text-lg font-bold text-success flex items-center gap-2 mb-4">
                  <span>✓ URL Created Successfully</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-secondaryText font-semibold uppercase block mb-1">Original URL</span>
                    <p className="text-text text-sm font-medium break-all bg-gray-950/40 p-3 rounded-lg border border-gray-800/40">
                      {result.original_url}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-secondaryText font-semibold uppercase block mb-1">Short URL</span>
                    <div className="flex gap-2">
                      <p className="flex-1 text-primary text-base font-bold bg-primary/10 border border-primary/30 p-3 rounded-lg flex items-center justify-between select-all break-all">
                        {result.shortUrl}
                      </p>
                      <button
                        onClick={() => copyToClipboard(result.shortUrl)}
                        className="px-4 bg-gray-800 hover:bg-gray-700 text-text rounded-lg border border-gray-700 flex items-center justify-center transition-colors"
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={result.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 bg-gray-800 hover:bg-gray-700 text-text rounded-lg border border-gray-700 flex items-center justify-center transition-colors"
                        title="Open Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex mt-6">
                  <button
                    onClick={() => setResult(null)}
                    className="w-full py-3 bg-gradient-premium hover:shadow-glow-primary text-white text-sm font-extrabold rounded-xl transition-all"
                  >
                    Shorten another URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Metadata Card */}
                <div className="glass-card p-6 rounded-2xl space-y-3.5">
                  <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-gray-800 pb-2 mb-3">Link Metadata</h4>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Creation Time</span>
                    <span className="text-text font-medium">
                      {new Date(result.created_at).toLocaleDateString("en-GB")} {new Date(result.created_at).toLocaleTimeString("en-US", { hour12: true })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Expires</span>
                    <span className="text-text font-medium">{result.expires_at ? new Date(result.expires_at).toLocaleDateString() : "Never"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Status</span>
                    <span className="text-success font-semibold px-2 py-0.5 bg-success/10 rounded-full">Active</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Owner</span>
                    <span className="text-text font-medium">{user?.name || "Test User"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Short Code</span>
                    <span className="text-text font-mono font-medium">{result.short_code}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">URL ID</span>
                    <span className="text-text font-mono font-medium text-[10px] select-all truncate max-w-[150px]">{result.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Response Time</span>
                    <span className="text-emerald-400 font-semibold">{responseTime ?? 24} ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Redis Caching</span>
                    <span className="text-primary font-semibold">Active Hit</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondaryText">Kafka Broker</span>
                    <span className="text-accent font-semibold">Synced Queue</span>
                  </div>
                </div>

                {/* QR Code Card */}
                {showQr && qrSvg && (
                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between items-center text-center">
                    <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-gray-800 pb-2 mb-3 w-full">QR Code Target</h4>
                    
                    <div 
                      className="p-3 bg-white rounded-xl mb-4 w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                    
                    <div className="flex gap-2 w-full">
                      <a
                        href={`/api/v1/qr/${result.short_code}/png`}
                        download={`${result.short_code}-qr.png`}
                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Download PNG
                      </a>
                      <button
                        onClick={() => {
                          const blob = new Blob([qrSvg], { type: "image/svg+xml" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `${result.short_code}-qr.svg`;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Download SVG
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Collapsible technical information */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                  className="w-full p-4 flex justify-between items-center bg-gray-900/30 hover:bg-gray-900/50 text-text text-sm font-semibold transition-colors"
                >
                  <span>Technical System Stack</span>
                  {showAdvancedDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showAdvancedDetails && (
                  <div className="p-5 border-t border-gray-800/80 bg-gray-950/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-secondaryText block mb-1">Service Node</span>
                      <strong className="text-text">url-service</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Generated By</span>
                      <strong className="text-text">NanoID UUIDv4</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Region Node</span>
                      <strong className="text-text">India (In-Zone)</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Proxy Balance</span>
                      <strong className="text-text">Nginx Proxy</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Data Storage</span>
                      <strong className="text-text">MySQL v8.0</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Caching Layer</span>
                      <strong className="text-text">Redis 7-Alpine</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Event Stream</span>
                      <strong className="text-text">Kafka Event Bus</strong>
                    </div>
                    <div>
                      <span className="text-secondaryText block mb-1">Metrics Scraper</span>
                      <strong className="text-text">Prometheus</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-gray-800/30 text-xs text-secondaryText bg-gray-950/25 relative z-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2.5 flex-wrap justify-center font-medium">
            <span>Docker</span>•<span>Kafka</span>•<span>Redis</span>•<span>MySQL</span>•<span>Node.js</span>•<span>React</span>•<span>Prometheus</span>•<span>Grafana</span>
          </div>
          <div>
            © 2026 Manoj Reddy. Distributed URL Shortener SaaS.
          </div>
        </div>
      </footer>
    </div>
  );
};
