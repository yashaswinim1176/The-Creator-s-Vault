import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Shield } from "lucide-react";
import { cn } from "../../lib/utils";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith("/dashboard");

  if (isDashboard) return null; // Don't show top navbar in dashboard view

  return (
    <header className="sticky top-0 z-50 w-full border-b border-vault-border/50 bg-vault-bg/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="h-6 w-6 text-vault-accent group-hover:drop-shadow-[0_0_8px_rgba(0,255,189,0.8)] transition-all" />
          <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-vault-accent transition-colors">
            VAULT
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#breach" className="text-vault-gray hover:text-white transition-colors">THE BREACH</a>
          <a href="#shield" className="text-vault-gray hover:text-white transition-colors">THE SHIELD</a>
          <a href="#pricing" className="text-vault-gray hover:text-white transition-colors">PRICING</a>
          <Link to="/dashboard" className="text-vault-gray hover:text-white transition-colors">SIGN IN</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="hidden sm:inline-flex"
            onClick={() => navigate('/creator-login')}
          >
            CREATOR LOGIN
          </Button>
          <Button 
            variant="primary" 
            className="hidden sm:inline-flex"
            onClick={() => navigate('/customer-signup')}
          >
            USER SIGN UP
          </Button>
        </div>
      </div>
    </header>
  );
}
