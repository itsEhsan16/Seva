import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SystemAnnouncement, notificationService } from '@/lib/notificationService';

export const useSystemAnnouncements = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by target audience
      const filteredAnnouncements = data?.filter(announcement => 
        announcement.target_audience === 'all' || 
        announcement.target_audience === profile?.role
      ) || [];

      setAnnouncements(filteredAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.role]);

  // Create system announcement (admin only)
  const createAnnouncement = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'maintenance' | 'feature' = 'info',
    targetAudience: 'all' | 'customers' | 'providers' | 'admins' = 'all',
    startsAt?: Date,
    endsAt?: Date
  ) => {
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can create announcements');
    }

    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .insert({
          title,
          message,
          type,
          target_audience: targetAudience,
          starts_at: startsAt?.toISOString() || new Date().toISOString(),
          ends_at: endsAt?.toISOString() || null,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast notification to users
      await notificationService.broadcastSystemAnnouncement(
        title,
        message,
        type,
        targetAudience
      );

      // Update local state
      setAnnouncements(prev => [data, ...prev]);

      toast({
        title: "Announcement Created",
        description: "System announcement has been broadcast to users",
      });

      return data;
    } catch (err) {
      console.error('Error creating announcement:', err);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
      throw err;
    }
  }, [profile, toast]);

  // Update announcement (admin only)
  const updateAnnouncement = useCallback(async (
    id: string,
    updates: Partial<SystemAnnouncement>
  ) => {
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can update announcements');
    }

    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === id ? { ...announcement, ...data } : announcement
        )
      );

      toast({
        title: "Announcement Updated",
        description: "System announcement has been updated",
      });

      return data;
    } catch (err) {
      console.error('Error updating announcement:', err);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
      throw err;
    }
  }, [profile, toast]);

  // Deactivate announcement (admin only)
  const deactivateAnnouncement = useCallback(async (id: string) => {
    if (profile?.role !== 'admin') {
      throw new Error('Only admins can deactivate announcements');
    }

    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ 
          is_active: false,
          ends_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAnnouncements(prev => 
        prev.filter(announcement => announcement.id !== id)
      );

      toast({
        title: "Announcement Deactivated",
        description: "System announcement has been deactivated",
      });
    } catch (err) {
      console.error('Error deactivating announcement:', err);
      toast({
        title: "Error",
        description: "Failed to deactivate announcement",
        variant: "destructive",
      });
      throw err;
    }
  }, [profile, toast]);

  // Get announcements by type
  const getAnnouncementsByType = useCallback((type: SystemAnnouncement['type']) => {
    return announcements.filter(announcement => announcement.type === type);
  }, [announcements]);

  // Get maintenance announcements
  const getMaintenanceAnnouncements = useCallback(() => {
    return getAnnouncementsByType('maintenance');
  }, [getAnnouncementsByType]);

  // Check if there are any critical announcements
  const hasCriticalAnnouncements = useCallback(() => {
    return announcements.some(announcement => 
      announcement.type === 'warning' || announcement.type === 'maintenance'
    );
  }, [announcements]);

  // Initial fetch
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('system_announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_announcements'
        },
        () => {
          // Refetch announcements when changes occur
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchAnnouncements]);

  return {
    announcements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deactivateAnnouncement,
    getAnnouncementsByType,
    getMaintenanceAnnouncements,
    hasCriticalAnnouncements,
    fetchAnnouncements,
  };
};