import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { YDCard, YDCardContent, YDCardHeader, YDCardTitle } from '@/components/ui/YDCard';
import { Progress } from '@/components/ui/progress';
import { Loader2, User, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
type User = Tables<'users'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Quiz = Tables<'quizzes'>;
type QuizResult = Tables<'quiz_results'>;

interface ModuleDetails extends Module {
  lessons: (Lesson & {
    is_completed: boolean;
    quiz: (Quiz & {
        attempt?: QuizResult
    }) | null;
  })[];
  progress: number;
}

const ProgressDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [progressByLanguage, setProgressByLanguage] = useState<{ [key: string]: ModuleDetails[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Error", description: "User ID is missing." });
        return;
    }
    
    const fetchUserProgress = async () => {
      setIsLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
        if (userError) throw userError;
        setUser(userData);

        const languages = ['english', 'hindi', 'kannada'];
        const allProgressData: { [key: string]: ModuleDetails[] } = {};
        
        // Fetch all data needed across languages first
        const [
            { data: allModules, error: modulesError },
            { data: designationsData, error: designationsError },
            { data: regionsData, error: regionsError },
            { data: allUserProgress, error: progressError },
            { data: quizResults, error: quizError }
        ] = await Promise.all([
            supabase.from('modules').select('*, lessons(*, quizzes(*))').order('order'),
            supabase.from('module_designation').select('*'),
            supabase.from('module_region').select('*'),
            supabase.from('user_progress').select('lesson_id').eq('user_id', userId).eq('status', 'completed'),
            supabase.from('quiz_results').select('*').eq('user_id', userId)
        ]);
        
        if(modulesError) throw modulesError;
        if(designationsError) throw designationsError;
        if(regionsError) throw regionsError;
        if(progressError) throw progressError;
        if(quizError) throw quizError;
        
        // --- Pre-process data for efficient lookup ---
        const designationsMap = new Map<string, string[]>();
        designationsData!.forEach(md => {
            if (!designationsMap.has(md.module_id)) designationsMap.set(md.module_id, []);
            designationsMap.get(md.module_id)!.push(md.designation);
        });
        
        const regionsMap = new Map<string, string[]>();
        regionsData!.forEach(mr => {
            if (!regionsMap.has(mr.module_id)) regionsMap.set(mr.module_id, []);
            regionsMap.get(mr.module_id)!.push(mr.region);
        });
        
        const completedLessonIds = new Set(allUserProgress!.map(p => p.lesson_id));

        let quizAttemptsMap = new Map<string, QuizResult>();
        quizResults!.forEach(r => {
            if(!quizAttemptsMap.has(r.quiz_id) || new Date(r.created_at!) > new Date(quizAttemptsMap.get(r.quiz_id)!.created_at!)) {
                quizAttemptsMap.set(r.quiz_id, r);
            }
        });
        
        // Process for each language
        for (const lang of languages) {
            // 1. Filter modules for the user's profile and current language
            const availableModules = allModules!.filter(module => {
                if (module.language !== lang) return false;
                if (userData.role === 'admin') return true;

                const designations = designationsMap.get(module.id) || [];
                const regions = regionsMap.get(module.id) || [];
                const isDesignationRestricted = designations.length > 0;
                const isRegionRestricted = regions.length > 0;

                if (!isDesignationRestricted && !isRegionRestricted) return false;

                const userMatchesDesignation = !isDesignationRestricted || (!!userData.designation && designations.includes(userData.designation));
                const userMatchesRegion = !isRegionRestricted || (!!userData.region && regions.includes(userData.region));

                return userMatchesDesignation && userMatchesRegion;
            });
            
            // 2. Calculate details for these available modules
            const modulesDetails = availableModules.map(module => {
                const lessonsWithStatus = module.lessons.map(lesson => {
                    const quiz = lesson.quizzes[0] || null;
                    return {
                        ...lesson,
                        is_completed: completedLessonIds.has(lesson.id),
                        quiz: quiz ? { ...quiz, attempt: quizAttemptsMap.get(quiz.id) } : null
                    };
                });
                const completedLessonsCount = lessonsWithStatus.filter(l => l.is_completed).length;
                const progress = module.lessons.length > 0 ? Math.round((completedLessonsCount / module.lessons.length) * 100) : 0;
                
                return { ...module, lessons: lessonsWithStatus, progress };
            });
            allProgressData[lang] = modulesDetails;
        }

        setProgressByLanguage(allProgressData);

      } catch (error: any) {
        toast({ variant: "destructive", title: "Error fetching user details", description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <Link to="/admin/progress-report" className="text-primary hover:underline flex items-center mb-4 text-sm">
                <ArrowLeft size={16} className="mr-1" />
                Back to Progress Report
            </Link>

            <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <User size={32} />
                </div>
                <div>
                    <h2 className="yd-section-title">{user?.name || 'User Details'}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">PSL-ID: {user?.psl_id || 'NULL'}</p>
                </div>
            </div>

            <Tabs defaultValue="english">
                <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="english">English</TabsTrigger>
                    <TabsTrigger value="hindi">Hindi</TabsTrigger>
                    <TabsTrigger value="kannada">Kannada</TabsTrigger>
                </TabsList>

                {Object.entries(progressByLanguage).map(([lang, modules]) => (
                    <TabsContent key={lang} value={lang}>
                        {modules.length === 0 ? (
                            <YDCard><p className="p-6 text-muted-foreground">No modules assigned for this user in {lang}.</p></YDCard>
                        ) : (
                        <div className="space-y-4">
                            {modules.map(module => (
                                <YDCard key={module.id}>
                                    <YDCardHeader>
                                        <div className="flex justify-between items-center">
                                            <YDCardTitle>{module.name}</YDCardTitle>
                                            <span className="font-semibold">{module.progress}%</span>
                                        </div>
                                        <Progress value={module.progress} className="h-2" />
                                    </YDCardHeader>
                                    <YDCardContent>
                                        <h4 className="text-sm font-semibold mb-2 mt-2">Lessons</h4>
                                        {module.lessons.length > 0 ? (
                                        <ul className="space-y-2">
                                            {module.lessons.map(lesson => (
                                                <li key={lesson.id} className="p-2 border-b last:border-b-0">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center">
                                                            {lesson.is_completed ? <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"/> : <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0"/> }
                                                            <span>{lesson.title}</span>
                                                        </div>
                                                        {lesson.quiz && (
                                                          <span className={`text-xs px-2 py-1 rounded-full ${lesson.quiz.attempt ? (lesson.quiz.attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') : 'bg-gray-100'}`}>
                                                              Quiz: {lesson.quiz.attempt ? `${lesson.quiz.attempt.score}%` : 'Not Taken'}
                                                          </span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No lessons in this module.</p>
                                        )}
                                    </YDCardContent>
                                </YDCard>
                            ))}
                        </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressDetail;