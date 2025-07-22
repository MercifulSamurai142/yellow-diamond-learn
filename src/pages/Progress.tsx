// yellow-diamond-learn-main/src/pages/Progress.tsx
import { useEffect, useState, useContext } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { BookOpen, BarChart3, PieChart, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "@/hooks/use-toast";
import { LanguageContext } from "@/contexts/LanguageContext";

type ModuleProgress = {
  id: string;
  name: string;
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  quiz_score: number | null;
  last_activity: string | null;
};

interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  created_at: string;
}

const ProgressPage = () => {
  const [modulesProgress, setModulesProgress] = useState<ModuleProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { currentLanguage } = useContext(LanguageContext)!;

  // Translation object structure
  const translations = {
    english: {
      yourLearningProgress: "Your Learning Progress",
      trackPerformance: "Track your performance across all modules and lessons",
      overallCourseProgress: "Overall Course Progress",
      modulesCompletedIn: "modules completed in",
      moduleCompletionProgress: "Module Completion Progress",
      quizPerformanceByModule: "Quiz Performance by Module",
      lessonsCompleted: "lessons completed",
      quizScore: "Quiz score",
      noModulesAvailable: "No modules available for the selected language.",
      errorLoadingProgress: "Error loading progress data",
      pleaseRefresh: "Please try refreshing the page"
    },
    hindi: {
      yourLearningProgress: "आपकी सीखने की प्रगति",
      trackPerformance: "सभी मॉड्यूल और पाठों में अपने प्रदर्शन को ट्रैक करें",
      overallCourseProgress: "समग्र पाठ्यक्रम प्रगति",
      modulesCompletedIn: "मॉड्यूल पूरे किए गए",
      moduleCompletionProgress: "मॉड्यूल पूर्णता प्रगति",
      quizPerformanceByModule: "मॉड्यूल द्वारा क्विज प्रदर्शन",
      lessonsCompleted: "पाठ पूरे किए गए",
      quizScore: "क्विज स्कोर",
      noModulesAvailable: "चयनित भाषा के लिए कोई मॉड्यूल उपलब्ध नहीं है।",
      errorLoadingProgress: "प्रगति डेटा लोड करने में त्रुटि",
      pleaseRefresh: "कृपया पृष्ठ को ताज़ा करने का प्रयास करें"
    },
    kannada: {
      yourLearningProgress: "ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಗತಿ",
      trackPerformance: "ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳು ಮತ್ತು ಪಾಠಗಳಾದ್ಯಂತ ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
      overallCourseProgress: "ಒಟ್ಟಾರೆ ಕೋರ್ಸ್ ಪ್ರಗತಿ",
      modulesCompletedIn: "ಮಾಡ್ಯೂಲ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ",
      moduleCompletionProgress: "ಮಾಡ್ಯೂಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಗತಿ",
      quizPerformanceByModule: "ಮಾಡ್ಯೂಲ್ ಮೂಲಕ ರಸಪ್ರಶ್ನೆ ಕಾರ್ಯಕ್ಷಮತೆ",
      lessonsCompleted: "ಪಾಠಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ",
      quizScore: "ರಸಪ್ರಶ್ನೆ ಅಂಕ",
      noModulesAvailable: "ಆಯ್ಕೆಮಾಡಿದ ಭಾಷೆಗಾಗಿ ಯಾವುದೇ ಮಾಡ್ಯೂಲ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ.",
      errorLoadingProgress: "ಪ್ರಗತಿ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ದೋಷ",
      pleaseRefresh: "ದಯವಿಟ್ಟು ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ"
    }
  };

  // Get current language translations
  const t = translations[currentLanguage] || translations.english;

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setIsLoading(false);
        setModulesProgress([]);
        setOverallProgress(0);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, name, order, description')
          .eq('language', currentLanguage)
          .order('order');

        if (modulesError) throw modulesError;
        
        const validModulesData = modulesData || [];

        if (validModulesData.length === 0) {
            setModulesProgress([]);
            setOverallProgress(0);
            setIsLoading(false);
            return;
        }

        const moduleProgressPromises = validModulesData.map(async (module) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', module.id)
            .eq('language', currentLanguage);
            
          if (lessonsError) throw lessonsError;
          
          const totalLessons = lessonsData ? lessonsData.length : 0;
          const lessonIds = lessonsData ? lessonsData.map(l => l.id) : [];
          
          let completedLessons = 0;
          let lastActivity = null;
          
          if (lessonIds.length > 0) {
            const { data: progressData, error: progressError } = await supabase
              .from('user_progress')
              .select('lesson_id, status, completed_at')
              .eq('user_id', user.id)
              .in('lesson_id', lessonIds)
              .eq('status', 'completed');
              
            if (progressError) throw progressError;
            
            completedLessons = progressData ? progressData.length : 0;
            
            if (progressData && progressData.length > 0) {
              progressData.sort((a, b) => {
                if (!a.completed_at) return 1;
                if (!b.completed_at) return -1;
                return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
              });
              lastActivity = progressData[0].completed_at;
            }
          }
          
          const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          let quizScore = null;
          const { data: lessonsWithQuizzes, error: lessonsWithQuizzesError } = await supabase
            .from('lessons')
            .select('id, quizzes(id)')
            .eq('module_id', module.id)
            .eq('language', currentLanguage)
            .not('quizzes', 'is', null);

          if (!lessonsWithQuizzesError && lessonsWithQuizzes && lessonsWithQuizzes.length > 0) {
            const quizIds = lessonsWithQuizzes
              .filter(l => l.quizzes && Array.isArray(l.quizzes) && l.quizzes.length > 0)
              .map(l => (Array.isArray(l.quizzes) ? l.quizzes[0].id : null))
              .filter(Boolean) as string[];
            
            if (quizIds.length > 0) {
              try {
                const { data: rpcData, error: rpcError } = await supabase.functions.invoke('get-quiz-results', {
                  body: JSON.stringify({
                    userId: user.id,
                    quizIds: quizIds
                  })
                });
                
                if (rpcError) {
                  console.error("Error fetching quiz results via RPC:", rpcError);
                  toast({ variant: 'destructive', title: 'Error', description: `Failed to load quiz scores: ${rpcError.message}` });
                } else if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
                  const totalScore = rpcData.reduce((sum, result) => sum + (result.score || 0), 0);
                  quizScore = Math.round(totalScore / rpcData.length);
                }
              } catch (error) {
                console.error("Error processing quiz results:", error);
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to process quiz results.' });
              }
            }
          }
          
          return {
            id: module.id,
            name: module.name,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            percentage,
            quiz_score: quizScore,
            last_activity: lastActivity
          };
        });
        
        const moduleProgressResults = await Promise.all(moduleProgressPromises);
        setModulesProgress(moduleProgressResults);
        
        const totalLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.total_lessons, 0);
        const completedLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.completed_lessons, 0);
        const overallPercentage = totalLessonsAll > 0 ? Math.round((completedLessonsAll / totalLessonsAll) * 100) : 0;
        
        setOverallProgress(overallPercentage);
      } catch (error) {
        console.error('Error fetching progress:', error);
        toast({
          variant: "destructive",
          title: t.errorLoadingProgress, // Translated
          description: t.pleaseRefresh // Translated
        });
        setModulesProgress([]);
        setOverallProgress(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user, currentLanguage]); // Removed 't' from dependencies

  const completionChartData = modulesProgress.map(module => ({
    name: module.name.replace(/\s+/g, '\n'),
    value: module.percentage,
    fill: '#5553FF'
  }));

  const quizChartData = modulesProgress
    .filter(module => module.quiz_score !== null)
    .map(module => ({
      name: module.name.replace(/\s+/g, '\n'),
      value: module.quiz_score || 0,
      fill: '#10B981'
    }));

  const moduleCards = modulesProgress.map(module => {
    let icon: LucideIcon;
    let iconColor: string;
    let progressColor: string;
    
    if (module.name.includes('FMCG') || module.name.includes('Fundamentals')) {
      icon = BookOpen;
      iconColor = 'text-blue-500';
      progressColor = 'bg-blue-500';
    } else if (module.name.includes('Finance') || module.name.includes('Sales')) {
      icon = BarChart3;
      iconColor = 'text-green-500';
      progressColor = 'bg-green-500';
    } else {
      icon = PieChart;
      iconColor = 'text-purple-500';
      progressColor = 'bg-purple-500';
    }

    return {
      title: module.name,
      percentage: module.percentage,
      quizScore: module.quiz_score,
      icon,
      iconColor,
      progressColor,
      lessonsCompleted: `${module.completed_lessons} ${t.lessonsCompleted} ${module.total_lessons} `
    };
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-yd-orange">{t.yourLearningProgress}</h2>
              <p className="text-muted-foreground">{t.trackPerformance}</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <YDCard className="overflow-hidden col-span-1 md:col-span-2 lg:col-span-2">
                    <div className="p-4">
                      <h3 className="font-medium text-base mb-2">{t.overallCourseProgress}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl font-bold">{overallProgress}%</div>
                        <div className="p-2 rounded-full text-primary bg-primary/10">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      </div>
                      <Progress value={overallProgress} className="h-3" />
                      <div className="text-sm text-muted-foreground mt-2">
                        {modulesProgress.filter(m => m.percentage === 100).length} {t.modulesCompletedIn} {modulesProgress.length} {currentLanguage}
                      </div>
                    </div>
                  </YDCard>

                  {modulesProgress.length > 0 ? moduleCards.map((card, index) => (
                    <YDCard key={index} className="overflow-hidden">
                      <div className="p-4">
                        <h3 className="font-medium text-base mb-2">{card.title}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-2xl font-bold">{card.percentage}%</div>
                          <div className={`p-2 rounded-full ${card.iconColor} bg-opacity-10`}>
                            <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                          </div>
                        </div>
                        <Progress value={card.percentage} className="h-2 mb-2" />
                        <div className="text-xs text-muted-foreground">
                          {card.lessonsCompleted}
                        </div>
                        {card.quizScore !== null && (
                          <div className="text-xs text-muted-foreground mt-1">{t.quizScore}: {card.quizScore}%</div>
                        )}
                      </div>
                    </YDCard>
                  )) : (
                     <div className="col-span-full">
                       <YDCard>
                         <div className="p-6 text-center text-muted-foreground">
                           {t.noModulesAvailable}
                         </div>
                       </YDCard>
                     </div>
                   )}
                </div>

                {modulesProgress.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
                    <YDCard>
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <PieChart className="h-5 w-5 mr-2 text-green-500" />
                          <h3 className="font-medium">{t.quizPerformanceByModule}</h3>
                        </div>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={quizChartData}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" domain={[0, 100]} />
                              <YAxis type="category" dataKey="name" />
                              <Tooltip />
                              <Bar dataKey="value" fill="#10B981" barSize={30} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </YDCard>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressPage;