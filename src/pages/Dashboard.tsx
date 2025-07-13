import { useEffect, useState } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { cn } from "@/lib/utils";

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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const isMobile = useIsMobile(); // Use the mobile hook

  useEffect(() => {
    if (!user) {
      setIsListLoading(false); // Stop loading if no user
      return;
    }

    const fetchListData = async () => {
      // Fetch data needed specifically for rendering the lists in the dashboard
      try {
        setIsListLoading(true);

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*') // Select all fields needed for display
          .order('order');

        if (modulesError) throw modulesError;
        if (!modulesData) throw new Error("No modules found");

        // Fetch all lessons to calculate progress per module
        const { data: allLessonsData, error: lessonsError } = await supabase
           .from('lessons')
           .select('id, module_id'); // Select needed fields

        if (lessonsError) throw lessonsError;
        if (!allLessonsData) throw new Error("No lessons found");

        // Fetch completed progress items for the user
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (progressError) throw progressError;

        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || []);


        // Map modules to include progress and status for display
        const modulesWithProgress = modulesData.map((module) => {
            const lessonsInModule = allLessonsData.filter(l => l.module_id === module.id);
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

        // Fetch achievements
        // const { data: achievementsData, error: achievementsError } = await supabase
        //   .from('achievements')
        //   .select('*'); // Select fields needed for display

        // if (achievementsError) throw achievementsError;
        // if (!achievementsData) throw new Error("No achievements found");

        // // Fetch unlocked achievements
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
          title: "Error",
          description: "Failed to load dashboard lists"
        });
      } finally {
        setIsListLoading(false);
      }
    };

    fetchListData();
  }, [user]);

  // Find the most appropriate module to continue from local "modules" state
  const findContinueModule = () => {
    // First priority: in-progress modules
    const inProgressModules = modules.filter(m => m.status === "in-progress");
    if (inProgressModules.length > 0) {
      return inProgressModules.sort((a, b) => b.progress - a.progress)[0];
    }

    // Second priority: not-started modules
    const notStartedModules = modules.filter(m => m.status === "not-started");
    if (notStartedModules.length > 0) {
      return notStartedModules.sort((a, b) => a.order - b.order)[0];
    }

    // Default to first module if all completed
    return modules[0];
  };

  const continueModule = modules.length > 0 ? findContinueModule() : null;
  // Combine loading states for the main spinner display
  const showOverallLoading = isProgressLoading || isListLoading;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto"> {/* Removed p-6 from main */}
          {/* Hero Banner - Conditionally apply padding/margin */}
          <div className={isMobile ? "px-0 mb-8" : "yd-container animate-fade-in mb-8 p-6"}> {/* Added conditional px-0 */}
            <HeroBanner />
          </div>

          <div className={cn("animate-fade-in", isMobile ? "px-4" : "yd-container")}> {/* Apply yd-container or mobile padding */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-orange-600">Welcome to Yellow Diamond Academy</h2>
              <p className="text-slate-500">Track your progress and continue your learning journey</p>
            </div>

            {showOverallLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Progress summary - Uses progressStats from Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-primary/10 rounded-lg mr-4">
                        <BookOpen size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm">Course Progress</p>
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
                        <p className="text-foreground text-sm">Modules Completed</p>
                        <p className="text-2xl font-semibold">{progressStats.completedModules}/{progressStats.totalModules}</p>
                      </div>
                    </div>
                  </YDCard>

                  {/* <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-amber-500/10 rounded-lg mr-4">
                        <Award size={24} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Achievements</p>
                        <p className="text-2xl font-semibold">{progressStats.unlockedAchievements}/{progressStats.totalAchievements}</p>
                      </div>
                    </div>
                  </YDCard> */}
                </div>

                {/* Modules - Uses local 'modules' state */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-foreground">Your Modules</h3>
                    <Link to="/modules" className="text-sm text-primary flex items-center hover:underline">
                      View all modules <ChevronRight size={16} />
                    </Link>
                  </div>

                  {isListLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>)}
                    </div>
                  ) : modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modules.map((module) => (
                        <YDCard key={module.id} className="hover:border-primary transition-colors">
                          <YDCardHeader>
                            <YDCardTitle>{module.name}</YDCardTitle>
                            <YDCardDescription>{module.description}</YDCardDescription>
                          </YDCardHeader>
                          <YDCardContent>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{module.progress}% Complete</span>
                              <span className="text-sm text-muted-foreground">{module.lessons} lessons</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-1">
                              <div
                                className="bg-primary rounded-full h-2"
                                style={{ width: `${module.progress}%` }}
                              ></div>
                            </div>
                          </YDCardContent>
                          <YDCardFooter>
                            <Link to={`/modules/${module.id}`} className="w-full">
                              <YDButton variant="default" className="w-full">
                                {module.status === 'completed' ? "Review" : module.status === 'in-progress' ? "Continue" : "Start"} Module
                              </YDButton>
                            </Link>
                          </YDCardFooter>
                        </YDCard>
                      ))}
                    </div>
                  ) : (
                     <p className="text-muted-foreground">No modules assigned yet.</p>
                  )}
                </div>

                {/* Recent Achievements - Uses local 'achievements' state */}
                
                {/* 
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-foreground">Recent Achievements</h3>
                    <Link to="/achievements" className="text-sm text-primary flex items-center hover:underline">
                      View all achievements <ChevronRight size={16} />
                    </Link>
                  </div>
                  {isListLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>)}
                    </div>
                  ) : achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      // Show unlocked first, then locked, limit to 3
                      {[...achievements]
                          .sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))
                          .slice(0, 3)
                          .map((achievement) => (
                        <YDCard
                          key={achievement.id}
                          className={`${!achievement.unlocked && "opacity-60 grayscale"}`}
                        >
                          <div className="flex items-center p-4">
                            <div className={`p-3 ${achievement.unlocked ? "bg-amber-500/10" : "bg-muted"} rounded-lg mr-4`}>
                              <Award
                                size={24}
                                className={achievement.unlocked ? "text-amber-500" : "text-muted-foreground"}
                              />
                            </div>
                            <div>
                              <h4 className="font-medium">{achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                          </div>
                        </YDCard>
                      ))}
                    </div>
                  ) : (
                      <p className="text-muted-foreground">No achievements available yet.</p>
                  )}
                </div> 
                */}
                  
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;