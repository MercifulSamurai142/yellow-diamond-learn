
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ModuleProgress = {
  id: string;
  name: string;
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  last_activity: string | null;
};

const Progress = () => {
  const [modulesProgress, setModulesProgress] = useState<ModuleProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get all modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, name, order')
          .order('order');

        if (modulesError) throw modulesError;
        
        // For each module, get its lessons and the user's progress
        const moduleProgressPromises = modulesData.map(async (module) => {
          // Get lessons for this module
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', module.id);
            
          if (lessonsError) throw lessonsError;
          
          const totalLessons = lessonsData ? lessonsData.length : 0;
          const lessonIds = lessonsData ? lessonsData.map(l => l.id) : [];
          
          // Get user progress for these lessons
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('lesson_id, status, completed_at')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['none'])
            .eq('status', 'completed');
            
          if (progressError) throw progressError;
          
          const completedLessons = progressData ? progressData.length : 0;
          const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          // Find most recent activity
          let lastActivity = null;
          if (progressData && progressData.length > 0) {
            progressData.sort((a, b) => {
              if (!a.completed_at) return 1;
              if (!b.completed_at) return -1;
              return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
            });
            lastActivity = progressData[0].completed_at;
          }
          
          return {
            id: module.id,
            name: module.name,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            percentage,
            last_activity: lastActivity
          };
        });
        
        const moduleProgressResults = await Promise.all(moduleProgressPromises);
        setModulesProgress(moduleProgressResults);
        
        // Calculate overall progress
        const totalLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.total_lessons, 0);
        const completedLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.completed_lessons, 0);
        const overallPercentage = totalLessonsAll > 0 ? Math.round((completedLessonsAll / totalLessonsAll) * 100) : 0;
        
        setOverallProgress(overallPercentage);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Learning Progress</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <>
                <YDCard className="mb-8">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Overall Progress</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-4">
                          <div 
                            className="bg-primary rounded-full h-4" 
                            style={{ width: `${overallProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-4 font-medium">{overallProgress}%</span>
                    </div>
                  </div>
                </YDCard>
                
                <h3 className="text-lg font-medium mb-4">Progress by Module</h3>
                
                <div className="space-y-4">
                  {modulesProgress.map((module) => (
                    <YDCard key={module.id}>
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">{module.name}</h4>
                          <div className="flex items-center text-sm">
                            {module.last_activity && (
                              <div className="flex items-center text-muted-foreground mr-4">
                                <Clock size={14} className="mr-1" />
                                <span>Last activity: {new Date(module.last_activity).toLocaleDateString()}</span>
                              </div>
                            )}
                            <span className={module.percentage === 100 ? 'text-green-600 flex items-center' : ''}>
                              {module.percentage === 100 && <CheckCircle2 size={14} className="mr-1" />}
                              {module.completed_lessons}/{module.total_lessons} lessons completed
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="w-full bg-muted rounded-full h-3">
                              <div 
                                className={`rounded-full h-3 ${
                                  module.percentage === 100 ? 'bg-green-600' : 'bg-primary'
                                }`}
                                style={{ width: `${module.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="ml-4 font-medium">{module.percentage}%</span>
                        </div>
                      </div>
                    </YDCard>
                  ))}
                  
                  {modulesProgress.length === 0 && (
                    <YDCard>
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No progress data available yet.</p>
                      </div>
                    </YDCard>
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

export default Progress;
