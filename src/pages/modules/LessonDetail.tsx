// yellow-diamond-learn-main/src/pages/modules/LessonDetail.tsx
import { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { checkAndAwardAchievements } from "@/services/achivementServices";
import { CheckContext } from "@/services/achivementServices";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext

type Lesson = Tables<"lessons">

type Module = Tables<"modules">

type UserProgress = Tables<"user_progress">

const LessonDetail = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; order: number } | null>(null);
  const [hasQuiz, setHasQuiz] = useState<boolean>(false);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage

  // Start of markAsCompleted function (added back)
  const markAsCompleted = async () => {
    if (!user || !lessonId || !lesson) return; // Ensure lesson is loaded

    // Prevent double-clicking or action while navigating
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        }, {
           onConflict: 'user_id, lesson_id'
        })
        .select('id')
        .single();

      if (error) throw error;

      if (user && lessonId && moduleId) {
        const checkContext: CheckContext = {
            userId: user.id,
            lessonId: lessonId,
            moduleId: moduleId,
        };
         checkAndAwardAchievements(checkContext).catch(err => console.error("Achievement check failed:", err));
    }

      // toast({
      //   title: "Lesson completed!",
      //   description: "Your progress has been saved.",
      // });

       setTimeout(() => {
           if (hasQuiz) {
             navigate(`/modules/${moduleId}/lessons/${lessonId}/quiz`);
           } else if (nextLesson) {
             navigate(`/modules/${moduleId}/lessons/${nextLesson.id}`);
           } else {
             navigate(`/modules/${moduleId}`);
             toast({ title: "Module completed!", description: "Congratulations!"});
           }
       }, 500);


    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        variant: "destructive",
        title: "Error Saving Progress",
        description: error?.message || "Failed to update progress.",
      });
      setIsLoading(false);
    }
  };
  // End of markAsCompleted function

  useEffect(() => {
    const fetchLessonData = async () => {
      setLesson(null);
      setModule(null);
      setNextLesson(null);
      setHasQuiz(false);
      setProgress(null);
      setIsLoading(true);

      try {
        if (!lessonId || !moduleId) {
            throw new Error("Missing Module ID or Lesson ID");
        };

        // Fetch lesson details
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) {
            console.error("Lesson fetch error:", lessonError);
            if (lessonError.code === 'PGRST116') {
                 throw new Error(`Lesson with ID ${lessonId} not found.`);
            }
            throw lessonError;
        }
        if (!lessonData) throw new Error(`Lesson with ID ${lessonId} not found.`);

        // Check if the fetched lesson's language matches the current selected language.
        if (lessonData?.language && lessonData.language !== currentLanguage) {
             console.warn(`Lesson ${lessonId} is in ${lessonData.language}, but current language is ${currentLanguage}. Displaying anyway.`);
        }

        setLesson(lessonData as Lesson);

        const currentOrder = Number(lessonData.order);
        if (isNaN(currentOrder)) {
          throw new Error(`Invalid order type for current lesson: ${typeof lessonData.order}`);
        }

        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('id, name')
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        if (!moduleData) throw new Error(`Module with ID ${moduleId} not found.`);

        setModule(moduleData as Module);

        // Check for quiz
        const { count: quizCount, error: quizError } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('lesson_id', lessonId);

        if (quizError) throw quizError;

        setHasQuiz(quizCount !== null && quizCount > 0);

        // Fetch ALL lessons for the module, sorted by order, AND FILTERED BY LANGUAGE
        const { data: allModuleLessons, error: allLessonsError } = await supabase
            .from('lessons')
            .select('id, order')
            .eq('module_id', moduleId)
            .eq('language', currentLanguage) // Filter by language for next/prev logic
            .order('order', { ascending: true });

        if (allLessonsError) {
            console.error("Error fetching all module lessons:", allLessonsError);
            throw new Error(`Failed to fetch module lessons for navigation: ${allLessonsError.message}`);
        }
        if (!allModuleLessons) {
             console.warn('No lessons found for this module in the current language when searching for next lesson.');
             setNextLesson(null);
        } else {
            const currentLessonIndex = allModuleLessons.findIndex(l => l.id === lessonId);
            let nextLessonResult: { id: string; order: number } | null = null;
            if (currentLessonIndex !== -1 && currentLessonIndex < allModuleLessons.length - 1) {
                nextLessonResult = allModuleLessons[currentLessonIndex + 1];
            }
            setNextLesson(nextLessonResult);
        }

        // Get user progress
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle();

          if (progressError) throw progressError;

          setProgress(progressData as UserProgress | null);
        }
      } catch (error: any) {
        console.error('Error fetching lesson data:', error);
        toast({
          variant: "destructive",
          title: "Error Loading Lesson",
          description: error?.message || "Failed to load lesson content. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();

  }, [lessonId, moduleId, user, navigate, currentLanguage]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!lesson || !module) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full flex-col">
              <h2 className="text-xl font-semibold mb-4 text-destructive">Lesson or Module Not Found</h2>
              <p className="text-muted-foreground mb-4">Could not load the requested lesson data.</p>
              <Link to={`/modules/${moduleId || ''}`} className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to module overview
              </Link>
            </div>
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
        <main className={cn("flex-1 overflow-y-auto ", isMobile ? "px-0 py-6" : "p-6")}>
          <div className={cn("yd-container animate-fade-in", isMobile ? "p-0": "")}>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <Link to={`/modules/${moduleId}`} className="text-primary hover:underline flex items-center text-sm">
                <ArrowLeft size={16} className="mr-1" />
                Back to: {module.name}
              </Link>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock size={16} className="mr-1" />
                <span>Est: {lesson.duration_minutes} minutes</span>
              </div>
            </div>

            <h2 className={cn("yd-section-title mb-6", isMobile ? "px-4" : "px-0")}>{lesson.title}</h2>

            {lesson.video_url ? (
                <div className={cn("aspect-video", isMobile ? "px-4 bg-white":"bg-black")}>
                  <video
                    key={lesson.video_url}
                    controls
                    className="w-full h-full"
                    src={lesson.video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : null}
            <YDCard className="mb-8 p-0 overflow-hidden rounded-none md:rounded-lg">
              <div className="p-0">
                {lesson.content ? (
                  <div className="prose dark:prose-invert max-w-full">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                ) : (
                  <p className={cn("text-muted-foreground", isMobile ? "px-4" : "px-0")}>This lesson has no content yet.</p>
                )}
              </div>
            </YDCard>

            <div className="flex justify-between items-center">
              {progress?.status === 'completed' ? (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle2 size={18} className="mr-2" />
                  <span>Completed!</span>
                </div>
              ) : (
                <div></div>
              )}

              <YDButton
                onClick={markAsCompleted} // The fixed call
                disabled={isLoading}
              >
                {isLoading && progress?.status !== 'completed' ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                {progress?.status === 'completed'
                    ? (hasQuiz ? 'Go to Quiz' : nextLesson ? 'Next Lesson' : 'Finish Module')
                    : 'Mark as Complete'
                }
                {(!isLoading || progress?.status === 'completed') && <ArrowRight size={16} className="ml-2" />}
              </YDButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonDetail;