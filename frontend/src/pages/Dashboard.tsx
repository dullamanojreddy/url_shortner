import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  BarChart3, 
  QrCode, 
  Trash2, 
  Edit3, 
  Plus, 
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { TableSkeleton } from "../components/LoadingSkeleton";

interface URLItem {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  expires_at: string | null;
  click_count: number;
  created_at: string;
  shortUrl: string;
}

interface CountdownCellProps {
  expiresAt: string | null;
  isExpired: boolean;
}

const CountdownCell: React.FC<CountdownCellProps> = ({ expiresAt, isExpired }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("Never");
      return;
    }

    const calculateTime = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const secs = Math.floor((difference / 1000) % 60);
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return <span className="text-secondaryText font-medium">Never</span>;
  if (timeLeft === "Expired" || isExpired) return <span className="text-error font-semibold">Expired</span>;

  return (
    <span className="text-accent font-mono font-bold">
      {timeLeft}
    </span>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "expired" | "today" | "week">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal control states
  const [editingUrl, setEditingUrl] = useState<URLItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOriginal, setEditOriginal] = useState("");
  const [editExpiry, setEditExpiry] = useState<"7d" | "30d" | "365d" | "never">("never");
  const [qrModalCode, setQrModalCode] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  const fetchUrls = async () => {
    setIsLoading(true);
    try {
      // Fetch URLs
      const response = await api.get<URLItem[]>(`/urls?page=${page}&limit=${limit}`);
      const processedUrls = response.data.map(u => ({
        ...u,
        shortUrl: `${window.location.origin}/r/${u.short_code}`
      }));
      setUrls(processedUrls);
      
      // Calculate fake total pages since backend might not return count header (usually returns 20 per page)
      if (response.data.length < limit) {
        setTotalPages(page);
      } else {
        setTotalPages(page + 1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load URLs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [page]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied short URL!");
  };

  const handleDelete = async (shortCode: string) => {
    if (!window.confirm("Are you sure you want to deactivate and delete this short link?")) return;
    try {
      await api.delete(`/urls/${shortCode}`);
      toast.success("Short URL deleted successfully");
      setUrls(urls.filter((u) => u.short_code !== shortCode));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete short URL");
    }
  };

  const handleEditOpen = (item: URLItem) => {
    setEditingUrl(item);
    setEditTitle(item.title || "");
    setEditOriginal(item.original_url);
    setEditExpiry("never");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUrl) return;

    try {
      await api.put(`/urls/${editingUrl.short_code}`, {
        originalUrl: editOriginal,
        title: editTitle,
        expiry: editExpiry === "never" ? undefined : editExpiry,
      });
      toast.success("Link updated successfully!");
      setEditingUrl(null);
      fetchUrls();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update link");
    }
  };

  const handleQrOpen = async (shortCode: string) => {
    setQrModalCode(shortCode);
    setQrSvg(null);
    try {
      const response = await api.get(`/qr/${shortCode}`, { responseType: "text" });
      setQrSvg(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate QR code");
    }
  };

  // Client side Search & Filters
  const filteredUrls = urls.filter((url) => {
    const matchesSearch = 
      url.short_code.toLowerCase().includes(search.toLowerCase()) ||
      (url.title && url.title.toLowerCase().includes(search.toLowerCase())) ||
      url.original_url.toLowerCase().includes(search.toLowerCase());

    const isExpired = url.expires_at ? new Date(url.expires_at) < new Date() : false;
    
    if (filterType === "active") return matchesSearch && !isExpired;
    if (filterType === "expired") return matchesSearch && isExpired;
    
    if (filterType === "today") {
      const createdDate = new Date(url.created_at).toDateString();
      const today = new Date().toDateString();
      return matchesSearch && createdDate === today;
    }
    
    if (filterType === "week") {
      const created = new Date(url.created_at).getTime();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return matchesSearch && created > oneWeekAgo;
    }

    return matchesSearch;
  });

  // Calculate metrics stats
  const totalUrlsCount = urls.length;
  const totalClicksCount = urls.reduce((sum, item) => sum + item.click_count, 0);
  const activeUrlsCount = urls.filter(u => !u.expires_at || new Date(u.expires_at) > new Date()).length;
  const expiredUrlsCount = totalUrlsCount - activeUrlsCount;

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-primary/10 text-primary rounded-bl-2xl">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Total Links</span>
          <h3 className="text-3xl font-extrabold text-text mt-2">{totalUrlsCount}</h3>
          <p className="text-[10px] text-secondaryText mt-1">All registered shortened links</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-success/10 text-success rounded-bl-2xl">
            <Check className="h-5 w-5 animate-pulse" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Active Links</span>
          <h3 className="text-3xl font-extrabold text-text mt-2 text-success">{activeUrlsCount}</h3>
          <p className="text-[10px] text-secondaryText mt-1">Links currently accepting traffic</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-error/10 text-error rounded-bl-2xl">
            <X className="h-5 w-5" />
          </div>
          <span className="text-xs text-secondaryText font-semibold uppercase tracking-wider block">Expired Links</span>
          <h3 className="text-3xl font-extrabold text-text mt-2 text-error">{expiredUrlsCount}</h3>
          <p className="text-[10px] text-secondaryText mt-1">Links past their expiry window</p>
        </div>
      </div>

      {/* Filter and Search Bar Options */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, url, title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-text text-sm font-medium"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "all" ? "bg-primary text-white" : "bg-gray-800 hover:bg-gray-700 text-secondaryText border border-gray-700"
            }`}
          >
            All Links
          </button>
          <button
            onClick={() => setFilterType("active")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "active" ? "bg-success/20 text-success border border-success/40" : "bg-gray-800 hover:bg-gray-700 text-secondaryText border border-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterType("expired")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "expired" ? "bg-error/20 text-error border border-error/40" : "bg-gray-800 hover:bg-gray-700 text-secondaryText border border-gray-700"
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setFilterType("today")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "today" ? "bg-accent/20 text-accent border border-accent/40" : "bg-gray-800 hover:bg-gray-700 text-secondaryText border border-gray-700"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterType("week")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "week" ? "bg-blue-400/20 text-blue-300 border border-blue-400/40" : "bg-gray-800 hover:bg-gray-700 text-secondaryText border border-gray-700"
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Main URLs Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredUrls.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 text-center rounded-2xl space-y-4 flex flex-col items-center">
          <div className="p-4 bg-gray-900 rounded-full text-secondaryText mb-2">
            <Layers className="h-10 w-10 text-secondaryText/60" />
          </div>
          <h3 className="text-xl font-bold text-text">No URLs Found</h3>
          <p className="text-secondaryText text-sm max-w-sm">
            Create your first shortened URL link using our public shortener tool to start tracking redirect stats.
          </p>
          <Link
            to="/"
            className="py-2.5 px-6 bg-gradient-premium hover:shadow-glow-primary text-white font-bold rounded-xl flex items-center gap-2 transition-all mt-4"
          >
            <Plus className="h-4 w-4" />
            <span>Create Short Link</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden border border-gray-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-800/80 text-xs font-bold text-secondaryText uppercase tracking-wider">
                  <th className="px-6 py-4">Title / Original URL</th>
                  <th className="px-6 py-4">Short URL</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Time Remaining</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {filteredUrls.map((url) => {
                  const isExpired = url.expires_at ? new Date(url.expires_at) < new Date() : false;
                  return (
                    <tr key={url.id} className="hover:bg-gray-800/25 transition-colors">
                      
                      {/* Original details */}
                      <td className="px-6 py-4 max-w-xs md:max-w-sm truncate">
                        <div className="font-semibold text-text truncate">
                          {url.title || "Untitled Link"}
                        </div>
                        <div className="text-xs text-secondaryText truncate font-mono mt-0.5">
                          {url.original_url}
                        </div>
                      </td>

                      {/* Short Link copy trigger */}
                      <td className="px-6 py-4 font-mono font-medium">
                        <div className="flex items-center gap-1.5 text-primary">
                          <span className="truncate max-w-[150px]">{url.shortUrl}</span>
                          <button
                            onClick={() => copyToClipboard(url.shortUrl)}
                            className="p-1 hover:bg-gray-800 rounded text-secondaryText hover:text-text transition-colors"
                            title="Copy short link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Creation Date */}
                      <td className="px-6 py-4 text-xs text-secondaryText font-mono">
                        {new Date(url.created_at).toLocaleDateString()} {new Date(url.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4 text-xs text-secondaryText font-mono">
                        {url.expires_at ? (
                          <>
                            {new Date(url.expires_at).toLocaleDateString()} {new Date(url.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </>
                        ) : "Never"}
                      </td>

                      {/* Time Remaining */}
                      <td className="px-6 py-4 text-xs">
                        <CountdownCell expiresAt={url.expires_at} isExpired={isExpired} />
                      </td>

                      {/* Status indicator */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isExpired 
                            ? "bg-error/10 text-error border border-error/20" 
                            : "bg-success/10 text-success border border-success/20"
                        }`}>
                          {isExpired ? "Expired" : "Active"}
                        </span>
                      </td>

                      {/* Action buttons list */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          
                          <a
                            href={url.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-gray-800/40 hover:bg-gray-850 hover:text-text rounded-lg border border-gray-800 text-secondaryText transition-colors"
                            title="Open Link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <Link
                            to={`/dashboard/urls/${url.short_code}`}
                            className="p-1.5 bg-gray-800/40 hover:bg-gray-850 hover:text-primary rounded-lg border border-gray-800 text-secondaryText transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            onClick={() => handleQrOpen(url.short_code)}
                            className="p-1.5 bg-gray-800/40 hover:bg-gray-850 hover:text-accent rounded-lg border border-gray-800 text-secondaryText transition-colors"
                            title="View QR Code"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleEditOpen(url)}
                            className="p-1.5 bg-gray-800/40 hover:bg-gray-850 hover:text-yellow-400 rounded-lg border border-gray-800 text-secondaryText transition-colors"
                            title="Edit URL"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(url.short_code)}
                            className="p-1.5 bg-gray-800/40 hover:bg-gray-850 hover:text-error rounded-lg border border-gray-800 text-secondaryText transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          <div className="bg-gray-900/30 border-t border-gray-800/80 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-secondaryText">
              Viewing page <strong className="text-text font-bold">{page}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-gray-850 border border-gray-800 hover:bg-gray-800 text-text disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={filteredUrls.length < limit}
                className="p-2 rounded-lg bg-gray-850 border border-gray-800 hover:bg-gray-800 text-text disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
          <div className="flex justify-center mt-6">
            <Link
              to="/"
              className="py-3.5 px-8 text-sm md:text-base bg-gradient-premium hover:shadow-glow-primary text-white font-extrabold rounded-2xl flex items-center gap-2.5 transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Shorten URL</span>
            </Link>
          </div>
        </>
      )}

      {/* EDIT MODAL SECTION */}
      {editingUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl relative border-primary/20">
            <button
              onClick={() => setEditingUrl(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-secondaryText hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-text mb-4">Edit URL Configuration</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">Original Destination URL</label>
                <input
                  type="text"
                  required
                  value={editOriginal}
                  onChange={(e) => setEditOriginal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">Link Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondaryText uppercase tracking-wider block mb-2">Update Expiry</label>
                <select
                  value={editExpiry}
                  onChange={(e: any) => setEditExpiry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-text text-sm bg-gray-900"
                >
                  <option value="never">Never (Keep Infinite)</option>
                  <option value="7d">7 Days from now</option>
                  <option value="30d">30 Days from now</option>
                  <option value="365d">1 Year from now</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUrl(null)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-premium text-white hover:shadow-glow-primary text-xs font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL SECTION */}
      {qrModalCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 rounded-2xl relative flex flex-col items-center">
            <button
              onClick={() => setQrModalCode(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-secondaryText hover:text-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-text uppercase tracking-wider border-b border-gray-800 pb-2 mb-4 w-full text-center">QR Code Visual</h3>
            
            {qrSvg ? (
              <div 
                className="p-3 bg-white rounded-xl mb-6 w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center shimmer rounded-xl mb-6"></div>
            )}
            
            <div className="flex gap-2 w-full">
              <a
                href={`/api/v1/qr/${qrModalCode}/png`}
                download={`${qrModalCode}-qr.png`}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 rounded-xl text-xs font-bold text-center transition-all"
              >
                Download PNG
              </a>
              <button
                onClick={() => {
                  if (!qrSvg) return;
                  const blob = new Blob([qrSvg], { type: "image/svg+xml" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${qrModalCode}-qr.svg`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-text border border-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Download SVG
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
