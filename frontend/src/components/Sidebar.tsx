import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Link2, 
  BarChart3, 
  QrCode, 
  Key, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "My URLs", path: "/dashboard/urls", icon: Link2 },
    { name: "QR Codes", path: "/dashboard/qrcodes", icon: QrCode },
    { name: "System Monitor", path: "/dashboard/monitor", icon: Activity },
  ];

  const activeClass = "bg-primary/20 text-blue-400 border-l-4 border-primary font-medium";
  const inactiveClass = "text-secondaryText hover:bg-gray-800/40 hover:text-text border-l-4 border-transparent";

  return (
    <aside className="w-64 glass-panel border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6 flex flex-col h-full overflow-y-auto">
        {/* Logo Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-premium rounded-xl shadow-glow-primary">
            <Link2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-text tracking-wide leading-none">SHORT.LY</h1>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Distributed</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white uppercase shadow-sm">
            {user?.name.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-text truncate">{user?.name}</h4>
            <p className="text-xs text-secondaryText truncate capitalize">{user?.role} Account</p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-gray-800/80 bg-gray-950/30">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
