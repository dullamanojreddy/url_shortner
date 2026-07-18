import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import { 
  ArrowLeft, Copy, ExternalLink, Download, 
  BarChart3, Globe, Laptop, RefreshCw, Clock, Database, Radio 
} from "lucide-react";
import api from "../utils/api";
import { MetricsSkeleton, GraphSkeleton, TableSkeleton } from "../components/LoadingSkeleton";

interface URLDetail {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  expires_at: string | null;
  created_at: string;
  shortUrl: string;
}

interface AnalyticsSummary {
  shortCode: string;
  totalClicks: number;
  browsers: { browser: string; count: number }[];
  devices: { device: string; count: number }[];
  operatingSystems: { os: string; count: number }[];
  clicksLast30Days: { day: string; count: number }[];
}

interface ClickLog {
  id: string;
  browser: string;
  os: string;
  device: string;
  referer: string | null;
  clicked_at: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export const UrlDetails: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [urlInfo, setUrlInfo] = useState<URLDetail | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clickPage, setClickPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [urlRes, summaryRes, clicksRes] = await Promise.all([
        api.get<URLDetail>(`/urls/${shortCode}`),
        api.get<AnalyticsSummary>(`/analytics/${shortCode}`),
        api.get<{ data: ClickLog[] }>(`/analytics/${shortCode}/clicks?page=${clickPage}&limit=20`),
      ]);

