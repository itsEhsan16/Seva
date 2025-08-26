import React, { useState } from 'react';
import { 
  Megaphone, 
  Info, 
  AlertTriangle, 
  Wrench, 
  Sparkles,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSystemAnnouncements } from '@/hooks/useSystemAnnouncements';
import { useAuth } from '@/contexts/AuthContext';
import { SystemAnnouncement } from '@/lib/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface SystemAnnouncementsProps {
  showCreateButton?: boolean;
  maxAnnouncements?: number;
}

export const SystemAnnouncements: React.FC<SystemAnnouncementsProps> = ({
  showCreateButton = false,
  maxAnnouncements = 5
}) => {
  const { profile } = useAuth();
  const {
    announcements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deactivateAnnouncement,
    hasCriticalAnnouncements,
  } = useSystemAnnouncements();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as SystemAnnouncement['type'],
    targetAudience: 'all' as SystemAnnouncement['target_audience'],
    endsAt: ''
  });

  const getAnnouncementIcon = (type: SystemAnnouncement['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'feature':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAnnouncementColor = (type: SystemAnnouncement['type']) => {
    switch (type) {
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'maintenance':
        return 'border-red-200 bg-red-50';
      case 'feature':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getBadgeVariant = (type: SystemAnnouncement['type']) => {
    switch (type) {
      case 'warning':
        return 'secondary' as const;
      case 'maintenance':
        return 'destructive' as const;
      case 'feature':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await createAnnouncement(
        formData.title,
        formData.message,
        formData.type,
        formData.targetAudience,
        undefined,
        formData.endsAt ? new Date(formData.endsAt) : undefined
      );
      
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        endsAt: ''
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      await updateAnnouncement(editingAnnouncement.id, {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        target_audience: formData.targetAudience,
        ends_at: formData.endsAt || null
      });
      
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        endsAt: ''
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  const handleEditAnnouncement = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetAudience: announcement.target_audience,
      endsAt: announcement.ends_at ? announcement.ends_at.split('T')[0] : ''
    });
  };

  const handleDeactivateAnnouncement = async (id: string) => {
    try {
      await deactivateAnnouncement(id);
    } catch (error) {
      console.error('Error deactivating announcement:', error);
    }
  };

  const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements
    .filter(announcement => !dismissedAnnouncements.has(announcement.id))
    .slice(0, maxAnnouncements);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            Loading announcements...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAnnouncements.length === 0 && !showCreateButton) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with create button for admins */}
      {showCreateButton && profile?.role === 'admin' && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            System Announcements
          </h3>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create System Announcement</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Announcement message"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SystemAnnouncement['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="audience">Audience</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as SystemAnnouncement['target_audience'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="providers">Providers</SelectItem>
                        <SelectItem value="admins">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="endsAt">End Date (Optional)</Label>
                  <Input
                    id="endsAt"
                    type="date"
                    value={formData.endsAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateAnnouncement} className="flex-1">
                    Create Announcement
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Critical announcements alert */}
      {hasCriticalAnnouncements() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            There are important system announcements that require your attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Announcements list */}
      <div className="space-y-3">
        {visibleAnnouncements.map((announcement) => (
          <Card 
            key={announcement.id} 
            className={`${getAnnouncementColor(announcement.type)} border`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getAnnouncementIcon(announcement.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        {announcement.message}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getBadgeVariant(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(announcement.created_at), { 
                            addSuffix: true 
                          })}
                        </span>
                        
                        {announcement.target_audience !== 'all' && (
                          <Badge variant="outline" className="text-xs">
                            {announcement.target_audience}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {profile?.role === 'admin' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="h-6 w-6 p-0"
                            title="Edit announcement"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateAnnouncement(announcement.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Deactivate announcement"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissAnnouncement(announcement.id)}
                        className="h-6 w-6 p-0"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog 
        open={!!editingAnnouncement} 
        onOpenChange={(open) => !open && setEditingAnnouncement(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit System Announcement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-message">Message</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Announcement message"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SystemAnnouncement['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-audience">Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as SystemAnnouncement['target_audience'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="providers">Providers</SelectItem>
                    <SelectItem value="admins">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-endsAt">End Date (Optional)</Label>
              <Input
                id="edit-endsAt"
                type="date"
                value={formData.endsAt}
                onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpdateAnnouncement} className="flex-1">
                Update Announcement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingAnnouncement(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};