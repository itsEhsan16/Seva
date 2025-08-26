
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, MapPin, ArrowRight } from "lucide-react";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const popularServices = [
    "Home Cleaning",
    "AC Repair", 
    "Plumbing",
    "Electrician",
    "Salon at Home",
    "Appliance Repair"
  ];
  
  return (
    <section 
      className="overflow-hidden relative bg-cover bg-hero-gradient" 
      id="hero" 
      style={{
        backgroundImage: 'url("/Header-background.webp")',
        backgroundPosition: 'center 30%', 
        padding: isMobile ? '100px 12px 40px' : '120px 20px 60px'
      }}
    >
      <div className="absolute -top-[10%] -right-[5%] w-1/2 h-[70%] bg-pulse-gradient opacity-20 blur-3xl rounded-full"></div>
      
      <div className="container px-4 sm:px-6 lg:px-8" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2">
            <div 
              className="pulse-chip mb-3 sm:mb-6 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.1s" }}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground mr-2 text-xs">सेवा</span>
              <span>Trusted Service Platform</span>
            </div>
            
            <h1 
              className="section-title leading-tight opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.3s" }}
            >
              Home Services at<br className="hidden sm:inline" />
              <span className="text-primary">Your Doorstep</span>
            </h1>
            
            <p 
              style={{ animationDelay: "0.5s" }} 
              className="section-subtitle mt-3 sm:mt-6 mb-4 sm:mb-8 leading-relaxed opacity-0 animate-fade-in text-left"
            >
              Book trusted professionals for all your home service needs. From cleaning to repairs, we've got you covered.
            </p>
            
            {/* Service Search */}
            <div 
              className="glass-card p-4 mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.7s" }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for services"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button className="button-primary px-6 py-3 group">
                  Search
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Popular Services */}
            <div 
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: "0.9s" }}
            >
              <p className="text-sm text-muted-foreground mb-3">Popular Services:</p>
              <div className="flex flex-wrap gap-2">
                {popularServices.map((serviceItem, index) => (
                  <button
                    key={index}
                    className="pulse-chip hover:bg-pulse-200 hover:text-pulse-700 transition-colors duration-200"
                  >
                    {serviceItem}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative mt-6 lg:mt-0">
            <div className="relative z-10 animate-fade-in" style={{ animationDelay: "0.9s" }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="glass-card p-4 hover-lift">
                    <div className="w-12 h-12 bg-pulse-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-pulse-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4M16 5v4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Home Cleaning</h3>
                    <p className="text-sm text-muted-foreground">Professional cleaning services</p>
                  </div>
                  <div className="glass-card p-4 hover-lift">
                    <div className="w-12 h-12 bg-pulse-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-pulse-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Electrician</h3>
                    <p className="text-sm text-muted-foreground">Licensed electrical work</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="glass-card p-4 hover-lift">
                    <div className="w-12 h-12 bg-pulse-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-pulse-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Plumbing</h3>
                    <p className="text-sm text-muted-foreground">Expert plumbing solutions</p>
                  </div>
                  <div className="glass-card p-4 hover-lift">
                    <div className="w-12 h-12 bg-pulse-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-pulse-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Beauty & Spa</h3>
                    <p className="text-sm text-muted-foreground">Salon services at home</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