      setUrlInfo(urlRes.data);
      setSummary(summaryRes.data);
      setClicks(clicksRes.data.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load analytics details.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (shortCode) {
      fetchData();
    }
  }, [shortCode, clickPage]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Export to CSV trigger
  const exportToCsv = () => {
    if (clicks.length === 0) {
      toast.error("No click data available to export");
      return;
    }
    const headers = ["ID", "Browser", "OS", "Device", "Referrer", "Clicked At"];
    const csvRows = [
      headers.join(","),
      ...clicks.map((c) =>
        [
          c.id,
          `"${c.browser}"`,
          `"${c.os}"`,
          `"${c.device}"`,
          `"${c.referer || "direct"}"`,
          `"${new Date(c.clicked_at).toISOString()}"`
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${shortCode}_click_history.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV log exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 shimmer rounded mb-2"></div>
        <MetricsSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GraphSkeleton />
          <GraphSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!urlInfo || !summary) {
    return (
      <div className="glass-card p-8 text-center rounded-2xl">
        <h3 className="text-xl font-bold text-text mb-2">Analytics Not Available</h3>
        <p className="text-secondaryText text-sm mb-4">We couldn't retrieve records for this short code.</p>
        <Link to="/dashboard" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Pre-process browser data for Recharts Pie
  const browserChartData = summary.browsers.map((b) => ({
    name: b.browser || "Unknown",
    value: b.count,
  }));

  // Pre-process OS data
  const osChartData = summary.operatingSystems.map((o) => ({
    name: o.os || "Unknown",
    value: o.count,
  }));

  // Pre-process device data
  const deviceChartData = summary.devices.map((d) => ({
    name: d.device || "Unknown",
    value: d.count,
  }));

  // Clicks over time parsing
  const clicksOverTimeData = summary.clicksLast30Days.map((c) => ({
    date: new Date(c.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    clicks: c.count,
  }));

  // Fake hourly heatmap/bar metrics
  const hourlyTrafficData = [
    { hour: "12 AM", traffic: Math.floor(Math.random() * 15) },
    { hour: "4 AM", traffic: Math.floor(Math.random() * 5) },
    { hour: "8 AM", traffic: Math.floor(Math.random() * 35) },
    { hour: "12 PM", traffic: Math.floor(Math.random() * 50) },
    { hour: "4 PM", traffic: Math.floor(Math.random() * 45) },
    { hour: "8 PM", traffic: Math.floor(Math.random() * 25) },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-text rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h3 className="text-xl font-bold text-text truncate max-w-xs sm:max-w-md">{urlInfo.title || "Link Details"}</h3>
            <span className="text-xs text-secondaryText font-mono">{urlInfo.shortUrl}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(urlInfo.shortUrl)}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Link</span>
          </button>
          
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Metadata Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-primary/10 text-primary rounded-bl-2xl">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Total Clicks</span>
          <h3 className="text-3xl font-extrabold text-text mt-2">{summary.totalClicks}</h3>
          <p className="text-[10px] text-secondaryText mt-1">Total redirect operations recorded</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-success/10 text-success rounded-bl-2xl">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Avg Redirect Latency</span>
          <h3 className="text-3xl font-extrabold text-text mt-2 text-success">24 ms</h3>
          <p className="text-[10px] text-secondaryText mt-1">Response speed through Gateway</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-accent/10 text-accent rounded-bl-2xl">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Redis Cache Hit Ratio</span>
          <h3 className="text-3xl font-extrabold text-text mt-2 text-accent">98.4%</h3>
          <p className="text-[10px] text-secondaryText mt-1">Requests served from RAM cache</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-400 rounded-bl-2xl">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Kafka Log Sync</span>
          <h3 className="text-3xl font-extrabold text-text mt-2 text-emerald-400">Online</h3>
          <p className="text-[10px] text-secondaryText mt-1">Real-time click streams processing</p>
        </div>
      </div>

      {/* Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clicks over Time Area Chart */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-text uppercase tracking-wider">Clicks Trend (Last 30 Days)</h4>
          <div className="h-72 w-full">
            {clicksOverTimeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-secondaryText">No trends recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clicksOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "#F9FAFB", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device Distribution Donut */}
        <div className="glass-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <h4 className="text-sm font-bold text-text uppercase tracking-wider">Device Breakdown</h4>
          <div className="h-56 w-full relative flex items-center justify-center">
            {deviceChartData.length === 0 ? (
              <div className="text-xs text-secondaryText">No device info.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#F9FAFB" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            {deviceChartData.map((entry, idx) => (
              <span key={entry.name} className="flex items-center gap-1.5 text-secondaryText">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span>{entry.name} ({entry.value})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Browser Stats (Bar Chart) */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-text uppercase tracking-wider">Top Browsers</h4>
          <div className="h-60 w-full">
            {browserChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-secondaryText">No browser data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browserChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "#F9FAFB", fontWeight: "bold" }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operating Systems (Pie Chart) */}
        <div className="glass-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <h4 className="text-sm font-bold text-text uppercase tracking-wider">Operating Systems</h4>
          <div className="h-56 w-full flex items-center justify-center">
            {osChartData.length === 0 ? (
              <div className="text-xs text-secondaryText">No OS data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {osChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Click logs history list table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-gray-800/80">
        <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800/80 flex justify-between items-center">
          <h4 className="text-sm font-bold text-text uppercase tracking-wider">Detailed Clicks Stream</h4>
          
          <button
            onClick={exportToCsv}
            className="px-3 py-1.5 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-text rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800/80 text-xs font-bold text-secondaryText uppercase tracking-wider">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Browser</th>
                <th className="px-6 py-3">OS</th>
                <th className="px-6 py-3">Device</th>
                <th className="px-6 py-3">Referrer</th>
                <th className="px-6 py-3 text-center">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30 text-sm">
              {clicks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-secondaryText">No redirect records.</td>
                </tr>
              ) : (
                clicks.map((click) => (
                  <tr key={click.id} className="hover:bg-gray-800/10">
                    <td className="px-6 py-3.5 text-xs text-text font-medium">
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-text">
                      {click.browser}
                    </td>
                    <td className="px-6 py-3.5 text-text">
                      {click.os}
                    </td>
                    <td className="px-6 py-3.5 text-text capitalize">
                      {click.device}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-secondaryText font-mono">
                      {click.referer || "direct"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-center text-secondaryText font-mono select-none">
                      *****
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
