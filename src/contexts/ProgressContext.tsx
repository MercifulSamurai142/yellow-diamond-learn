import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Define the shape of the progress stats
interface ProgressStats {
  moduleProgress: number;
  completedModules: number;
  totalModules: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

// Define the context type
interface ProgressContextType {
  progressStats: ProgressStats;
  isLoading: boolean;
  refetchProgress?: () => void; // Optional: Add a refetch function if needed elsewhere
}

// Default values for the context
const defaultProgressStats: ProgressStats = {
  moduleProgress: 0,
  completedModules: 0,
  totalModules: 0,
  unlockedAchievements: 0,
  totalAchievements: 0,
};

// Create the context
const ProgressContext = createContext<ProgressContextType>({
  progressStats: defaultProgressStats,
  isLoading: true,
});

// Create the provider component
export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progressStats, setProgressStats] = useState<ProgressStats>(defaultProgressStats);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgressData = async () => {
    if (!user) {
        // If no user, reset to default and stop loading
        setProgressStats(defaultProgressStats);
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);

      // --- Logic copied and adapted from Dashboard.tsx ---

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, order'); // Only fetch necessary fields for calculation

      if (modulesError) throw modulesError;
      if (!modulesData) throw new Error("No modules found");

      // Fetch all lessons for progress calculation
      const { data: allLessonsData, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, module_id');

      if (allLessonsError) throw allLessonsError;
      if (!allLessonsData) throw new Error("No lessons found");

      // Fetch all completed progress items for the user
       const { data: allUserProgressData, error: allUserProgressError } = await supabase
           .from('user_progress')
           .select('lesson_id')
           .eq('user_id', user.id)
           .eq('status', 'completed');

       if (allUserProgressError) throw allUserProgressError;

       const completedLessonIds = new Set(allUserProgressData?.map(p => p.lesson_id) || []);

       // Calculate overall module progress percentage
       const totalLessonsCount = allLessonsData.length;
       const completedLessonsCount = completedLessonIds.size;
       const overallProgressPercentage = totalLessonsCount > 0
           ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
           : 0;

       // Calculate completed modules count
       let completedModulesCount = 0;
       for (const module of modulesData) {
           const lessonsInModule = allLessonsData.filter(l => l.module_id === module.id);
           const allLessonsInModuleCompleted = lessonsInModule.length > 0 && lessonsInModule.every(l => completedLessonIds.has(l.id));
           if (allLessonsInModuleCompleted) {
               completedModulesCount++;
           }
       }


      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('id'); // Only fetch necessary fields for calculation

      if (achievementsError) throw achievementsError;
      if (!achievementsData) throw new Error("No achievements found");

      // Fetch unlocked achievements
      const { data: unlockedAchievementsData, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (unlockedError) throw unlockedError;

      const unlockedIds = new Set(unlockedAchievementsData?.map(ua => ua.achievement_id) || []);

      // Update overall stats state
      setProgressStats({
        moduleProgress: overallProgressPercentage,
        completedModules: completedModulesCount,
        totalModules: modulesData.length,
        unlockedAchievements: unlockedIds.size,
        totalAchievements: achievementsData.length,
      });
       // --- End of copied logic ---

    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load progress data"
      });
       // Keep default stats on error, but stop loading
      setProgressStats(defaultProgressStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [user]); // Refetch when user changes

  return (
    <ProgressContext.Provider value={{ progressStats, isLoading, refetchProgress: fetchProgressData }}>
      {children}
    </ProgressContext.Provider>
  );
};

// Create a hook for easy consumption
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};