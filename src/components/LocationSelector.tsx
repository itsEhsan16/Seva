import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Loader2, AlertCircle, Search, Target, Settings } from "lucide-react";
import { useLocation, Location } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LocationFilter, DEFAULT_SEARCH_RADIUS, MAX_SEARCH_RADIUS } from "@/lib/locationUtils";
import { useToast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  onLocationChange: (location: LocationFilter) => void;
  showRadiusControl?: boolean;
  defaultRadius?: number;
  className?: string;
}

const LocationSelector = ({ 
  onLocationChange, 
  showRadiusControl = true,
  defaultRadius = DEFAULT_SEARCH_RADIUS,
  className = ""
}: LocationSelectorProps) => {
  const { location, loading, error, getCurrentLocation, geocodeAddress } = useLocation();
  const { toast } = useToast();
  
  const [manualLocation, setManualLocation] = useState("");
  const [searchRadius, setSearchRadius] = useState(defaultRadius);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handleAutoLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleManualLocationSearch = useCallback(async () => {
    if (!manualLocation.trim()) return;

    setGeocoding(true);
    try {
      const result = await geocodeAddress(manualLocation);
      if (result) {
        const locationFilter: LocationFilter = {
          latitude: result.latitude,
          longitude: result.longitude,
          city: result.city,
          state: result.state,
          pincode: result.pincode,
          radius: searchRadius
        };
        onLocationChange(locationFilter);
        
        toast({
          title: "Location found",
          description: `Set location to ${result.city ? `${result.city}, ` : ''}${result.state || 'Unknown area'}`
        });
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different address or use current location",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Search failed",
        description: "Unable to find the specified location",
        variant: "destructive"
      });
    } finally {
      setGeocoding(false);
    }
  }, [manualLocation, searchRadius, geocodeAddress, onLocationChange, toast]);

  const handleManualLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualLocation(value);
    
    // Simple parsing for immediate feedback (without geocoding)
    if (value.trim()) {
      const parts = value.split(',').map(part => part.trim());
      const locationFilter: LocationFilter = {
        radius: searchRadius
      };
      
      if (parts.length >= 2) {
        locationFilter.city = parts[0];
        locationFilter.state = parts[1];
        if (parts.length >= 3 && /^\d{6}$/.test(parts[2])) {
          locationFilter.pincode = parts[2];
        }
      } else if (parts.length === 1) {
        const part = parts[0];
        if (/^\d{6}$/.test(part)) {
          locationFilter.pincode = part;
        } else {
          locationFilter.city = part;
        }
      }
      
      onLocationChange(locationFilter);
    }
  }, [searchRadius, onLocationChange]);

  const handleRadiusChange = useCallback((value: number[]) => {
    const newRadius = value[0];
    setSearchRadius(newRadius);
    
    // Update location filter with new radius
    if (location) {
      onLocationChange({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        radius: newRadius
      });
    } else if (manualLocation) {
      // Re-trigger manual location with new radius
      const parts = manualLocation.split(',').map(part => part.trim());
      const locationFilter: LocationFilter = { radius: newRadius };
      
      if (parts.length >= 2) {
        locationFilter.city = parts[0];
        locationFilter.state = parts[1];
      } else if (parts.length === 1) {
        locationFilter.city = parts[0];
      }
      
      onLocationChange(locationFilter);
    }
  }, [location, manualLocation, onLocationChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualLocationSearch();
    }
  }, [handleManualLocationSearch]);

  // Update location filter when GPS location changes
  useEffect(() => {
    if (location) {
      onLocationChange({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        radius: searchRadius
      });
    }
  }, [location, searchRadius, onLocationChange]);

  const formatLocationDisplay = (loc: Location): string => {
    const parts = [];
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    if (loc.pincode) parts.push(loc.pincode);
    return parts.length > 0 ? parts.join(', ') : 'Current Location';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Service Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAutoLocation}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {loading ? "Locating..." : "Current Location"}
            </Button>
            
            <span className="text-sm text-muted-foreground">or</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter city, state, or pincode"
              value={manualLocation}
              onChange={handleManualLocationChange}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleManualLocationSearch}
              disabled={geocoding || !manualLocation.trim()}
              size="sm"
              variant="outline"
            >
              {geocoding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Current Location Display */}
        {location && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {formatLocationDisplay(location)}
            </span>
          </div>
        )}

        {/* Search Radius Control */}
        {showRadiusControl && (
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Search Radius: {searchRadius}km
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label className="text-sm">
                  Search within {searchRadius} kilometers
                </Label>
                <Slider
                  value={[searchRadius]}
                  onValueChange={handleRadiusChange}
                  max={MAX_SEARCH_RADIUS}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5km</span>
                  <span>{MAX_SEARCH_RADIUS}km</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground">
          We'll show service providers in your selected area. You can adjust the search radius to find more options.
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationSelector;