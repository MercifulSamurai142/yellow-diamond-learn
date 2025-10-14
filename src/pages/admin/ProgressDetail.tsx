import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables, Json } from '@/integrations/supabase/types'; // Import Json type
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { YDCard, YDCardContent, YDCardHeader, YDCardTitle } from '@/components/ui/YDCard';
import { Progress } from '@/components/ui/progress';
import { Loader2, User, ArrowLeft, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types from Supabase
type UserProfile = Tables<'users'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Quiz = Tables<'quizzes'>;
type QuizResult = Tables<'quiz_results'>;
type Question = Tables<'questions'>;
type Answer = Tables<'answers'>;

// Define a more specific type for the structure we expect within answers_json
interface SubmittedUserAnswer {
  questionId: string;
  answerId: string;
}

// Enhanced ModuleDetails for the first tab
interface UserLanguageModuleDetails extends Module {
  lessons: (Lesson & {
    is_completed: boolean;
    quiz: (Quiz & {
        attempt?: QuizResult | null;
    }) | null;
  })[];
  progress: number;
}

// Detailed structure for the Quiz tab
interface UserQuizAttemptDetail {
  quizResult: QuizResult;
  moduleName: string | null;
  lessonName: string | null;
  quizTitle: string;
  questionDetails: {
    questionText: string;
    userAnswerText: string | null;
    correctAnswerText: string | null;
    isCorrect: boolean;
  }[];
}

const ProgressDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLanguageModulesProgress, setUserLanguageModulesProgress] = useState<UserLanguageModuleDetails[]>([]);
  const [userQuizAttempts, setUserQuizAttempts] = useState<UserQuizAttemptDetail[]>([]);
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
        // 1. Fetch user profile first to get their language and role
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
        if (userError) throw userError;
        setUserProfile(userData);

        const preferredLanguage = userData.language || 'english'; // Default if not set
        
        // 2. Fetch all necessary data in parallel
        const [
            { data: allModulesData, error: modulesError },
            { data: allDesignationsData, error: designationsError },
            { data: allRegionsData, error: regionsError },
            { data: allLessonsData, error: lessonsError },
            { data: allUserProgressData, error: progressError },
            { data: allQuizzesData, error: quizzesError },
            { data: allQuestionsData, error: questionsError },
            { data: allAnswersData, error: answersError },
            { data: allQuizResultsData, error: quizResultsError }
        ] = await Promise.all([
            supabase.from('modules').select('*'),
            supabase.from('module_designation').select('*'),
            supabase.from('module_region').select('*'),
            supabase.from('lessons').select('*'),
            supabase.from('user_progress').select('lesson_id, completed_at').eq('user_id', userId).eq('status', 'completed'),
            supabase.from('quizzes').select('*'),
            supabase.from('questions').select('*'),
            supabase.from('answers').select('*'),
            supabase.from('quiz_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }) // Latest attempt first
        ]);
        
        if(modulesError) throw modulesError;
        if(designationsError) throw designationsError;
        if(regionsError) throw regionsError;
        if(lessonsError) throw lessonsError;
        if(progressError) throw progressError;
        if(quizzesError) throw quizzesError;
        if(questionsError) throw questionsError;
        if(answersError) throw answersError;
        if(quizResultsError) throw quizResultsError;
        
        // --- Create Lookup Maps ---
        const modulesMap = new Map<string, Module>(allModulesData!.map(m => [m.id, m]));
        const lessonsMap = new Map<string, Lesson>(allLessonsData!.map(l => [l.id, l]));
        const quizzesMap = new Map<string, Quiz>(allQuizzesData!.map(q => [q.id, q]));
        const questionsMap = new Map<string, Question>(allQuestionsData!.map(q => [q.id, q]));
        const answersMap = new Map<string, Answer[]>();
        allAnswersData!.forEach(ans => {
            if (ans.question_id) {
                if (!answersMap.has(ans.question_id)) answersMap.set(ans.question_id, []);
                answersMap.get(ans.question_id)!.push(ans);
            }
        });
        const completedLessonIds = new Set(allUserProgressData!.map(p => p.lesson_id));

        // --- Process for User's Preferred Language Tab ---
        const designationsLookup = new Map<string, string[]>();
        allDesignationsData!.forEach(md => {
            if (!designationsLookup.has(md.module_id)) designationsLookup.set(md.module_id, []);
            designationsLookup.get(md.module_id)!.push(md.designation);
        });
        
        const regionsLookup = new Map<string, string[]>();
        allRegionsData!.forEach(mr => {
            if (!regionsLookup.has(mr.module_id)) regionsLookup.set(mr.module_id, []);
            regionsLookup.get(mr.module_id)!.push(mr.region);
        });
        
        const preferredLanguageModules = allModulesData!.filter(module => {
            if (module.language !== preferredLanguage) return false;
            if (userData.role === 'admin') return true;

            const designations = designationsLookup.get(module.id) || [];
            const regions = regionsLookup.get(module.id) || [];
            const isDesignationRestricted = designations.length > 0;
            const isRegionRestricted = regions.length > 0;

            if (!isDesignationRestricted && !isRegionRestricted && userData.role !== 'admin') {
                return false;
            }

            const userMatchesDesignation = !isDesignationRestricted || (!!userData.designation && designations.includes(userData.designation));
            const userMatchesRegion = !isRegionRestricted || (!!userData.region && regions.includes(userData.region));

            return userMatchesDesignation && userMatchesRegion;
        });
        
        const languageTabModulesDetails = preferredLanguageModules.map(module => {
            const lessonsInModule = (allLessonsData || []).filter(l => l.module_id === module.id && l.language === preferredLanguage);
            const lessonsWithStatus = lessonsInModule.map(lesson => {
                const quizForLesson = allQuizzesData!.find(q => q.lesson_id === lesson.id) || null;
                const latestAttempt = quizForLesson ? allQuizResultsData!.find(r => r.quiz_id === quizForLesson.id) || null : null;
                return {
                    ...lesson,
                    is_completed: completedLessonIds.has(lesson.id),
                    quiz: quizForLesson ? { ...quizForLesson, attempt: latestAttempt } : null
                };
            });
            const completedLessonsCount = lessonsWithStatus.filter(l => l.is_completed).length;
            const progress = lessonsInModule.length > 0 ? Math.round((completedLessonsCount / lessonsInModule.length) * 100) : 0;
            
            return { ...module, lessons: lessonsWithStatus, progress };
        });
        setUserLanguageModulesProgress(languageTabModulesDetails);


        // --- Process for Quiz Attempts Tab ---
        const quizAttemptsDetails: UserQuizAttemptDetail[] = allQuizResultsData!.map(result => {
            const quiz = quizzesMap.get(result.quiz_id);
            const lesson = quiz && lessonsMap.get(quiz.lesson_id!);
            const module = lesson && modulesMap.get(lesson.module_id!);

            let userSubmittedAnswers: SubmittedUserAnswer[] = [];
            // Safely parse answers_json and ensure it's an array of SubmittedUserAnswer
            if (result.answers_json && typeof result.answers_json === 'object' && 'userAnswers' in (result.answers_json as any)) {
                const rawUserAnswers = (result.answers_json as any).userAnswers;
                if (Array.isArray(rawUserAnswers)) {
                    userSubmittedAnswers = rawUserAnswers.filter((item: any): item is SubmittedUserAnswer => 
                        typeof item === 'object' && item !== null && 'questionId' in item && 'answerId' in item
                    );
                }
            }

            const questionsForQuiz = allQuestionsData!.filter(q => q.quiz_id === result.quiz_id).sort((a,b) => a.order - b.order);
            const questionDetails = questionsForQuiz.map(question => {
                const allAnswersForQuestion = answersMap.get(question.id) || [];
                const correctAnswer = allAnswersForQuestion.find(a => a.is_correct);
                
                let userAnswerText: string | null = null;
                let isCorrect = false;

                const submittedAnswer = userSubmittedAnswers.find(ua => ua.questionId === question.id);
                if (submittedAnswer) {
                    const foundUserAnswer = allAnswersForQuestion.find(a => a.id === submittedAnswer.answerId);
                    userAnswerText = foundUserAnswer?.answer_text || null;
                    isCorrect = (correctAnswer && submittedAnswer.answerId === correctAnswer.id) || false;
                }
                
                return {
                    questionText: question.question_text,
                    userAnswerText,
                    correctAnswerText: correctAnswer?.answer_text || 'N/A',
                    isCorrect,
                };
            });

            return {
                quizResult: result,
                moduleName: module?.name || 'Unknown Module',
                lessonName: lesson?.title || 'Unknown Lesson',
                quizTitle: quiz?.title || 'Unknown Quiz',
                questionDetails,
            };
        });
        setUserQuizAttempts(quizAttemptsDetails);

      } catch (error: any) {
        toast({ variant: "destructive", title: "Error fetching user details", description: error.message });
        setUserProfile(null);
        setUserLanguageModulesProgress([]);
        setUserQuizAttempts([]);
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

  if (!userProfile) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full flex-col">
              <h2 className="text-xl font-semibold mb-4 text-destructive">User Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested user profile could not be loaded.</p>
              <Link to="/admin/progress-report" className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to Progress Report
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const preferredLanguageName = userProfile.language ? 
                                userProfile.language.charAt(0).toUpperCase() + userProfile.language.slice(1) : 
                                'English';

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
                    <h2 className="yd-section-title">{userProfile.name || 'User Details'}</h2>
                    <p className="text-muted-foreground">{userProfile.email}</p>
                    <p className="text-sm text-muted-foreground">PSL-ID: {userProfile.psl_id || 'NULL'}</p>
                </div>
            </div>

            <Tabs defaultValue="languageProgress">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="languageProgress">{preferredLanguageName} Progress</TabsTrigger>
                    <TabsTrigger value="quizAttempts">Quiz Attempts</TabsTrigger>
                </TabsList>

                {/* Tab 1: User's Preferred Language Progress */}
                <TabsContent value="languageProgress">
                    {userLanguageModulesProgress.length === 0 ? (
                        <YDCard><p className="p-6 text-muted-foreground">No modules assigned for this user in {preferredLanguageName}.</p></YDCard>
                    ) : (
                    <div className="space-y-4">
                        {userLanguageModulesProgress.map(module => (
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

                {/* Tab 2: Quiz Attempts */}
                <TabsContent value="quizAttempts">
                    {userQuizAttempts.length === 0 ? (
                        <YDCard><p className="p-6 text-muted-foreground">No quiz attempts recorded for this user.</p></YDCard>
                    ) : (
                        <div className="space-y-4">
                            {userQuizAttempts.map((attempt, index) => (
                                <YDCard key={attempt.quizResult.id + '-' + index} className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-lg font-medium">{attempt.quizTitle}</h4>
                                            <p className="text-sm text-muted-foreground">Module: {attempt.moduleName} / Lesson: {attempt.lessonName}</p>
                                            <p className="text-sm">Score: <span className={`font-semibold ${attempt.quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>{attempt.quizResult.score}%</span></p>
                                            <p className="text-xs text-muted-foreground">Attempted on: {new Date(attempt.quizResult.created_at!).toLocaleDateString()} {new Date(attempt.quizResult.created_at!).toLocaleTimeString()}</p>
                                        </div>
                                        <div className={`text-sm font-semibold px-2 py-1 rounded-full ${attempt.quizResult.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {attempt.quizResult.passed ? 'Passed' : 'Failed'}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 border-t pt-4">
                                        <h5 className="font-semibold text-sm mb-3">Questions & Answers</h5>
                                        <div className="space-y-4">
                                            {attempt.questionDetails.length > 0 ? (
                                                attempt.questionDetails.map((qDetail, qIndex) => (
                                                    <div key={qIndex} className="p-3 border rounded-md bg-white">
                                                        <p className="font-medium text-sm mb-2">{qIndex + 1}. {qDetail.questionText}</p>
                                                        <div className="ml-4 space-y-1 text-sm">
                                                            <div className="flex items-center">
                                                                <span className="font-semibold w-24 flex-shrink-0">Your Answer:</span>
                                                                <span className={`${qDetail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {qDetail.userAnswerText || 'Not provided'}
                                                                </span>
                                                                {qDetail.isCorrect ? <CheckCircle className="h-4 w-4 text-green-600 ml-2"/> : <XCircle className="h-4 w-4 text-red-600 ml-2"/>}
                                                            </div>
                                                            {!qDetail.isCorrect && (
                                                                <div className="flex items-center text-green-600">
                                                                    <span className="font-semibold w-24 flex-shrink-0">Correct Answer:</span>
                                                                    <span>{qDetail.correctAnswerText || 'N/A'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No question details available for this quiz.</p>
                                            )}
                                        </div>
                                    </div>
                                </YDCard>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressDetail;