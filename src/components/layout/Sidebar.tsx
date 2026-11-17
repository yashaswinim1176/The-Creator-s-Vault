import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Home, Link as LinkIcon, Settings, LogOut, FileIcon, BarChart2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import { initAuth } from "../../lib/auth";

export function Sidebar() {
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setUserEmail(user.email);
    }, () => {
      setUserEmail(null);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Active Links", href: "/dashboard/links", icon: LinkIcon },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Drive Connect", href: "/dashboard/drive", icon: FileIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-vault-border bg-vault-bg flex flex-col h-screen fixed top-0 left-0 z-20 shadow-xl">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-vault-border">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="h-6 w-6 text-vault-accent group-hover:drop-shadow-[0_0_8px_rgba(0,255,189,0.8)] transition-all" />
          <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-vault-accent transition-colors">
            VAULT
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className="block"
            >
              <motion.div
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer group",
                  isActive 
                    ? "bg-vault-card text-vault-accent shadow-[0_0_20px_rgba(0,255,189,0.08)] border-l-2 border-vault-accent pl-[10px]" 
                    : "text-vault-gray hover:bg-vault-card/45 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-all duration-300 shrink-0", isActive ? "text-vault-accent scale-105 drop-shadow-[0_0_8px_rgba(0,255,189,0.6)]" : "text-vault-gray group-hover:text-white")} />
                <span className="transition-colors">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-vault-accent animate-pulse" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-vault-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="h-8 w-8 rounded-full bg-vault-card flex items-center justify-center font-bold text-sm text-vault-accent border border-vault-accent/30 uppercase"
          >
            {userEmail ? userEmail.charAt(0) : "C"}
          </motion.div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Creator</span>
            <span className="text-xs text-vault-gray truncate w-32" title={userEmail || ""}>
              {userEmail ? userEmail : "Not Connected"}
            </span>
          </div>
        </div>
        <Link 
          to="/"
          className="block"
        >
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-vault-gray hover:bg-vault-card/50 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-vault-gray" />
            <span>Sign Out</span>
          </motion.div>
        </Link>
      </div>
    </aside>
  );
}

