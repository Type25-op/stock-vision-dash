
import { Link } from "react-router-dom";
import { useTheme } from "@/providers/ThemeProvider";
import { useMaintenance } from "@/providers/MaintenanceProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, User, LogOut } from "lucide-react";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { maintenanceMode } = useMaintenance();
  const { user, logout, isAdmin } = useAuth();

  return (
    <header>
      {maintenanceMode && (
        <div className="maintenance-banner">
          Maintenance Mode Enabled - Some features may be unavailable
        </div>
      )}
      <div className="header-nav">
        <div className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-md p-1 text-primary-foreground font-bold text-lg">ST</div>
            <span className="font-bold text-xl">StockTracker</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={14} />
                  <span>{user.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={logout}
                  title="Log out"
                >
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
