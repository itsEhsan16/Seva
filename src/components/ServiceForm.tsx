import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useServiceCategories } from "@/hooks/useServices";
import { Loader2, Upload, X, DollarSign, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const serviceFormSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  duration_minutes: z.number().min(15, "Duration must be at least 15 minutes"),
  category_id: z.string().min(1, "Please select a category"),
  service_areas: z.array(z.string()).min(1, "At least one service area is required"),
});

interface ServiceFormProps {
  service?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { categories } = useServiceCategories();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 60,
    category_id: '',
    service_areas: [] as string[],
    image_url: '',
    is_active: true
  });
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration_minutes: service.duration_minutes || 60,
        category_id: service.category_id || '',
        service_areas: service.service_areas || [],
        image_url: service.image_url || ''
      });
    }
  }, [service]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addServiceArea = () => {
    if (serviceAreaInput.trim() && !formData.service_areas.includes(serviceAreaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, serviceAreaInput.trim()]
      }));
      setServiceAreaInput('');
    }
  };

  const removeServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area)
    }));
  };

  const uploadImage = async () => {
    if (!imageFile || !profile?.id) return formData.image_url;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('service-images')
      .upload(fileName, imageFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const validateForm = () => {
    try {
      serviceFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image if a new one was selected
      const imageUrl = await uploadImage();

      const serviceData = {
        ...formData,
        image_url: imageUrl,
        provider_id: profile.id
      };

      if (service) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
          .eq('provider_id', profile.id);

        if (error) throw error;

        toast({
          title: "Service Updated",
          description: "Your service has been successfully updated.",
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;

        toast({
          title: "Service Added",
          description: "Your service has been successfully added.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {service ? 'Edit Service' : 'Add New Service'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  Service Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., House Cleaning, Plumbing Repair"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2">
                  Description
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your service in detail, including what's included..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price (₹)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="500"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration (minutes)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.duration_minutes.toString()} 
                    onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
                  >
                    <SelectTrigger className={errors.duration_minutes ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.duration_minutes && (
                    <p className="text-sm text-red-500 mt-1">{errors.duration_minutes}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category" className="flex items-center gap-2">
                    Category
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.category_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Service Areas</h3>
                <span className="text-red-500">*</span>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add service area (e.g., Mumbai, Delhi, Pune)..."
                  value={serviceAreaInput}
                  onChange={(e) => setServiceAreaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                  className={errors.service_areas ? "border-red-500" : ""}
                />
                <Button type="button" onClick={addServiceArea} variant="outline">
                  Add
                </Button>
              </div>

              {errors.service_areas && (
                <p className="text-sm text-red-500">{errors.service_areas}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {formData.service_areas.map((area) => (
                  <span key={area} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-secondary">
                    {area}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeServiceArea(area)}
                    />
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Add the cities or areas where you provide this service. This helps customers find you.
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Service Image</h3>
              </div>
              
              <div>
                <Label htmlFor="image">Upload Image (Optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a high-quality image that represents your service. Recommended size: 800x600px
                </p>
                
                {(formData.image_url || imageFile) && (
                  <div className="mt-3">
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} 
                      alt="Service image preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Service Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Status</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Service is active and available for booking
                </Label>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Inactive services won't be visible to customers and can't receive new bookings.
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {service ? 'Update Service' : 'Add Service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};