// yellow-diamond-learn-dev/src/pages/admin/ProgressReport.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { YDCard } from '@/components/ui/YDCard';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Loader2, User, ChevronRight, Download } from 'lucide-react';
import YDButton from '@/components/ui/YDButton';
import * as XLSX from 'xlsx';

// Types
type User = Tables<'users'>;
type Lesson = Tables<'lessons'>; // Added for correct lesson filtering

type LanguageProgress = {
  percentage: number; // Lesson completion percentage
  completed: number; // Lessons completed
  total: number; // Total lessons available
  totalQuizzes: number; // Total quizzes available
  attemptedQuizzes: number; // Quizzes attempted
  averageScore: number | null; // Average quiz score for attempted quizzes
};

type UserOverallProgress = {
  user: User;
  progress: LanguageProgress; 
};

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

const ProgressReport = () => {
  const [userProgressList, setUserProgressList] = useState<UserOverallProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchAllProgressData = async () => {
      setIsLoading(true);
      try {
        // Fetch all necessary data in parallel
        const [
          { data: usersData, error: usersError },
          { data: modulesData, error: modulesError },
          { data: designationsData, error: designationsError },
          { data: regionsData, error: regionsError },
          { data: lessonsData, error: lessonsError }, // This fetch needs all fields for type Lesson
          { data: progressData, error: progressError },
          { data: quizzesData, error: quizzesError },
          { data: quizResultsData, error: quizResultsError },
        ] = await Promise.all([
          supabase.from('users').select('*').order('name'),
          supabase.from('modules').select('id, language'),
          supabase.from('module_designation').select('*'),
          supabase.from('module_region').select('*'),
          // FIX: Select all fields for the lessons to match the Lesson type
          supabase.from('lessons').select('id, module_id, language, content, created_at, duration_minutes, order, title, updated_at, video_url'), 
          supabase.from('user_progress').select('user_id, lesson_id').eq('status', 'completed'),
          supabase.from('quizzes').select('id, lesson_id'),
          supabase.from('quiz_results').select('user_id, quiz_id, score, created_at').order('created_at', { ascending: false }),
        ]);

        if (usersError) throw usersError;
        if (modulesError) throw modulesError;
        if (designationsError) throw designationsError;
        if (regionsError) throw regionsError;
        if (lessonsError) throw lessonsError;
        if (progressError) throw progressError;
        if (quizzesError) throw quizzesError;
        // if (questionsError) throw questionsError; // Not used in this particular report, but good to fetch if used elsewhere.
        // if (answersError) throw answersError;     // Not used in this particular report.
        if (quizResultsError) throw quizResultsError;
        
        // --- Create Lookup Maps ---
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
        
        const lessonsByModule = new Map<string, Lesson[]>(); // Store full lesson objects
        lessonsData!.forEach(lesson => {
            if (!lessonsByModule.has(lesson.module_id!)) lessonsByModule.set(lesson.module_id!, []);
            lessonsByModule.get(lesson.module_id!)!.push(lesson);
        });

        const quizzesByLesson = new Map<string, string[]>();
        quizzesData!.forEach(quiz => {
            if (!quizzesByLesson.has(quiz.lesson_id!)) quizzesByLesson.set(quiz.lesson_id!, []);
            quizzesByLesson.get(quiz.lesson_id!)!.push(quiz.id);
        });

        const completedLessonsByUser = new Map<string, Set<string>>();
        progressData!.forEach(progress => {
            if (!completedLessonsByUser.has(progress.user_id!)) completedLessonsByUser.set(progress.user_id!, new Set());
            completedLessonsByUser.get(progress.user_id!)!.add(progress.lesson_id!);
        });

        const latestQuizScoresByUser = new Map<string, Map<string, number>>();
        quizResultsData!.forEach(result => {
            if (!latestQuizScoresByUser.has(result.user_id)) {
                latestQuizScoresByUser.set(result.user_id, new Map());
            }
            // Only store the latest score for each quiz (assuming `created_at` ordering handles this)
            if (!latestQuizScoresByUser.get(result.user_id)!.has(result.quiz_id)) {
                latestQuizScoresByUser.get(result.user_id)!.set(result.quiz_id, result.score);
            }
        });

        // --- Calculate progress for each user based on their preferred language ---
        const calculatedProgress = usersData!.map(user => {
            const userPreferredLanguage = user.language || 'english'; // Default to English if not set
            const defaultProgress: LanguageProgress = { percentage: 0, completed: 0, total: 0, totalQuizzes: 0, attemptedQuizzes: 0, averageScore: null };
            
            let progressForUser: LanguageProgress = defaultProgress;

            // Filter modules for the user's profile and their preferred language
            const availableModulesForLanguage = modulesData!.filter(module => {
                if (module.language !== userPreferredLanguage) return false;
                if (user.role === 'admin') return true;

                const designations = designationsMap.get(module.id) || [];
                const regions = regionsMap.get(module.id) || [];
                
                const isDesignationRestricted = designations.length > 0;
                const isRegionRestricted = regions.length > 0;

                // If a module has no restrictions, it is NOT shown to non-admins
                if (!isDesignationRestricted && !isRegionRestricted && user.role !== 'admin') {
                    return false; 
                }

                // If it is restricted, the user must match all active restrictions.
                const userMatchesDesignation = !isDesignationRestricted || (!!user.designation && designations.includes(user.designation));
                const userMatchesRegion = !isRegionRestricted || (!!user.region && regions.includes(user.region));

                return userMatchesDesignation && userMatchesRegion;
            });
            
            const availableLessonIdsForLanguage = new Set<string>();
            availableModulesForLanguage.forEach(module => {
                (lessonsByModule.get(module.id) || []).forEach(lesson => {
                    // Ensure the lesson itself is also in the preferred language
                    if (lesson.language === userPreferredLanguage) { // <-- This ensures lessons match user's preferred language
                        availableLessonIdsForLanguage.add(lesson.id);
                    }
                });
            });
            
            const userCompletedSet = completedLessonsByUser.get(user.id) || new Set();
            const completedCount = Array.from(availableLessonIdsForLanguage).filter(id => userCompletedSet.has(id)).length;
            const totalLessons = availableLessonIdsForLanguage.size;
            const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

            const availableQuizIdsForLanguage = new Set<string>();
            availableLessonIdsForLanguage.forEach(lessonId => {
                (quizzesByLesson.get(lessonId) || []).forEach(quizId => availableQuizIdsForLanguage.add(quizId));
            });

            const userScores = latestQuizScoresByUser.get(user.id) || new Map();
            const attemptedQuizzesScores = Array.from(availableQuizIdsForLanguage)
                .map(quizId => userScores.get(quizId))
                .filter((score): score is number => score !== undefined);
            
            const totalQuizzes = availableQuizIdsForLanguage.size;
            const attemptedQuizzes = attemptedQuizzesScores.length;
            const averageScore = attemptedQuizzes > 0 ? Math.round(attemptedQuizzesScores.reduce((a, b) => a + b, 0) / attemptedQuizzes) : null;
            
            progressForUser = {
                percentage,
                completed: completedCount,
                total: totalLessons,
                totalQuizzes,
                attemptedQuizzes,
                averageScore
            };
            
            return { user, progress: progressForUser };
        });

        setUserProgressList(calculatedProgress);

      } catch (error: any) {
        console.error("Error fetching progress report data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load progress report data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProgressData();
  }, []);
  
  const handleDownloadReport = () => {
    if (userProgressList.length === 0) {
      toast({ title: "No Data", description: "There is no progress data to download.", variant: "destructive"});
      return;
    }
    
    setIsDownloading(true);

    try {
        const dataForExcel = userProgressList.flatMap(({ user, progress }) => {
            // Only include progress if there are completed lessons in their preferred language
            if (progress.total === 0 && progress.totalQuizzes === 0) return null; // Only show users with some activity

            const quizAttemptProgress = progress.totalQuizzes > 0 ? Math.round((progress.attemptedQuizzes / progress.totalQuizzes) * 100) : 0;
            
            return {
                "Name": user.name || 'N/A',
                "Email": user.email,
                "PSL ID": user.psl_id || 'N/A',
                "Role": user.role || 'N/A',
                "Region": user.region || 'N/A',
                "Preferred Language": user.language || 'english', // Explicitly show preferred language
                "Total Lessons (Preferred Lang)": progress.total,
                "Lessons Completed (Preferred Lang)": progress.completed,
                "Lesson Progress (%) (Preferred Lang)": progress.percentage,
                "Total Quizzes (Preferred Lang)": progress.totalQuizzes,
                "Quizzes Attempted (Preferred Lang)": progress.attemptedQuizzes,
                "Quiz Attempt Progress (%) (Preferred Lang)": quizAttemptProgress,
                "Average Quiz Score (%) (Preferred Lang)": progress.averageScore ?? 'N/A',
            };
        }).filter(row => row !== null);
        
        if(dataForExcel.length === 0) {
            toast({ title: "No Data", description: "No users have assigned content in their preferred language to generate a report.", variant: "destructive"});
            setIsDownloading(false);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Progress Report');

        worksheet['!cols'] = [
            { wch: 25 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // PSL ID
            { wch: 15 }, // Role
            { wch: 15 }, // Region
            { wch: 20 }, // Preferred Language
            { wch: 30 }, // Total Lessons (Preferred Lang)
            { wch: 30 }, // Lessons Completed (Preferred Lang)
            { wch: 35 }, // Lesson Progress (%) (Preferred Lang)
            { wch: 30 }, // Total Quizzes (Preferred Lang)
            { wch: 30 }, // Quizzes Attempted (Preferred Lang)
            { wch: 35 }, // Quiz Attempt Progress (%) (Preferred Lang)
            { wch: 35 }, // Average Quiz Score (%) (Preferred Lang)
        ];

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2);
        const formattedDate = `${day}_${month}_${year}`;
        
        XLSX.writeFile(workbook, `User_Progress_Report_${formattedDate}.xlsx`);

    } catch (error) {
        toast({ title: "Download Failed", description: "Could not generate the report.", variant: "destructive"});
        console.error("Excel generation error:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="yd-section-title">User Progress Report</h2>
                <div className="flex-shrink-0">
                  <YDButton onClick={handleDownloadReport} disabled={isDownloading || isLoading}>
                      {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                      Download Full Report
                  </YDButton>
                </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {userProgressList.length === 0 ? (
                    <YDCard>
                        <div className="p-6 text-center text-muted-foreground">
                            No users with assigned content in their preferred language found.
                        </div>
                    </YDCard>
                ) : (
                    userProgressList.map(({ user, progress }) => (
                        <Link to={`/admin/progress-report/${user.id}`} key={user.id}>
                            <YDCard className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    {/* Left Side: User Info */}
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div className="w-64 flex-shrink-0"> {/* Fixed width container for text */}
                                            <p className="font-medium truncate">{user.name || 'Unnamed User'}</p>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                            <p className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground capitalize inline-block mt-1">
                                                {user.language || 'english'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Progress Bars and Chevron */}
                                    <div className="flex items-center gap-6">
                                        {/* Module Progress Bar */}
                                        <div className="flex flex-col items-center w-24 text-sm text-muted-foreground">
                                            <span className="capitalize font-medium text-xs mb-1">Progress</span>
                                            <Progress value={progress.percentage} className="h-2 w-full" />
                                            <span className="text-xs mt-1">{progress.percentage}%</span>
                                        </div>

                                        {/* Quiz Score Bar */}
                                        <div className="flex flex-col items-center w-24 text-sm text-muted-foreground">
                                            <span className="capitalize font-medium text-xs mb-1">Score</span>
                                            {progress.averageScore !== null ? (
                                                <>
                                                    <Progress value={progress.averageScore} className="h-2 w-full" />
                                                    <span className="text-xs mt-1">{progress.averageScore}%</span>
                                                </>
                                            ) : (
                                                <span className="text-xs mt-1">N/A</span>
                                            )}
                                        </div>
                                        <ChevronRight className="text-muted-foreground"/>
                                    </div>
                                </div>
                            </YDCard>
                        </Link>
                    ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressReport;