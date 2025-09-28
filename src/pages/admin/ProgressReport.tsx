import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { YDCard } from '@/components/ui/YDCard';
import { Progress } from '@/components/ui/progress';
import { Loader2, User, ChevronRight, Download } from 'lucide-react';
import YDButton from '@/components/ui/YDButton';
import * as XLSX from 'xlsx';

// Types
type User = Tables<'users'>;

type UserOverallProgress = {
  user: User;
  progressByLanguage: {
    [key in 'english' | 'hindi' | 'kannada']: {
      percentage: number;
      completed: number;
      total: number;
    }
  }
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
          { data: lessonsData, error: lessonsError },
          { data: progressData, error: progressError },
        ] = await Promise.all([
          supabase.from('users').select('*').order('name'),
          supabase.from('modules').select('id, language'),
          supabase.from('module_designation').select('*'),
          supabase.from('module_region').select('*'),
          supabase.from('lessons').select('id, module_id'),
          supabase.from('user_progress').select('user_id, lesson_id').eq('status', 'completed')
        ]);

        if (usersError) throw usersError;
        if (modulesError) throw modulesError;
        if (designationsError) throw designationsError;
        if (regionsError) throw regionsError;
        if (lessonsError) throw lessonsError;
        if (progressError) throw progressError;
        
        // --- Pre-process data for efficient lookup ---
        const designationsMap = new Map<string, string[]>();
        for (const md of designationsData!) {
            if (!designationsMap.has(md.module_id)) designationsMap.set(md.module_id, []);
            designationsMap.get(md.module_id)!.push(md.designation);
        }

        const regionsMap = new Map<string, string[]>();
        for (const mr of regionsData!) {
            if (!regionsMap.has(mr.module_id)) regionsMap.set(mr.module_id, []);
            regionsMap.get(mr.module_id)!.push(mr.region);
        }
        
        const lessonsByModule = new Map<string, string[]>();
        for (const lesson of lessonsData!) {
            if (!lessonsByModule.has(lesson.module_id!)) lessonsByModule.set(lesson.module_id!, []);
            lessonsByModule.get(lesson.module_id!)!.push(lesson.id);
        }

        const completedLessonsByUser = new Map<string, Set<string>>();
        for (const progress of progressData!) {
            if (!completedLessonsByUser.has(progress.user_id!)) completedLessonsByUser.set(progress.user_id!, new Set());
            completedLessonsByUser.get(progress.user_id!)!.add(progress.lesson_id!);
        }

        // --- Calculate progress for each user ---
        const calculatedProgress = usersData!.map(user => {
            const progress: UserOverallProgress = {
                user,
                progressByLanguage: {
                    english: { percentage: 0, completed: 0, total: 0 },
                    hindi: { percentage: 0, completed: 0, total: 0 },
                    kannada: { percentage: 0, completed: 0, total: 0 },
                }
            };
            
            (['english', 'hindi', 'kannada'] as const).forEach(lang => {
                // 1. Find modules available to this user in this language
                const availableModules = modulesData!.filter(module => {
                    if (module.language !== lang) return false;
                    if (user.role === 'admin') return true; // Admins are eligible for all modules

                    const designations = designationsMap.get(module.id) || [];
                    const regions = regionsMap.get(module.id) || [];
                    const isDesignationRestricted = designations.length > 0;
                    const isRegionRestricted = regions.length > 0;

                    if (!isDesignationRestricted && !isRegionRestricted) return false;

                    const userMatchesDesignation = !isDesignationRestricted || (!!user.designation && designations.includes(user.designation));
                    const userMatchesRegion = !isRegionRestricted || (!!user.region && regions.includes(user.region));

                    return userMatchesDesignation && userMatchesRegion;
                });
                
                // 2. Get total lessons in those available modules
                const availableLessonIds = new Set<string>();
                availableModules.forEach(module => {
                    const moduleLessons = lessonsByModule.get(module.id) || [];
                    moduleLessons.forEach(lessonId => availableLessonIds.add(lessonId));
                });
                const totalLessons = availableLessonIds.size;
                
                // 3. Count how many of those lessons the user completed
                const userCompletedSet = completedLessonsByUser.get(user.id) || new Set();
                let completedCount = 0;
                availableLessonIds.forEach(lessonId => {
                    if (userCompletedSet.has(lessonId)) {
                        completedCount++;
                    }
                });

                // 4. Calculate percentage
                const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                progress.progressByLanguage[lang] = {
                    percentage,
                    completed: completedCount,
                    total: totalLessons,
                };
            });
            
            return progress;
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
        const dataForExcel = userProgressList.map(({ user, progressByLanguage }) => {
            const getProgressString = (lang: 'english' | 'hindi' | 'kannada') => {
                const progress = progressByLanguage[lang];
                return `${progress.percentage}% (${progress.completed}/${progress.total} lessons)`;
            };
            return {
                Name: user.name || 'N/A',
                Email: user.email,
                PSL: user.psl_id || 'N/A',
                region: user.region || 'N/A',
                English: getProgressString('english'),
                Hindi: getProgressString('hindi'),
                Kannada: getProgressString('kannada'),
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Progress Report');

        worksheet['!cols'] = [
            { wch: 25 }, // Name
            { wch: 30 }, // Email
            { wch: 30 }, // PSL
            { wch: 30 }, // Region
            { wch: 20 }, // English
            { wch: 20 }, // Hindi
            { wch: 20 }, // Kannada
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
                {userProgressList.map(({ user, progressByLanguage }) => (
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
                          </div>
                        </div>

                        {/* Right Side: Progress Bars and Chevron */}
                        <div className="flex items-center gap-6">
                          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                              {Object.entries(progressByLanguage).map(([lang, progress]) => (
                                  <div key={lang} className="flex flex-col items-center w-24">
                                    <span className="capitalize font-medium text-xs mb-1">{lang}</span>
                                    <Progress value={progress.percentage} className="h-2 w-full" />
                                    <span className="text-xs mt-1">{progress.percentage}%</span>
                                  </div>
                              ))}
                          </div>
                          <ChevronRight className="text-muted-foreground"/>
                        </div>
                      </div>
                    </YDCard>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgressReport;