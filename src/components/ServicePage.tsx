import React from "react";
import { useParams } from "react-router-dom";
import ServiceSelection from "./ServiceSelection";

const ServicePage = () => {
  const { category } = useParams<{ category: string }>();
  
  const getCategoryName = (categorySlug: string | undefined) => {
    switch (categorySlug) {
      case 'home-cleaning':
        return 'Home Cleaning';
      case 'ac-repair':
        return 'AC Repair & Service';
      case 'plumbing':
        return 'Plumbing Services';
      case 'electrical':
        return 'Electrical Services';
      case 'beauty':
        return 'Beauty & Wellness';
      case 'pest-control':
        return 'Pest Control';
      default:
        return 'Services';
    }
  };

  return (
    <ServiceSelection 
      categoryName={getCategoryName(category)} 
      onBack={() => window.history.back()} 
    />
  );
};

export default ServicePage;