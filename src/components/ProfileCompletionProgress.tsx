import React from 'react';
import { CheckCircle, AlertCircle, User, Phone, MapPin, Building } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfileManagement } from '@/hooks/useProfileManagement';

interface ProfileCompletionProgressProps {
  showDetails?: boolean;
  className?: string;
}

const ProfileCompletionProgress: React.FC<ProfileCompletionProgressProps> = ({ 
  showDetails = true, 
  className = "" 
}) => {
  const { profile, profileCompletion, missingFields, isProfileComplete } = useProfileManagement();

  if (!profile) return null;

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'full_name':
        return <User className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'address':
      case 'city':
      case 'state':
      case 'pincode':
        return <MapPin className="w-4 h-4" />;
      case 'business_name':
        return <Building className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      full_name: 'Full Name',
      phone: 'Phone Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      pincode: 'Pincode',
      business_name: 'Business Name',
    };
    return labels[field] || field.replace('_', ' ');
  };

  const getProgressColor = () => {
    if (profileCompletion >= 100) return 'bg-green-500';
    if (profileCompletion >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = () => {
    if (isProfileComplete) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Incomplete
      </Badge>
    );
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
        </div>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completion</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-3" />
        </div>

        {/* Missing Fields */}
        {missingFields && missingFields.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Required Information Missing:
            </h4>
            <div className="space-y-2">
              {missingFields.map((field) => (
                <div key={field} className="flex items-center space-x-2 text-sm">
                  <div className="text-red-500">
                    {getFieldIcon(field)}
                  </div>
                  <span className="text-red-600">{getFieldLabel(field)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isProfileComplete ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Profile Complete!</p>
                <p className="text-xs text-green-600">
                  You can now access all platform features.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Complete your profile to unlock all features
                </p>
                <p className="text-xs text-yellow-600">
                  Some features may be restricted until your profile is complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionProgress;