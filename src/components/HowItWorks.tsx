
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, Calendar, CheckCircle } from "lucide-react";

interface StepProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const Step = ({ step, icon, title, description, index }: StepProps) => {
  return (
    <div 
      className="text-center opacity-0 fade-in-element group"
      style={{ animationDelay: `${0.2 * index}s` }}
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto shadow-lg group-hover:bg-blue-700 transition-colors duration-300">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-blue-100">
          <span className="text-blue-600 font-bold text-sm">{step}</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 max-w-xs mx-auto">{description}</p>
    </div>
  );
};

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
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

  const steps = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Choose Service",
      description: "Browse and select from our wide range of professional home services"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Book Appointment", 
      description: "Pick your preferred date, time, and professional for the service"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Get It Done",
      description: "Our verified professional arrives on time and completes the job perfectly"
    }
  ];
  
  return (
    <section className="py-12 sm:py-16 md:py-20 relative bg-white" id="how-it-works" ref={sectionRef}>
      {/* Background decorative elements */}
      <div className="absolute -top-20 right-0 w-72 h-72 bg-blue-50 rounded-full opacity-60 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-green-50 rounded-full opacity-70 blur-3xl -z-10"></div>
      
      <div className="section-container">
        <div className="text-center mb-16 opacity-0 fade-in-element">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-600 border border-green-200 mx-auto mb-4">
            <span>How It Works</span>
          </div>
          <h2 className="section-title mb-4">Simple Steps to Get<br />Your Work Done</h2>
          <p className="section-subtitle mx-auto">
            Book professional services in just a few clicks and get quality work done at your convenience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <Step
              key={index}
              step={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              index={index}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 opacity-0 fade-in-element">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
            Book Your First Service
          </button>
          <p className="text-sm text-gray-600 mt-4">No hidden charges • 100% satisfaction guaranteed</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
