import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Link2, ArrowUpRight, HelpCircle, Activity } from "lucide-react";
import api from "../utils/api";

export const Navbar: React.FC = () => {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<"healthy" | "slow" | "offline">("healthy");
  const location = useLocation();

  useEffect(() => {
    const checkLatency = async () => {
      const start = Date.now();
      try {
        await api.get("/auth/keys", { timeout: 3000 }); // quick simple auth endpoint to test
        const diff = Date.now() - start;
        setLatency(diff);
        if (diff < 150) setStatus("healthy");
        else setStatus("slow");
      } catch (err: any) {
        if (err.response) {
          // endpoint returns 401 if unauthenticated but service is up
          setLatency(Date.now() - start);
          setStatus("healthy");
        } else {
          setStatus("offline");
          setLatency(null);
        }
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 15000); // refresh latency every 15s
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "System Dashboard";
      case "/dashboard/urls":
        return "URL Management";
      case "/dashboard/qrcodes":
        return "QR Code Hub";
      case "/dashboard/monitor":
        return "Live System Monitor";
      default:
        if (location.pathname.startsWith("/dashboard/urls/")) {
          return "Link Details & Telemetry";
        }
        return "Distributed URL Shortener";
    }
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-text tracking-wide">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Nginx Gateway Health Status */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-950/40 border border-gray-800/80">
          <div className={`w-2.5 h-2.5 rounded-full ${
            status === "healthy" ? "bg-success" : status === "slow" ? "bg-warning" : "bg-error"
          } animate-pulse`} />
          <span className="text-xs text-secondaryText">
            Nginx Gateway: {status === "healthy" ? "Active" : status === "slow" ? "High Latency" : "Offline"}
            {latency !== null && ` (${latency}ms)`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/monitor"
            className="p-2 text-secondaryText hover:text-text rounded-lg hover:bg-gray-800/50 transition-colors"
            title="System Telemetry"
          >
            <Activity className="h-4.5 w-4.5" />
          </Link>

          <a
            href="https://github.com/dullamanojreddy/url-shortener"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-secondaryText hover:text-text rounded-lg hover:bg-gray-800/50 transition-colors"
            title="Help / Docs"
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
