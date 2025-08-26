import React, { useState } from "react";
import { ArrowLeft, Plus, Minus, ShoppingCart, AlertCircle } from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useServices, useServiceCategories, ServiceWithDistance } from "@/hooks/useServices";
import { useServiceCounts } from "@/hooks/useServiceCounts";
import LocationSelector from "./LocationSelector";
import ProviderProfileCard from "./ProviderProfileCard";
import ServiceCategoryFilter from "./ServiceCategoryFilter";
import { LocationFilter } from "@/lib/locationUtils";



interface ServiceSelectionProps {
  categoryName: string;
  onBack: () => void;
}

const ServiceSelection = ({ categoryName, onBack }: ServiceSelectionProps) => {
  const { addToCart, removeFromCart, updateQuantity, cart } = useCartContext();
  const navigate = useNavigate();
  const { categories } = useServiceCategories();
  const { counts: serviceCounts } = useServiceCounts();
  
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const categoryData = categories.find(cat => 
    cat.name.toLowerCase().replace(/\s+/g, ' ') === categoryName.toLowerCase()
  );

  // Use selected category filter or default to the route category
  const effectiveCategoryId = selectedCategoryId || categoryData?.id;
  const { services, loading, searchRadius, expandedSearch } = useServices(effectiveCategoryId, locationFilter);

  // Use service counts from the hook
  const serviceCountByCategory = serviceCounts;

  const handleLocationChange = (location: LocationFilter) => {
    setLocationFilter(location);
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    if (quantity <= 0) {
      removeFromCart(serviceId);
    } else {
      const cartItem = cart.items.find(item => item.id === serviceId);
      if (cartItem) {
        updateQuantity(serviceId, quantity);
      } else {
        addToCart({
          id: service.id,
          name: service.name,
          price: service.price,
          image: service.image_url || "/placeholder.svg",
          category: categoryName,
          providerId: service.provider_id
        });
      }
    }
  };

  const getServiceQuantity = (serviceId: string) => {
    const cartItem = cart.items.find(item => item.id === serviceId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleContinueToBooking = () => {
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-foreground">{categoryName}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Location Selector and Filters */}
      <div className="section-container py-4 space-y-4">
        <LocationSelector 
          onLocationChange={handleLocationChange}
          showRadiusControl={true}
        />
        
        {/* Category Filter */}
        <ServiceCategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          serviceCountByCategory={serviceCountByCategory}
        />
        
        {/* Expanded Search Notification */}
        {expandedSearch && services.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Expanded search to {searchRadius}km to show more results
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Service List */}
      <div className="section-container py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground mb-4">
              {expandedSearch 
                ? `No services available within ${searchRadius}km of your location.`
                : "No services available in your area."
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Try expanding your search radius or selecting a different location.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {services.map((service) => (
              <div key={service.id} className="relative">
                <ProviderProfileCard
                  service={service}
                  onSelect={() => {
                    // Handle provider selection if needed
                  }}
                  showAvailability={true}
                />
                
                {/* Quantity Controls Overlay */}
                <div className="absolute top-4 right-4 z-10">
                  {getServiceQuantity(service.id) > 0 ? (
                    <div className="flex items-center space-x-2 bg-background/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateServiceQuantity(service.id, getServiceQuantity(service.id) - 1);
                        }}
                        className="w-6 h-6 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-medium text-sm">
                        {getServiceQuantity(service.id)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateServiceQuantity(service.id, getServiceQuantity(service.id) + 1);
                        }}
                        className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateServiceQuantity(service.id, 1);
                      }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      Add Service
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary - Fixed Bottom */}
      {cart.itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
          <div className="section-container">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {cart.itemCount} service{cart.itemCount > 1 ? 's' : ''} selected
                </p>
                <p className="text-xl font-bold text-foreground">
                  ₹{cart.total}
                </p>
              </div>
              <button 
                onClick={handleContinueToBooking}
                className="button-primary flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Continue to Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default ServiceSelection;