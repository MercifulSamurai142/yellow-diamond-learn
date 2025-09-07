// yellow-diamond-learn-main/src/contexts/ProgressContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LanguageContext } from './LanguageContext'; // Import LanguageContext

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
  refetchProgress?: () => void;
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
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage
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

      // Fetch modules for the current language
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, order')
        .eq('language', currentLanguage); // Filter by language

      if (modulesError) throw modulesError;
      if (!modulesData) throw new Error("No modules found");

      // Fetch all lessons for progress calculation, also filtered by language
      const { data: allLessonsData, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, module_id')
        .eq('language', currentLanguage); // Filter by language

      if (allLessonsError) throw allLessonsError;
      if (!allLessonsData) throw new Error("No lessons found");

      // Fetch all completed progress items for the user
      // user_progress itself does not have a language column, it's linked to lesson_id.
      // So, completedLessonIds will be for lessons the user has completed regardless of language.
      // However, when calculating against `totalLessonsCount` and `completedModulesCount`,
      // we're already filtering `allLessonsData` and `modulesData` by language,
      // ensuring consistency with the displayed content.
       const { data: allUserProgressData, error: allUserProgressError } = await supabase
           .from('user_progress')
           .select('lesson_id')
           .eq('user_id', user.id)
           .eq('status', 'completed');

       if (allUserProgressError) throw allUserProgressError;

       const completedLessonIds = new Set(allUserProgressData?.map(p => p.lesson_id) || []);

       // Calculate overall module progress percentage based on filtered lessons
       const totalLessonsCount = allLessonsData.length;
       // Only count lessons completed that are also in the `allLessonsData` (i.e., current language)
       const completedLessonsCount = allLessonsData.filter(lesson => completedLessonIds.has(lesson.id)).length;
       const overallProgressPercentage = totalLessonsCount > 0
           ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
           : 0;

       // Calculate completed modules count based on filtered modules and lessons
       let completedModulesCount = 0;
       for (const module of modulesData) {
           const lessonsInModule = allLessonsData.filter(l => l.module_id === module.id);
           const allLessonsInModuleCompleted = lessonsInModule.length > 0 && lessonsInModule.every(l => completedLessonIds.has(l.id));
           if (allLessonsInModuleCompleted) {
               completedModulesCount++;
           }
       }

      // Fetch achievements (these are generally not language specific)
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('id');

      if (achievementsError) throw achievementsError;
      if (!achievementsData) throw new Error("No achievements found");

      // Fetch unlocked achievements
      const { data: unlockedAchievementsData, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (unlockedError) throw unlockedError;

      const unlockedIds = new Set(unlockedAchievementsData?.map(ua => ua.achievement_id) || []);

      setProgressStats({
        moduleProgress: overallProgressPercentage,
        completedModules: completedModulesCount,
        totalModules: modulesData.length, // total modules for the selected language
        unlockedAchievements: unlockedIds.size,
        totalAchievements: achievementsData.length,
      });

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
  }, [user, currentLanguage]); // Refetch when user or currentLanguage changes

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