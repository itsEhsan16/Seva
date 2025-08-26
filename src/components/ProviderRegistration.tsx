import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Upload, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  MapPin, 
  Briefcase, 
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useProviderRegistration } from "@/hooks/useProviderRegistration";
import { validateDocument, formatFileSize, isImageFile, isPdfFile } from "@/lib/documentUtils";

interface ProviderRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: "Business Info", icon: Building },
  { id: 2, title: "Contact & Location", icon: MapPin },
  { id: 3, title: "Skills & Services", icon: Briefcase },
  { id: 4, title: "Documents", icon: FileText },
];

export const ProviderRegistration: React.FC<ProviderRegistrationProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const {
    state,
    updateFormData,
    setDocuments,
    nextStep,
    prevStep,
    submitRegistration,
    resetForm
  } = useProviderRegistration();
  
  const [skillInput, setSkillInput] = useState('');
  const [serviceAreaInput, setServiceAreaInput] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !state.formData.skills?.includes(skillInput.trim())) {
      const currentSkills = state.formData.skills || [];
      updateFormData('skills', [...currentSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = state.formData.skills || [];
    updateFormData('skills', currentSkills.filter(s => s !== skill));
  };

  const addServiceArea = () => {
    if (serviceAreaInput.trim() && !state.formData.service_areas?.includes(serviceAreaInput.trim())) {
      const currentAreas = state.formData.service_areas || [];
      updateFormData('service_areas', [...currentAreas, serviceAreaInput.trim()]);
      setServiceAreaInput('');
    }
  };

  const removeServiceArea = (area: string) => {
    const currentAreas = state.formData.service_areas || [];
    updateFormData('service_areas', currentAreas.filter(a => a !== area));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate each file
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      files.forEach(file => {
        const validation = validateDocument(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          errors.push(...validation.errors);
        }
      });
      
      if (errors.length > 0) {
        toast({
          title: "File Validation Error",
          description: errors.join(', '),
          variant: "destructive",
        });
      }
      
      setDocuments(validFiles);
    }
  };

  const handleSubmit = async () => {
    const success = await submitRegistration();
    if (success) {
      onSuccess();
      resetForm();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStepContent = () => {
    switch (state.step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={state.formData.business_name || ''}
                onChange={(e) => updateFormData('business_name', e.target.value)}
                placeholder="Enter your business name"
              />
              {state.errors.business_name && (
                <p className="text-sm text-red-500 mt-1">{state.errors.business_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="business_description">Business Description *</Label>
              <Textarea
                id="business_description"
                value={state.formData.business_description || ''}
                onChange={(e) => updateFormData('business_description', e.target.value)}
                placeholder="Describe your business and services (minimum 50 characters)"
                rows={4}
              />
              {state.errors.business_description && (
                <p className="text-sm text-red-500 mt-1">{state.errors.business_description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Years of Experience *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={state.formData.experience_years || ''}
                  onChange={(e) => updateFormData('experience_years', parseInt(e.target.value) || 0)}
                />
                {state.errors.experience_years && (
                  <p className="text-sm text-red-500 mt-1">{state.errors.experience_years}</p>
                )}
              </div>

              <div>
                <Label htmlFor="business_license">Business License Number</Label>
                <Input
                  id="business_license"
                  value={state.formData.business_license || ''}
                  onChange={(e) => updateFormData('business_license', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={state.formData.tax_id || ''}
                  onChange={(e) => updateFormData('tax_id', e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="insurance_number">Insurance Number</Label>
                <Input
                  id="insurance_number"
                  value={state.formData.insurance_number || ''}
                  onChange={(e) => updateFormData('insurance_number', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={state.formData.website_url || ''}
                onChange={(e) => updateFormData('website_url', e.target.value)}
                placeholder="https://your-website.com (optional)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={state.formData.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                placeholder="Enter your full name"
              />
              {state.errors.full_name && (
                <p className="text-sm text-red-500 mt-1">{state.errors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={state.formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
              {state.errors.phone && (
                <p className="text-sm text-red-500 mt-1">{state.errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Business Address *</Label>
              <Textarea
                id="address"
                value={state.formData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Enter your complete business address"
                rows={3}
              />
              {state.errors.address && (
                <p className="text-sm text-red-500 mt-1">{state.errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={state.formData.city || ''}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="City"
                />
                {state.errors.city && (
                  <p className="text-sm text-red-500 mt-1">{state.errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={state.formData.state || ''}
                  onChange={(e) => updateFormData('state', e.target.value)}
                  placeholder="State"
                />
                {state.errors.state && (
                  <p className="text-sm text-red-500 mt-1">{state.errors.state}</p>
                )}
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={state.formData.pincode || ''}
                  onChange={(e) => updateFormData('pincode', e.target.value)}
                  placeholder="Pincode"
                />
                {state.errors.pincode && (
                  <p className="text-sm text-red-500 mt-1">{state.errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Skills & Expertise *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(state.formData.skills || []).map((skill) => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer">
                    {skill}
                    <X 
                      className="ml-1 h-3 w-3" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
              {state.errors.skills && (
                <p className="text-sm text-red-500 mt-1">{state.errors.skills}</p>
              )}
            </div>

            <div>
              <Label>Service Areas *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a service area..."
                  value={serviceAreaInput}
                  onChange={(e) => setServiceAreaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                />
                <Button type="button" onClick={addServiceArea} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(state.formData.service_areas || []).map((area) => (
                  <Badge key={area} variant="outline" className="cursor-pointer">
                    {area}
                    <X 
                      className="ml-1 h-3 w-3" 
                      onClick={() => removeServiceArea(area)}
                    />
                  </Badge>
                ))}
              </div>
              {state.errors.service_areas && (
                <p className="text-sm text-red-500 mt-1">{state.errors.service_areas}</p>
              )}
            </div>

            <div>
              <Label>Certifications</Label>
              <Textarea
                value={(state.formData.certifications || []).join(', ')}
                onChange={(e) => updateFormData('certifications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="List your certifications (comma-separated)"
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="documents">Upload Verification Documents *</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload business license, certifications, ID proof, etc. (PDF, JPG, PNG - Max 5MB per file)
              </p>
              {state.errors.documents && (
                <p className="text-sm text-red-500 mt-1">{state.errors.documents}</p>
              )}
            </div>

            {state.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                <div className="space-y-2">
                  {state.documents.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      {isImageFile(file) ? (
                        <img src="/placeholder.svg" alt="Document" className="w-8 h-8 object-cover rounded" />
                      ) : isPdfFile(file) ? (
                        <FileText className="w-8 h-8 text-red-500" />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const progress = (state.step / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Become a Service Provider</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {state.step} of {STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === state.step;
              const isCompleted = step.id < state.step;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                      isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                      'border-muted-foreground bg-background'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs text-center ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {STEPS.find(s => s.id === state.step)?.title}
              </h3>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={state.step === 1 ? handleClose : prevStep}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {state.step === 1 ? 'Cancel' : 'Previous'}
              </Button>
              
              {state.step < STEPS.length ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={state.loading}
                  className="flex-1"
                >
                  {state.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};