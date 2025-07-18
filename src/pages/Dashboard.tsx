// yellow-diamond-learn-main/src/pages/Dashboard.tsx
import { useEffect, useState, useContext } from "react"; // Import useContext
import { BookOpen, CheckCircle, Award, ChevronRight, Loader2} from "lucide-react";
import {
  YDCard,
  YDCardContent,
  YDCardDescription,
  YDCardFooter,
  YDCardHeader,
  YDCardTitle
} from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import HeroBanner from "@/components/dashboard/HeroBanner";
import { useProgress } from "@/contexts/ProgressContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext

type ModuleWithProgress = Tables<"modules"> & {
  lessons: number;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
};

type Achievement = Tables<"achievements"> & {
  unlocked: boolean;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { progressStats, isLoading: isProgressLoading } = useProgress();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]); // Achievements list, kept as is.
  const [isListLoading, setIsListLoading] = useState(true);
  const isMobile = useIsMobile();
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage from context

  // Translation object structure
  const translations = {
    english: {
      hello: "Hello",
      welcomeTitle: "Welcome to Yellow Diamond Academy",
      welcomeSubtitle: "Track your progress and continue your learning journey",
      courseProgress: "Course Progress",
      modulesCompleted: "Modules Completed",
      yourModules: "Your Modules",
      viewAllModules: "View all modules",
      lessons: "lessons",
      complete: "Complete",
      startModule: "Start",
      continueModule: "Continue",
      reviewModule: "Review",
      module: "Module",
      noModulesAvailable: "No modules available for the selected language.",
      errorTitle: "Error",
      errorDescription: "Failed to load dashboard lists"
    },
    hindi: {
      hello: "नमस्ते",
      welcomeTitle: "यलो डायमंड एकेडमी में आपका स्वागत है",
      welcomeSubtitle: "अपनी प्रगति को ट्रैक करें और अपनी सीखने की यात्रा जारी रखें",
      courseProgress: "कोर्स प्रगति",
      modulesCompleted: "मॉड्यूल पूर्ण",
      yourModules: "आपके मॉड्यूल",
      viewAllModules: "सभी मॉड्यूल देखें",
      lessons: "पाठ",
      complete: "पूर्ण",
      startModule: "शुरू करें",
      continueModule: "जारी रखें",
      reviewModule: "समीक्षा",
      module: "मॉड्यूल",
      noModulesAvailable: "चयनित भाषा के लिए कोई मॉड्यूल उपलब्ध नहीं है।",
      errorTitle: "त्रुटि",
      errorDescription: "डैशबोर्ड सूची लोड करने में असफल"
    },
    kannada: {
      hello: "ನಮಸ್ಕಾರ",
      welcomeTitle: "ಯೆಲ್ಲೊ ಡೈಮಂಡ್ ಅಕಾಡೆಮಿಗೆ ಸ್ವಾಗತ",
      welcomeSubtitle: "ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಯಾಣವನ್ನು ಮುಂದುವರಿಸಿ",
      courseProgress: "ಕೋರ್ಸ್ ಪ್ರಗತಿ",
      modulesCompleted: "ಮಾಡ್ಯೂಲ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ",
      yourModules: "ನಿಮ್ಮ ಮಾಡ್ಯೂಲ್‌ಗಳು",
      viewAllModules: "ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
      lessons: "ಪಾಠಗಳು",
      complete: "ಪೂರ್ಣ",
      startModule: "ಪ್ರಾರಂಭಿಸಿ",
      continueModule: "ಮುಂದುವರಿಸಿ",
      reviewModule: "ಪರಿಶೀಲನೆ",
      module: "ಮಾಡ್ಯೂಲ್",
      noModulesAvailable: "ಆಯ್ಕೆಮಾಡಿದ ಭಾಷೆಗಾಗಿ ಯಾವುದೇ ಮಾಡ್ಯೂಲ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ.",
      errorTitle: "ದೋಷ",
      errorDescription: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪಟ್ಟಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ"
    }
  };

  // Get current language translations
  const t = translations[currentLanguage] || translations.english;

  useEffect(() => {
    if (!user) {
      setIsListLoading(false);
      return;
    }

    const fetchListData = async () => {
      try {
        setIsListLoading(true);

        // Fetch modules filtered by currentLanguage
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('language', currentLanguage) // Apply language filter
          .order('order');

        if (modulesError) throw modulesError;
        if (!modulesData) {
          setModules([]);
          setIsListLoading(false);
          return;
        }

        // Fetch all lessons (also filtered by language to match modules)
        const { data: allLessonsData, error: lessonsError } = await supabase
           .from('lessons')
           .select('id, module_id')
           .eq('language', currentLanguage); // Filter lessons by language

        if (lessonsError) throw lessonsError;
        // Don't throw fatal if no lessons, calculations will handle it.

        // Fetch completed progress items for the user (not language specific)
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (progressError) throw progressError;

        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || []);


        // Map modules to include progress and status for display
        const modulesWithProgress = modulesData.map((module) => {
            const lessonsInModule = (allLessonsData || []).filter(l => l.module_id === module.id);
            const lessonCount = lessonsInModule.length;
            const completedLessonsInModule = lessonsInModule.filter(l => completedLessonIds.has(l.id)).length;

            const progressPercentage = lessonCount > 0
                ? Math.round((completedLessonsInModule / lessonCount) * 100)
                : 0;

            let status: "not-started" | "in-progress" | "completed" = "not-started";
            if (progressPercentage === 100) {
              status = "completed";
            } else if (progressPercentage > 0) {
              status = "in-progress";
            }

            return {
              ...module,
              lessons: lessonCount,
              progress: progressPercentage,
              status
            };
        });

        setModules(modulesWithProgress);

        // Achievements fetching is left as is, as it's typically language-agnostic
        // (commented out in original, so keeping it commented)
        // const { data: achievementsData, error: achievementsError } = await supabase
        //   .from('achievements')
        //   .select('*');
        // if (achievementsError) throw achievementsError;
        // const { data: unlockedAchievementsData, error: unlockedError } = await supabase
        //   .from('user_achievements')
        //   .select('achievement_id')
        //   .eq('user_id', user.id);
        // if (unlockedError) throw unlockedError;
        // const unlockedIds = new Set(unlockedAchievementsData?.map(ua => ua.achievement_id) || []);
        // const achievementsWithStatus = achievementsData.map(achievement => ({
        //   ...achievement,
        //   unlocked: unlockedIds.has(achievement.id)
        // }));
        // setAchievements(achievementsWithStatus);

      } catch (error) {
        console.error('Error fetching dashboard list data:', error);
        toast({
          variant: "destructive",
          title: t.errorTitle,
          description: t.errorDescription
        });
        setModules([]);
      } finally {
        setIsListLoading(false);
      }
    };

    fetchListData();
  }, [user, currentLanguage, t.errorTitle, t.errorDescription]); // Re-run effect when currentLanguage changes

  const findContinueModule = () => {
    const inProgressModules = modules.filter(m => m.status === "in-progress");
    if (inProgressModules.length > 0) {
      return inProgressModules.sort((a, b) => b.progress - a.progress)[0];
    }

    const notStartedModules = modules.filter(m => m.status === "not-started");
    if (notStartedModules.length > 0) {
      return notStartedModules.sort((a, b) => a.order - b.order)[0];
    }

    return modules[0];
  };

  const continueModule = modules.length > 0 ? findContinueModule() : null;
  const showOverallLoading = isProgressLoading || isListLoading;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className={isMobile ? "px-0 mb-8" : "yd-container animate-fade-in mb-8 p-6"}>
            <HeroBanner />
          </div>

          <div className={cn("animate-fade-in", isMobile ? "px-4" : "yd-container")}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-orange-600">{t.welcomeTitle}</h2>
              <p className="text-slate-500">{t.welcomeSubtitle}</p>
            </div>

            {/* Hello greeting */}
            <div className="text-lg mb-4 text-foreground">{t.hello}</div>

            {showOverallLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Progress summary - Uses progressStats from ProgressContext */}
                {/* These stats are global but will be based on the language-filtered data in ProgressContext */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-primary/10 rounded-lg mr-4">
                        <BookOpen size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm">{t.courseProgress}</p>
                        <p className="text-2xl font-semibold">{progressStats.moduleProgress}%</p>
                      </div>
                    </div>
                  </YDCard>

                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-green-500/10 rounded-lg mr-4">
                        <CheckCircle size={24} className="text-green-500" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm">{t.modulesCompleted}</p>
                        <p className="text-2xl font-semibold">{progressStats.completedModules}/{progressStats.totalModules}</p>
                      </div>
                    </div>
                  </YDCard>
                </div>

                {/* Modules - Uses local 'modules' state (already filtered by language) */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-foreground">{t.yourModules}</h3>
                    <Link to="/modules" className="text-sm text-primary flex items-center hover:underline">
                      {t.viewAllModules} <ChevronRight size={16} />
                    </Link>
                  </div>

                  {isListLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>)}
                    </div>
                  ) : modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modules.map((module) => (
                        <YDCard key={module.id} className="hover:border-primary transition-colors flex flex-col h-full">
                          <YDCardHeader>
                            <YDCardTitle>{module.name}</YDCardTitle>
                            <YDCardDescription>{module.description}</YDCardDescription>
                          </YDCardHeader>
                          <YDCardContent className="mt-auto">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{module.progress}% {t.complete}</span>
                              <span className="text-sm text-muted-foreground">{module.lessons} {t.lessons}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-1">
                              <div
                                className="bg-primary rounded-full h-2"
                                style={{ width: `${module.progress}%` }}
                              ></div>
                            </div>
                          </YDCardContent>
                          <YDCardFooter className="mt-auto">
                            <Link to={`/modules/${module.id}`} className="w-full">
                              <YDButton variant="default" className="w-full">
                                {module.status === 'completed' ? t.reviewModule : module.status === 'in-progress' ? t.continueModule : t.startModule} {t.module}
                              </YDButton>
                            </Link>
                          </YDCardFooter>
                        </YDCard>
                      ))}
                    </div>
                  ) : (
                     <p className="text-muted-foreground">{t.noModulesAvailable}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;