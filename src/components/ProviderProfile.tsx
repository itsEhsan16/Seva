import React from "react";
import { Star, MapPin, Clock, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReviewsList from "./ReviewsList";

interface ProviderProfileProps {
  provider: {
    id: string;
    full_name: string;
    business_name?: string;
    phone?: string;
    avatar_url?: string;
    address?: string;
    city?: string;
    state?: string;
    experience_years?: number;
    skills?: string[];
    is_verified: boolean;
  };
  onContactProvider?: () => void;
  onBookService?: () => void;
}

const ProviderProfile = ({ provider, onContactProvider, onBookService }: ProviderProfileProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="section-container py-8">
        {/* Provider Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-muted rounded-full overflow-hidden">
                {provider.avatar_url ? (
                  <img 
                    src={provider.avatar_url} 
                    alt={provider.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-2xl font-bold text-primary">
                      {provider.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {provider.business_name || provider.full_name}
                  </h1>
                  {provider.business_name && (
                    <p className="text-muted-foreground">{provider.full_name}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    {provider.is_verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Verified Provider
                      </Badge>
                    )}
                    {provider.experience_years && provider.experience_years > 0 && (
                      <Badge variant="outline">
                        {provider.experience_years} years experience
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {provider.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                
                {(provider.address || provider.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {[provider.address, provider.city, provider.state]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {provider.skills && provider.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {onBookService && (
                  <Button onClick={onBookService} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Book Service
                  </Button>
                )}
                {onContactProvider && (
                  <Button variant="outline" onClick={onContactProvider} className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Provider
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6">Reviews & Ratings</h2>
          <ReviewsList providerId={provider.id} />
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;