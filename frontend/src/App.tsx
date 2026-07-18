import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { UrlDetails } from "./pages/UrlDetails";
import { Monitoring } from "./pages/Monitoring";
import { RedirectPage } from "./pages/RedirectPage";
import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  ResetPasswordPage 
} from "./pages/AuthPages";
import { QrCode, Link2, Copy, Download, Layers } from "lucide-react";
import toast from "react-hot-toast";
import api from "./utils/api";

// Protect routes guard
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};



// Sidebar + Navbar Dashboard layout
const DashboardLayout: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// QR Hub Grid View page
const QrHub: React.FC = () => {
  const [urls, setUrls] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [qrSvgs, setQrSvgs] = React.useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUrlsAndQrs = async () => {
      try {
        const response = await api.get<any[]>("/urls");
        setUrls(response.data);
        
        // Fetch SVGs for all codes
        const svgs: Record<string, string> = {};
        await Promise.all(
          response.data.map(async (url) => {
            try {
              const res = await api.get(`/qr/${url.short_code}`, { responseType: "text" });
              svgs[url.short_code] = res.data;
            } catch (e) {
              console.error(e);
            }
          })
        );
        setQrSvgs(svgs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUrlsAndQrs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-card p-6 h-60 shimmer rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/40 p-4 border border-gray-800/80 rounded-2xl">
        <h4 className="text-sm font-bold text-text">Link QR Code Hub</h4>
        <p className="text-xs text-secondaryText mt-1">Download PNG or SVG templates for print media advertising.</p>
      </div>

      {urls.length === 0 ? (
        <div className="glass-card p-8 text-center rounded-2xl text-xs text-secondaryText">No QR targets created. Shorten a link first.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {urls.map((url) => (
            <div key={url.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between items-center text-center">
              <div>
                <h5 className="font-bold text-text truncate max-w-[150px]">{url.title || "Untitled Link"}</h5>
                <span className="text-[10px] text-primary font-mono block mt-0.5">/{url.short_code}</span>
              </div>
              
              <div className="my-4 p-2 bg-white rounded-lg w-32 h-32 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {qrSvgs[url.short_code] ? (
                  <div dangerouslySetInnerHTML={{ __html: qrSvgs[url.short_code] }} className="w-full h-full" />
                ) : (
                  <QrCode className="h-8 w-8 text-gray-400" />
                )}
              </div>

              <div className="flex gap-2 w-full text-[10px]">
                <a
                  href={`/api/v1/qr/${url.short_code}/png`}
                  download={`${url.short_code}-qr.png`}
                  className="flex-1 py-1.5 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-text rounded-md font-semibold"
                >
                  PNG
                </a>
                <button
                  onClick={() => {
                    const svg = qrSvgs[url.short_code];
                    if (!svg) return;
                    const blob = new Blob([svg], { type: "image/svg+xml" });
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.download = `${url.short_code}-qr.svg`;
                    link.click();
                    URL.revokeObjectURL(blobUrl);
                  }}
                  className="flex-1 py-1.5 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-text rounded-md font-semibold"
                >
                  SVG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing View */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/r/:shortCode" element={<RedirectPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Workspace Views */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="urls" element={<Dashboard />} />
              <Route path="urls/:shortCode" element={<UrlDetails />} />
              <Route path="qrcodes" element={<QrHub />} />
              <Route path="monitor" element={<Monitoring />} />
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
};
