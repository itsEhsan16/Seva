
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, ShoppingCart, Bell, User, Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { cart } = useCartContext();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 md:py-4 transition-all duration-300",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Restored Pulse Styling */}
        <a 
          href="#" 
          className="flex items-center space-x-2"
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
          aria-label="सेवा - Service Platform"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
            सेवा
          </div>
          <span className="text-xl font-display font-bold text-foreground">Seva</span>
        </a>

        {/* Center: Service Search + Location (Desktop) */}
        <div className="hidden lg:flex items-center space-x-3 flex-1 max-w-2xl mx-8">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <button className="button-primary px-4 py-2 text-sm">
            Search
          </button>
        </div>

        {/* Right: Icons + User (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <button 
            onClick={() => navigate('/booking')}
            className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              {cart.itemCount}
            </span>
          </button>
          <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">
                {profile?.full_name || user.email}
              </span>
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors p-2"
                >
                  <span className="text-sm">Admin</span>
                </button>
              )}
              {profile?.role === 'provider' && (
                <button 
                  onClick={() => navigate('/provider')}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors p-2"
                >
                  <span className="text-sm">Dashboard</span>
                </button>
              )}
              <button 
                onClick={signOut}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors p-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors p-2"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Login</span>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-foreground p-3 focus:outline-none" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "fixed inset-0 z-40 bg-background flex flex-col pt-16 px-6 md:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}>
        {/* Mobile Search */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Mobile Icons */}
        <div className="flex justify-center space-x-8 mb-8">
          <button 
            onClick={() => {
              navigate('/booking');
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
            className="flex flex-col items-center space-y-1 text-muted-foreground"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {cart.itemCount}
              </span>
            </div>
            <span className="text-xs">Cart</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground">
            <div className="relative">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </div>
            <span className="text-xs">Alerts</span>
          </button>
          <button 
            onClick={() => {
              navigate('/auth');
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
            className="flex flex-col items-center space-y-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Account</span>
          </button>
        </div>

        <div className="mt-auto mb-8">
          <button 
            className="button-primary w-full py-3"
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Search Services
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
