// yellow-diamond-learn-main/src/pages/Progress.tsx
import { useEffect, useState, useContext } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { BookOpen, BarChart3, PieChart, LucideIcon, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { toast } from "@/hooks/use-toast";
import { LanguageContext } from "@/contexts/LanguageContext";
import YDButton from "@/components/ui/YDButton";
import { useProfile } from "@/hooks/useProfile";

type ModuleProgress = {
  id: string;
  name: string;
  order: number;
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  quiz_score: number | null;
  last_activity: string | null;
  hasCertificate: boolean;
};

interface QuizResult {
  quiz_id: string;
  score: number;
}

// Custom Tooltip Component for Chart
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-2 bg-background border rounded shadow-lg text-sm">
                <p className="font-bold">{data.fullName}</p>
                <p className="text-green-600">{`Score: ${payload[0].value}%`}</p>
            </div>
        );
    }
    return null;
};

const ProgressPage = () => {
  const [modulesProgress, setModulesProgress] = useState<ModuleProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { currentLanguage } = useContext(LanguageContext)!;
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

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
      pleaseRefresh: "Please try refreshing the page",
      getCertificate: "Get Certificate",
      certificateClaimed: "Certificate Claimed",
      moduleComplete: "Module Complete!"
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
      pleaseRefresh: "कृपया पृष्ठ को ताज़ा करने का प्रयास करें",
      getCertificate: "प्रमाणपत्र प्राप्त करें",
      certificateClaimed: "प्रमाणपत्र का दावा किया गया",
      moduleComplete: "मॉड्यूल पूरा हुआ!"
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
      pleaseRefresh: "ದಯವಿಟ್ಟು ಪುಟವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ",
      getCertificate: "ಪ್ರಮಾಣಪತ್ರ ಪಡೆಯಿರಿ",
      certificateClaimed: "ಪ್ರಮಾಣಪತ್ರವನ್ನು ಕ್ಲೈಮ್ ಮಾಡಲಾಗಿದೆ",
      moduleComplete: "ಮಾಡ್ಯೂಲ್ ಪೂರ್ಣಗೊಂಡಿದೆ!"
    }
  };

  // Get current language translations
  const t = translations[currentLanguage] || translations.english;
  
  const handleGetCertificate = async (moduleId: string) => {
    if (!user) return;
    setIsClaiming(moduleId);
    try {
        const { error } = await supabase
            .from('modules_completed')
            .insert({
                user_id: user.id,
                module_id: moduleId
            });

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                toast({
                    title: "Certificate Exists!",
                    description: "You have already claimed this certificate."
                });
            } else {
                throw error;
            }
        } else {
            toast({
                title: "Certificate Ready!",
                description: "Your certificate is now available on the Certificates page."
            });
        }

        // Update local state to reflect the change
        setModulesProgress(prev =>
            prev.map(mod =>
                mod.id === moduleId ? { ...mod, hasCertificate: true } : mod
            )
        );

    } catch (error) {
        console.error("Error claiming certificate:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not claim certificate. Please try again."
        });
    } finally {
        setIsClaiming(null);
    }
  };

  useEffect(() => {
    const fetchProgress = async () => {
        if (!user || !profile || isProfileLoading) {
            setIsLoading(false);
            setModulesProgress([]);
            setOverallProgress(0);
            return;
        }

        try {
            setIsLoading(true);

            // Fetch modules and their lessons for the current language
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('id, name, order, description, lessons(id, quizzes(id))')
                .eq('language', currentLanguage)
                .order('order');

            if (modulesError) throw modulesError;
            if (!modulesData || modulesData.length === 0) {
                setModulesProgress([]);
                setOverallProgress(0);
                setIsLoading(false);
                return;
            }
            
            let filteredModules = modulesData;

            if (profile.role !== 'admin') {
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

                    const { data: moduleRegions, error: regError } = await supabase.from('module_region').select('module_id, region').in('module_id', moduleIds);
                    if (regError) throw regError;
                    const regionsMap = new Map<string, string[]>();
                    for (const mr of moduleRegions) {
                        if (!regionsMap.has(mr.module_id)) regionsMap.set(mr.module_id, []);
                        regionsMap.get(mr.module_id)!.push(mr.region);
                    }

                    const userDesignation = profile.designation;
                    const userRegion = profile.region;

                    filteredModules = modulesData.filter(module => {
                        const designations = designationsMap.get(module.id) || [];
                        const regions = regionsMap.get(module.id) || [];
                        const isDesignationRestricted = designations.length > 0;
                        const isRegionRestricted = regions.length > 0;

                        if (!isDesignationRestricted && !isRegionRestricted) {
                            return false; 
                        }

                        const userMatchesDesignation = !isDesignationRestricted || (!!userDesignation && designations.includes(userDesignation));
                        const userMatchesRegion = !isRegionRestricted || (!!userRegion && regions.includes(userRegion));

                        return userMatchesDesignation && userMatchesRegion;
                    });
                }
            }

            if (filteredModules.length === 0) {
              setModulesProgress([]);
              setOverallProgress(0);
              setIsLoading(false);
              return;
            }

            // Fetch all of the user's completed lessons at once
            const { data: progressData, error: progressError } = await supabase
                .from('user_progress')
                .select('lesson_id, completed_at')
                .eq('user_id', user.id)
                .eq('status', 'completed');
            
            if (progressError) throw progressError;
            const completedLessonIds = new Set(progressData.map(p => p.lesson_id));

            // Fetch all claimed certificates at once
            const { data: completedModulesData, error: completedModulesError } = await supabase
                .from('modules_completed')
                .select('module_id')
                .eq('user_id', user.id);

            if (completedModulesError) throw completedModulesError;
            const completedModuleIds = new Set(completedModulesData.map(c => c.module_id));

            // Aggregate all quiz IDs from all modules to fetch scores in one call
            const allQuizIds = filteredModules.flatMap(module =>
                module.lessons.flatMap(lesson =>
                    lesson.quizzes.map(quiz => quiz.id)
                )
            );

            let quizScoresByQuizId = new Map<string, number>();
            if (allQuizIds.length > 0) {
                const { data: resultsData, error: resultsError } = await supabase
                    .from('quiz_results')
                    .select('quiz_id, score, created_at')
                    .eq('user_id', user.id)
                    .in('quiz_id', allQuizIds)
                    .order('created_at', { ascending: false });

                if (resultsError) {
                    console.error("Error fetching quiz results directly:", resultsError);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load quiz scores.' });
                } else if (resultsData) {
                    // Process results to get only the latest score for each quiz
                    resultsData.forEach(result => {
                        if (!quizScoresByQuizId.has(result.quiz_id)) {
                            quizScoresByQuizId.set(result.quiz_id, result.score);
                        }
                    });
                }
            }
            
            // Now, process each module with all data already fetched
            const moduleProgressResults = filteredModules.map((module) => {
                const totalLessons = module.lessons.length;
                const completedLessons = module.lessons.filter(l => completedLessonIds.has(l.id)).length;
                const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                
                const quizIdsInModule = module.lessons.flatMap(l => l.quizzes.map(q => q.id));
                const scoresInModule = quizIdsInModule
                    .map(quizId => quizScoresByQuizId.get(quizId))
                    .filter((score): score is number => score !== undefined);
                
                let quizScore = null;
                if (scoresInModule.length > 0) {
                    const totalScore = scoresInModule.reduce((sum, score) => sum + score, 0);
                    quizScore = Math.round(totalScore / scoresInModule.length);
                }

                return {
                    id: module.id,
                    name: module.name,
                    order: module.order,
                    total_lessons: totalLessons,
                    completed_lessons: completedLessons,
                    percentage,
                    quiz_score: quizScore,
                    last_activity: null, // This part can be re-added if needed
                    hasCertificate: completedModuleIds.has(module.id),
                };
            });

            setModulesProgress(moduleProgressResults);
            
            const totalLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.total_lessons, 0);
            const completedLessonsAll = moduleProgressResults.reduce((sum, module) => sum + module.completed_lessons, 0);
            const overallPercentage = totalLessonsAll > 0 ? Math.round((completedLessonsAll * 100/ totalLessonsAll) ) : 0;
            
            setOverallProgress(overallPercentage);

        } catch (error) {
            console.error('Error fetching progress:', error);
            toast({
                variant: "destructive",
                title: t.errorLoadingProgress,
                description: t.pleaseRefresh
            });
            setModulesProgress([]);
            setOverallProgress(0);
        } finally {
            setIsLoading(false);
        }
    };

    fetchProgress();
}, [user, profile, isProfileLoading, currentLanguage]);


  const quizChartData = modulesProgress
    .filter(module => module.quiz_score !== null)
    .map(module => ({
      label: `M${module.order}`,
      fullName: module.name,
      value: module.quiz_score || 0,
      fill: '#10B981'
    }));

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:col-span-2 gap-4 mb-8">
                  <YDCard className="overflow-hidden col-span-1">
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
                  
                  <YDCard>
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <PieChart className="h-5 w-5 mr-2 text-green-500" />
                          <h3 className="font-medium">{t.quizPerformanceByModule}</h3>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={quizChartData}
                              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tick={{ fontSize: 10 }}/>
                              <YAxis domain={[0, 100]} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" fill="#10B981" barSize={30} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                  </YDCard>
                </div>
                
                <h3 className="text-xl font-semibold mb-4">{t.moduleCompletionProgress}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulesProgress.length > 0 ? modulesProgress.map((module) => (
                    <YDCard key={module.id} className="overflow-hidden flex flex-col">
                      <div className="p-4 flex flex-col h-full">
                          <h3 className="font-medium text-base mb-4 flex-grow">{module.name}</h3>
                          
                          {module.percentage === 100 ? (
                               <div className="mt-auto text-center">
                                   <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                                   <p className="font-semibold text-green-600 mb-4">{t.moduleComplete}</p>
                                   <YDButton
                                       onClick={() => handleGetCertificate(module.id)}
                                       disabled={module.hasCertificate || !!isClaiming}
                                       className="w-full"
                                   >
                                       {isClaiming === module.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                       {module.hasCertificate ? t.certificateClaimed : t.getCertificate}
                                   </YDButton>
                               </div>
                           ) : (
                              <div className="mt-auto">
                                  <div className="flex items-center justify-between mb-2">
                                      <div className="text-2xl font-bold">{module.percentage}%</div>
                                  </div>
                                  <Progress value={module.percentage} className="h-2 mb-2" />
                                  <div className="text-xs text-muted-foreground">
                                      {module.completed_lessons} of {module.total_lessons} {t.lessonsCompleted}
                                  </div>
                                  {module.quiz_score !== null && (
                                      <div className="text-xs text-muted-foreground mt-1">{t.quizScore}: {module.quiz_score}%</div>
                                  )}
                              </div>
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressPage;