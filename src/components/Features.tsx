
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useServiceCategories } from "@/hooks/useServices";
import { useServiceCounts } from "@/hooks/useServiceCounts";
import ServiceCategoryCard from "./ServiceCategoryCard";

interface ServiceCategoryProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  services: string[];
  index: number;
  onClick: () => void;
}

const ServiceCategory = ({ icon, title, description, services, index, onClick }: ServiceCategoryProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      className={cn(
        "feature-card glass-card opacity-0 p-4 sm:p-6 group cursor-pointer",
        "lg:hover:bg-gradient-to-br lg:hover:from-white lg:hover:to-blue-50",
        "transition-all duration-300 hover:shadow-lg hover:scale-105"
      )}
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      <div className="rounded-full bg-pulse-50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-pulse-600 mb-4 sm:mb-5 group-hover:bg-pulse-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm sm:text-base mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {services.map((service, idx) => (
          <span 
            key={idx}
            className="pulse-chip group-hover:bg-pulse-200 group-hover:text-pulse-700 transition-colors"
          >
            {service}
          </span>
        ))}
      </div>
    </div>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { categories, loading } = useServiceCategories();
  const { counts: serviceCounts } = useServiceCounts();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(".fade-in-element");
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add("animate-fade-in");
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const getIconForCategory = (name: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Home Cleaning': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path d="M8 5v4M16 5v4"></path></svg>,
      'Electrical': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>,
      'Plumbing': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>,
      'Beauty & Wellness': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>,
      'AC Repair & Service': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" x2="12" y1="22.08" y2="12"></line></svg>,
      'Pest Control': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m14.5 9-5 5"></path><path d="m9.5 9 5 5"></path></svg>,
    };
    return icons[name] || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><circle cx="12" cy="12" r="10"></circle></svg>;
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 pb-0 relative bg-gray-50" id="services">
        <div className="section-container">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="section-title mb-3 sm:mb-4">Loading Services...</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="feature-card glass-card p-4 sm:p-6 animate-pulse">
                <div className="rounded-full bg-gray-200 w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-5"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded px-3"></div>
                  <div className="h-6 bg-gray-200 rounded px-3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-12 sm:py-16 md:py-20 pb-0 relative bg-gray-50" id="services" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-16">
          <div className="pulse-chip mx-auto mb-3 sm:mb-4 opacity-0 fade-in-element">
            <span>Services</span>
          </div>
          <h2 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            Professional Services <br className="hidden sm:block" />at Your Doorstep
          </h2>
          <p className="section-subtitle mx-auto opacity-0 fade-in-element">
            Book trusted professionals for all your home service needs. Quality guaranteed, prices transparent.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <ServiceCategoryCard
                category={category}
                serviceCount={serviceCounts[category.id] || 0}
                onClick={() => navigate(`/services/${category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
