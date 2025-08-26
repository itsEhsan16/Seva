import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceCategory } from "@/hooks/useServices";
import { Filter, X } from "lucide-react";

interface ServiceCategoryFilterProps {
  categories: ServiceCategory[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | undefined) => void;
  serviceCountByCategory?: Record<string, number>;
  className?: string;
}

const ServiceCategoryFilter = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  serviceCountByCategory = {},
  className = ""
}: ServiceCategoryFilterProps) => {
  const handleClearFilter = () => {
    onCategorySelect(undefined);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      onCategorySelect(undefined);
    } else {
      onCategorySelect(categoryId);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filter by Category</span>
        </div>
        {selectedCategoryId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <ScrollArea className="w-full">
        <div className="flex flex-wrap gap-2 pb-2">
          {/* All Categories Option */}
          <Button
            variant={!selectedCategoryId ? "default" : "outline"}
            size="sm"
            onClick={() => onCategorySelect(undefined)}
            className="h-auto py-2 px-3 text-sm"
          >
            All Services
            {!selectedCategoryId && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {Object.values(serviceCountByCategory).reduce((sum, count) => sum + count, 0)}
              </Badge>
            )}
          </Button>

          {/* Individual Categories */}
          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            const serviceCount = serviceCountByCategory[category.id] || 0;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category.id)}
                className="h-auto py-2 px-3 text-sm"
                disabled={serviceCount === 0}
              >
                {category.name}
                {serviceCount > 0 && (
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className="ml-2 text-xs"
                  >
                    {serviceCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Category Info */}
      {selectedCategoryId && (
        <div className="p-3 bg-muted/30 rounded-lg">
          {(() => {
            const selectedCategory = categories.find(c => c.id === selectedCategoryId);
            const serviceCount = serviceCountByCategory[selectedCategoryId] || 0;
            
            return (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    {selectedCategory?.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {serviceCount} service{serviceCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {selectedCategory?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ServiceCategoryFilter;