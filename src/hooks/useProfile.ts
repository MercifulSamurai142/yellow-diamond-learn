import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type UserProfile = Tables<"users">;

// Cache for profile data
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = profileCache.get(user.id);
      const now = Date.now();
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setProfile(cached.profile);
        setIsLoading(false);
        return;
      }

      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Update cache
        profileCache.set(user.id, { profile: data as UserProfile, timestamp: now });
        setProfile(data as UserProfile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
        fetchInProgress.current = false;
      }
    };

    fetchProfile();
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update cache
      profileCache.set(user.id, { profile: data as UserProfile, timestamp: Date.now() });
      setProfile(data as UserProfile);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
};
