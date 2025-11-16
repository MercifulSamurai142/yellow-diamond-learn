// yellow-diamond-learn-main/src/contexts/ProgressContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LanguageContext } from './LanguageContext'; // Import LanguageContext
import { useProfile } from '@/hooks/useProfile';

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
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage
  const [progressStats, setProgressStats] = useState<ProgressStats>(defaultProgressStats);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgressData = async () => {
    if (!user || !profile || isProfileLoading) {
        setProgressStats(defaultProgressStats);
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);

      let modulesQuery = supabase
        .from('modules')
        .select('id, order, language')
        .eq('language', currentLanguage);

      let authorizedStates: string[] = [];
      if (profile.role === 'region admin' && profile.id) {
          const { data: adminStatesData, error: adminStatesError } = await supabase
              .from('region_admin_state')
              .select('state')
              .eq('id', profile.id);
          if (adminStatesError) throw adminStatesError;
          authorizedStates = adminStatesData.map(row => row.state);

          if (authorizedStates.length === 0) {
              setProgressStats(defaultProgressStats);
              setIsLoading(false);
              return;
          }
      }

      const { data: modulesData, error: modulesError } = await modulesQuery;
      if (modulesError) throw modulesError;
      if (!modulesData) throw new Error("No modules found");
      
      let filteredModules = modulesData;

      if (profile.role === 'admin') {
          // Admin sees all modules for the selected language
      } else if (profile.role === 'region admin') {
          // Region admin sees modules mapped to their assigned states
          const { data: moduleStates, error: stateError } = await supabase.from('module_state').select('module_id, state');
          if (stateError) throw stateError;
          const statesMap = new Map<string, string[]>();
          for (const ms of moduleStates) {
              if (!statesMap.has(ms.module_id)) statesMap.set(ms.module_id, []);
              statesMap.get(ms.module_id)!.push(ms.state);
          }

          filteredModules = filteredModules.filter(module => {
              const moduleStates = statesMap.get(module.id) || [];
              const isModuleStateRestricted = moduleStates.length > 0;

              if (!isModuleStateRestricted) {
                  return false; // Modules with no state restriction are not shown to region admins
              }
              return moduleStates.some(ms => authorizedStates.includes(ms));
          });

      } else { // Learner role
          const moduleIds = modulesData.map(m => m.id);
          if(moduleIds.length === 0) {
              filteredModules = [];
          } else {
              const { data: moduleDesignations, error: desError } = await supabase.from('module_designation').select('module_id, designation').in('module_id', moduleIds);
              if (desError) throw desError;
              const designationsMap = new Map<string, string[]>();
              for (const md of moduleDesignations) {
                  if (!designationsMap.has(md.module_id)) designationsMap.set(md.module_id, []);
                  designationsMap.get(md.module_id)!.push(md.designation);
              }

              const { data: moduleStates, error: stateError } = await supabase.from('module_state').select('module_id, state').in('module_id', moduleIds);
              if (stateError) throw stateError;
              const statesMap = new Map<string, string[]>();
              for (const ms of moduleStates) {
                  if (!statesMap.has(ms.module_id)) statesMap.set(ms.module_id, []);
                  statesMap.get(ms.module_id)!.push(ms.state);
              }

              const userDesignation = profile.designation;
              const userState = profile.state;

              filteredModules = modulesData.filter(module => {
                  const designations = designationsMap.get(module.id) || [];
                  const states = statesMap.get(module.id) || [];
                  const isDesignationRestricted = designations.length > 0;
                  const isStateRestricted = states.length > 0;

                  if (!isDesignationRestricted && !isStateRestricted && profile.role !== 'admin') {
                      return false;
                  }

                  const userMatchesDesignation = !isDesignationRestricted || (!!userDesignation && designations.includes(userDesignation));
                  const userMatchesState = !isStateRestricted || (!!userState && states.includes(userState));

                  return userMatchesDesignation && userMatchesState;
              });
          }
      }

      const filteredModuleIds = filteredModules.map(m => m.id);

      if (filteredModuleIds.length === 0) {
          setProgressStats({ ...defaultProgressStats, totalModules: 0 });
          setIsLoading(false);
          return;
      }

      // Fetch all lessons for progress calculation, also filtered by language
      const { data: allLessonsData, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', filteredModuleIds)
        .eq('language', currentLanguage); // Filter lessons by current language

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

       // Calculate overall module progress percentage based on filtered lessons
       const totalLessonsCount = allLessonsData.length;
       const completedLessonsCount = allLessonsData.filter(lesson => completedLessonIds.has(lesson.id)).length;
       const overallProgressPercentage = totalLessonsCount > 0
           ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
           : 0;

       // Calculate completed modules count based on filtered modules and lessons
       let completedModulesCount = 0;
       for (const module of filteredModules) {
           const lessonsInModule = allLessonsData.filter(l => l.module_id === module.id);
           const allLessonsInModuleCompleted = lessonsInModule.length > 0 && lessonsInModule.every(l => completedLessonIds.has(l.id));
           if (allLessonsInModuleCompleted) {
               completedModulesCount++;
           }
       }

      // Fetch achievements (these are generally not language specific)
      const { count: achievementsCount, error: achievementsError } = await supabase
        .from('achievements')
        .select('id', { count: 'exact', head: true });

      if (achievementsError) throw achievementsError;

      // Fetch unlocked achievements
      const { count: unlockedAchievementsCount, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (unlockedError) throw unlockedError;

      setProgressStats({
        moduleProgress: overallProgressPercentage,
        completedModules: completedModulesCount,
        totalModules: filteredModules.length,
        unlockedAchievements: unlockedAchievementsCount || 0,
        totalAchievements: achievementsCount || 0,
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
  }, [user, profile, isProfileLoading, currentLanguage]); // Refetch when user, profile or currentLanguage changes

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