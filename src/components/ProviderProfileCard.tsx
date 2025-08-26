import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, Award, CheckCircle, Calendar } from "lucide-react";
import { ServiceWithDistance } from "@/hooks/useServices";
import { useReviewStats } from "@/hooks/useReviews";
import { formatDistance, formatTravelTime } from "@/lib/locationUtils";

interface ProviderProfileCardProps {
  service: ServiceWithDistance;
  onSelect?: () => void;
  showAvailability?: boolean;
  className?: string;
}

const ProviderProfileCard = ({ 
  service, 
  onSelect, 
  showAvailability = true,
  className = "" 
}: ProviderProfileCardProps) => {
  const { stats, loading: reviewsLoading } = useReviewStats(undefined, service.provider_id);
  const provider = service.provider;

  if (!provider) {
    return null;
  }

  const isNewProvider = stats.totalReviews === 0;
  const isVerified = provider.is_verified || provider.verification_status === 'verified';

  const getProviderInitials = (name: string | null) => {
    if (!name) return "P";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatExperience = (years: number | null) => {
    if (!years || years === 0) return "New Provider";
    return `${years} year${years > 1 ? 's' : ''} exp`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg group ${className}`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Service Image */}
          <div className="w-full lg:w-48 h-48 lg:h-32 bg-muted rounded-xl overflow-hidden">
            <img 
              src={service.image_url || "/placeholder.svg"} 
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Service and Provider Details */}
          <div className="flex-1 space-y-4">
            {/* Service Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-2">
                  {service.description || "Professional service"}
                </p>
              </div>
              
              {/* Price */}
              <div className="text-xl font-bold text-primary">
                ₹{service.price}
              </div>
            </div>

            {/* Provider Info */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={provider.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getProviderInitials(provider.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground truncate">
                    {provider.business_name || provider.full_name || "Service Provider"}
                  </h4>
                  {isVerified && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  {isNewProvider && (
                    <Badge variant="secondary" className="text-xs">
                      New Provider
                    </Badge>
                  )}
                </div>
                
                {/* Provider Stats */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {reviewsLoading ? (
                      <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                    ) : isNewProvider ? (
                      <>
                        <Star className="w-4 h-4" />
                        <span>No reviews yet</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{stats.averageRating} ({stats.totalReviews})</span>
                      </>
                    )}
                  </div>
                  
                  {/* Experience */}
                  {provider.experience_years !== null && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{formatExperience(provider.experience_years)}</span>
                    </div>
                  )}
                  
                  {/* Distance */}
                  {typeof service.distance === 'number' && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{formatDistance(service.distance)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service Meta and Skills */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Duration */}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.duration_minutes ? `${service.duration_minutes} min` : "1 hour"}</span>
              </div>
              
              {/* Travel Time */}
              {service.travelTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTravelTime(service.travelTime)}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {provider.skills && provider.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {provider.skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {provider.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.skills.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Availability Indicator */}
            {showAvailability && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Available Today</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderProfileCard;