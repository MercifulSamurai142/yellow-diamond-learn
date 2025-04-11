import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Award, ChevronRight } from "lucide-react";
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
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [overallProgress, setOverallProgress] = useState({
    moduleProgress: 0,
    completedModules: 0,
    totalModules: 0,
    unlockedAchievements: 0,
    totalAchievements: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .order('order');
          
        if (modulesError) throw modulesError;
        
        // For each module, get lessons and progress
        const modulesWithProgress = await Promise.all(
          modulesData.map(async (module) => {
            // Get lessons for this module
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select('id')
              .eq('module_id', module.id);
              
            if (lessonsError) throw lessonsError;
            
            const lessonCount = lessonsData?.length || 0;
            
            // Get user progress for this module
            const { data: progressData, error: progressError } = await supabase
              .from('user_progress')
              .select('lesson_id, status')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .in('lesson_id', lessonsData?.map(l => l.id) || []);
              
            if (progressError) throw progressError;
            
            const completedLessons = progressData?.length || 0;
            const progressPercentage = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;
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
          })
        );
        
        setModules(modulesWithProgress);
        
        // Calculate overall progress
        const totalLessons = modulesWithProgress.reduce((sum, module) => sum + module.lessons, 0);
        const completedLessons = modulesWithProgress.reduce((sum, module) => 
          sum + Math.round((module.progress / 100) * module.lessons), 0);
        const overallProgressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const completedModulesCount = modulesWithProgress.filter(m => m.status === "completed").length;
        
        // Fetch achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*');
          
        if (achievementsError) throw achievementsError;
        
        // Fetch unlocked achievements
        const { data: unlockedAchievementsData, error: unlockedError } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);
          
        if (unlockedError) throw unlockedError;
        
        const unlockedIds = new Set(unlockedAchievementsData?.map(ua => ua.achievement_id) || []);
        
        const achievementsWithStatus = achievementsData.map(achievement => ({
          ...achievement,
          unlocked: unlockedIds.has(achievement.id)
        }));
        
        setAchievements(achievementsWithStatus);
        
        // Update overall stats
        setOverallProgress({
          moduleProgress: overallProgressPercentage,
          completedModules: completedModulesCount,
          totalModules: modulesWithProgress.length,
          unlockedAchievements: unlockedIds.size,
          totalAchievements: achievementsData.length
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  // Find the most appropriate module to continue
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            {/* Hero Banner */}
            <HeroBanner />
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-orange-600">Welcome to Yellow Diamond Academy</h2>
              <p className="text-slate-500">Track your progress and continue your learning journey</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <>
                {/* Progress summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-primary/10 rounded-lg mr-4">
                        <BookOpen size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Course Progress</p>
                        <p className="text-2xl font-semibold">{overallProgress.moduleProgress}%</p>
                      </div>
                    </div>
                  </YDCard>
                  
                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-green-500/10 rounded-lg mr-4">
                        <CheckCircle size={24} className="text-green-500" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Modules Completed</p>
                        <p className="text-2xl font-semibold">{overallProgress.completedModules}/{overallProgress.totalModules}</p>
                      </div>
                    </div>
                  </YDCard>
                  
                  <YDCard>
                    <div className="flex items-center p-4">
                      <div className="p-3 bg-amber-500/10 rounded-lg mr-4">
                        <Award size={24} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Achievements</p>
                        <p className="text-2xl font-semibold">{overallProgress.unlockedAchievements}/{overallProgress.totalAchievements}</p>
                      </div>
                    </div>
                  </YDCard>
                </div>
                
                {/* Modules */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-yd-navy">Your Modules</h3>
                    <Link to="/modules" className="text-sm text-primary flex items-center hover:underline">
                      View all modules <ChevronRight size={16} />
                    </Link>
                  </div>
                  
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
                              {module.progress > 0 ? "Continue" : "Start"} Module
                            </YDButton>
                          </Link>
                        </YDCardFooter>
                      </YDCard>
                    ))}
                  </div>
                </div>
                
                {/* Recent Achievements */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-yd-navy">Recent Achievements</h3>
                    <Link to="/achievements" className="text-sm text-primary flex items-center hover:underline">
                      View all achievements <ChevronRight size={16} />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {achievements.slice(0, 3).map((achievement) => (
                      <YDCard 
                        key={achievement.id} 
                        className={`${!achievement.unlocked && "opacity-60 grayscale"}`}
                      >
                        <div className="flex items-center p-4">
                          <div className={`p-3 ${achievement.unlocked ? "bg-primary/10" : "bg-muted"} rounded-lg mr-4`}>
                            <Award 
                              size={24} 
                              className={achievement.unlocked ? "text-primary" : "text-muted-foreground"} 
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
