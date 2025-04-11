
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchLessonData = async () => {
      // Reset state on new fetch
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

        // Handle potential null result from .single()
        if (lessonError) {
            console.error("Lesson fetch error:", lessonError);
            // Check if it's a "not found" error
            if (lessonError.code === 'PGRST116') { // PGRST116: Row not found
                 throw new Error(`Lesson with ID ${lessonId} not found.`);
            }
            throw lessonError; // Rethrow other errors
        }
        if (!lessonData) throw new Error(`Lesson with ID ${lessonId} not found.`);

        setLesson(lessonData as Lesson);

        const currentOrder = Number(lessonData.order);
        if (isNaN(currentOrder)) {
          throw new Error(`Invalid order type for current lesson: ${typeof lessonData.order}`);
        }

        // Fetch module details (only if lesson fetch was successful)
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('id, name')
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        if (!moduleData) throw new Error(`Module with ID ${moduleId} not found.`);

        setModule(moduleData as Module);

        // Check if there's a quiz for this lesson
        // Use count for efficiency if only existence is needed
        const { count: quizCount, error: quizError } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true }) // Count rows without fetching data
          .eq('lesson_id', lessonId);

        if (quizError) throw quizError;

        setHasQuiz(quizCount !== null && quizCount > 0);

        // Fetch ALL lessons for the module, sorted by order  
        // TODO - Fix this feature so as to not fetch all lessons everytime, change the column name of lesson table to something other than order
        const { data: allModuleLessons, error: allLessonsError } = await supabase
            .from('lessons')
            .select('id, order') // Select only needed fields
            .eq('module_id', moduleId)
            .order('order', { ascending: true }); // Only sort

        // Handle errors fetching all lessons
        if (allLessonsError) {
            console.error("Error fetching all module lessons for workaround:", allLessonsError);
            // Don't necessarily throw here, maybe just log and proceed without next lesson?
            // Depending on desired behavior. We'll throw for now.
            throw new Error(`Failed to fetch module lessons: ${allLessonsError.message}`);
        }
        if (!allModuleLessons) {
             console.warn('No lessons found for this module when searching for next lesson.');
             setNextLesson(null); // Ensure next lesson is null
             // Continue processing other data like progress...
        } else {
            // Find the index of the current lesson in the sorted array
            const currentLessonIndex = allModuleLessons.findIndex(l => l.id === lessonId);

            // Determine the next lesson
            let nextLessonResult: { id: string; order: number } | null = null;
            if (currentLessonIndex !== -1 && currentLessonIndex < allModuleLessons.length - 1) {
                // If current lesson found and it's not the last one in the array
                nextLessonResult = allModuleLessons[currentLessonIndex + 1];
            }

            // Set the state
            setNextLesson(nextLessonResult); // Will be null if no next lesson found
        }

        // Get user progress
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*') // Select all fields if needed, or specify like 'id, status, completed_at'
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle(); // Use maybeSingle to handle 0 or 1 result without error

          if (progressError) throw progressError;

          setProgress(progressData as UserProgress | null); // Allow null if no progress found
        }
      } catch (error: any) { // Catch error with 'any' type for broader compatibility
        console.error('Error fetching lesson data:', error); // Log the specific error caught
        toast({
          variant: "destructive",
          title: "Error Loading Lesson",
          // Provide a more specific message if possible from the error object
          description: error?.message || "Failed to load lesson content. Please try again.",
        });
        // Optional: Navigate back or show a specific error component
        // navigate(`/modules/${moduleId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();

    // Cleanup function if needed, though likely not for this effect
    // return () => { /* cleanup logic */ };

  }, [lessonId, moduleId, user, navigate]); // Added navigate to dependency array



  const markAsCompleted = async () => {
    if (!user || !lessonId || !lesson) return; // Ensure lesson is loaded

    // Prevent double-clicking or action while navigating
    setIsLoading(true);

    try {
      // Use upsert for simpler logic: insert if not exists, update if exists
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          // If progress exists, `id` might be needed depending on RLS policy for update.
          // If inserting, Supabase handles ID generation.
          // We provide composite keys (user_id, lesson_id) for matching.
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          // Include 'id' only if updating an existing record and needed by policy
          // id: progress?.id
        }, {
           onConflict: 'user_id, lesson_id' // Specify columns that define a unique row
        })
        .select('id') // Select something to confirm success/return data if needed
        .single(); // Expect one row affected/returned

      if (error) throw error;

      toast({
        title: "Lesson completed!",
        description: "Your progress has been saved.",
      });

       // Add a small delay before navigation to allow toast to be seen
       setTimeout(() => {
           // Navigate to quiz or next lesson
           if (hasQuiz) {
             navigate(`/modules/${moduleId}/lessons/${lessonId}/quiz`);
           } else if (nextLesson) {
             navigate(`/modules/${moduleId}/lessons/${nextLesson.id}`);
           } else {
             // If no next lesson, navigate back to the module page
             navigate(`/modules/${moduleId}`);
             toast({ title: "Module completed!", description: "Congratulations!"});
           }
       }, 500); // 500ms delay


    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        variant: "destructive",
        title: "Error Saving Progress",
        description: error?.message || "Failed to update progress.",
      });
      setIsLoading(false); // Re-enable button if error occurs
    }
     // Don't set isLoading false here if navigation occurs in setTimeout
  };

  // --- Render logic ---

  if (isLoading) {
    // Use the same full-page loading indicator structure
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

  if (!lesson || !module) { // Handle case where lesson or module data failed to load after loading state
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

  // Main content render
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8"> {/* Use flex-wrap and gap */}
              <Link to={`/modules/${moduleId}`} className="text-primary hover:underline flex items-center text-sm">
                <ArrowLeft size={16} className="mr-1" />
                Back to: {module.name}
              </Link>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock size={16} className="mr-1" />
                <span>Est: {lesson.duration_minutes} minutes</span>
              </div>
            </div>

            <h2 className="yd-section-title mb-6">{lesson.title}</h2>

            <YDCard className="mb-8 overflow-hidden"> {/* Added overflow-hidden */}
               {/* Optional: Add image or video placeholder */}
               {/* <img src="/api/placeholder/800/300" alt="Lesson visual" className="w-full h-48 object-cover mb-0" /> */}
              <div className="p-6">
                {lesson.content ? (
                  // Using prose for basic styling, ensure Tailwind typography plugin is installed
                  <div className="prose dark:prose-invert max-w-none">
                    {/* WARNING: Only use dangerouslySetInnerHTML if lesson.content is TRUSTED HTML */}
                    {/* Consider using a Markdown renderer (like react-markdown) if content is Markdown */}
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">This lesson has no content yet.</p>
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
                // Placeholder to keep button alignment
                <div></div>
              )}

              <YDButton
                onClick={markAsCompleted}
                disabled={isLoading} // Disable button during the completion process/navigation
              >
                {isLoading && progress?.status !== 'completed' ? (
                  <Loader2 size={16} className="mr-2 animate-spin" /> // Show loader only when marking complete
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