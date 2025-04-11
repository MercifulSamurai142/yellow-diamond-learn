import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton"; // Import YDButton
import { ArrowLeft, BookOpen, Clock, ClipboardCheck, HelpCircle, Check, X, Loader2 } from "lucide-react"; // Import icons
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { toast } from "@/hooks/use-toast"; // Import use-toast
import { Tables } from "@/integrations/supabase/types"; // Import Supabase types helper

// Define necessary types using Supabase Tables helper or manually
type Module = Tables<'modules'>; // Assuming 'modules' table exists
type Lesson = Tables<'lessons'>; // Assuming 'lessons' table exists
type Quiz = Tables<'quizzes'>;   // Assuming 'quizzes' table exists
type QuizResult = Tables<'quiz_results'>; // Assuming 'quiz_attempts' table exists

// Combined type for state
type LessonWithQuizInfo = Lesson & {
  quiz: (Quiz & { attempt?: QuizResult | null }) | null;
};

const ModuleDetail = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<Module | null>(null);
  // Update state type to hold combined lesson + quiz info
  const [lessons, setLessons] = useState<LessonWithQuizInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth(); // Get user from Auth context

  useEffect(() => {
    const fetchModuleAndLessons = async () => {
      setIsLoading(true);
      setLessons([]); // Clear previous lessons on new fetch
      setModule(null);
      try {
        if (!moduleId) throw new Error("Module ID is missing from URL parameters.");

        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*') // Select required fields: id, name, description
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        if (!moduleData) throw new Error(`Module with ID ${moduleId} not found.`);

        setModule(moduleData); // Set module state

        // Fetch lessons for this module
        const { data: lessonData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*') // Select required fields: id, title, duration_minutes, order, module_id
          .eq('module_id', moduleId)
          .order('order', { ascending: true }); // Explicit ascending

        if (lessonsError) throw lessonsError;

        // Handle case where no lessons exist for the module
        if (!lessonData || lessonData.length === 0) {
            setLessons([]);
            setIsLoading(false); // Still need to stop loading
            return; // Exit if no lessons
        }

        const lessonIds = lessonData.map(l => l.id);

        // --- Fetch Quizzes for these lessons ---
        let quizzesByLessonId = new Map<string, Quiz>();
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, lesson_id, title, pass_threshold, updated_at, created_at')
          .in('lesson_id', lessonIds);

        if (quizError) {
            console.error("Error fetching quizzes:", quizError);
            toast({ variant: "destructive", title: "Warning", description: "Could not load quiz information." });
            // Proceed without quiz info
        } else if (quizData) {
            quizData.forEach(q => quizzesByLessonId.set(q.lesson_id, q));
        }

        // --- Fetch User Attempts for these quizzes ---
        let attemptsByQuizId = new Map<string, QuizResult>();
        const quizIds = quizData?.map(q => q.id) || [];

        if (user && quizIds.length > 0) {
          const { data: attemptData, error: attemptError } = await supabase
            .from('quiz_results')
            .select('quiz_id, score, passed, created_at, user_id, answers_json, lesson_id, id') 
            .eq('user_id', user.id)
            .in('quiz_id', quizIds)
            .order('created_at', { ascending: false }); // Get latest attempts first

          if (attemptError) {
              console.error("Error fetching quiz attempts:", attemptError);
              toast({ variant: "destructive", title: "Warning", description: "Could not load your quiz attempts." });
              // Proceed without attempt info
          } else if (attemptData) {
              attemptData.forEach(attempt => {
                  if (!attemptsByQuizId.has(attempt.quiz_id)) { // Store only the latest
                      attemptsByQuizId.set(attempt.quiz_id, attempt);
                  }
              });
          }
        }

        // --- Combine data ---
        const lessonsWithQuizData: LessonWithQuizInfo[] = lessonData.map(lesson => {
          const quiz = quizzesByLessonId.get(lesson.id) || null;
          let attempt = null;
          if (quiz) {
            attempt = attemptsByQuizId.get(quiz.id) || null;
          }
          return {
            ...lesson, // Spread original lesson fields
            quiz: quiz ? { ...quiz, attempt } : null, // Add nested quiz+attempt structure
          };
        });

        setLessons(lessonsWithQuizData); // Update state with the combined data

      } catch (error: any) {
        console.error('Error fetching module details:', error);
        toast({ variant: "destructive", title: "Error Loading Module", description: error.message });
         setModule(null); // Ensure module is null on error
         setLessons([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (moduleId) {
      fetchModuleAndLessons();
    } else {
         // Handle case where moduleId is somehow not available
         setIsLoading(false);
         toast({ variant: "destructive", title: "Error", description: "Module ID not found." });
    }
  }, [moduleId, user]); // Add user dependency

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
               <Loader2 className="h-12 w-12 animate-spin text-primary" /> {/* Use Loader2 */}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- Not Found State ---
  if (!module) {
    // This handles both initial load error and module not found case
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full flex-col">
              <h2 className="text-xl font-semibold mb-4 text-destructive">Module Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested module could not be loaded.</p>
              <Link to="/dashboard" className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <Link to="/dashboard" className="text-primary hover:underline flex items-center mb-4 text-sm">
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </Link>

            <h2 className="yd-section-title mb-2">{module.name}</h2>
            <p className="text-muted-foreground mb-8">{module.description || 'No description available.'}</p>

            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Lessons & Quizzes</h3>

            <div className="space-y-4">
              {lessons.length > 0 ? lessons.map((lesson, index) => (
                // Use a div as the root for each item to contain lesson + quiz
                <div key={lesson.id} className="p-4 border rounded-md bg-card shadow-sm">
                  {/* Lesson Info */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                    <Link
                        to={`/modules/${moduleId}/lessons/${lesson.id}`}
                        className="font-semibold text-lg hover:text-primary mb-1 sm:mb-0"
                      >
                        {lesson.order}. {lesson.title}
                    </Link>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock size={14} className="mr-1 flex-shrink-0" />
                      <span>{lesson.duration_minutes} min lesson</span>
                    </div>
                  </div>
                   {/* Optional: Lesson status indicators can go here */}

                  {/* --- NEW: Conditional Quiz Section --- */}
                  {lesson.quiz && (
                    <div className="mt-3 pt-3 pl-4 border-l-2 border-primary/30 space-y-2 bg-muted/30 rounded-r-md p-3">
                      <div className="flex items-center font-medium text-foreground">
                        <ClipboardCheck size={16} className="mr-2 text-primary flex-shrink-0"/>
                        Quiz: {lesson.quiz.title}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 pl-6"> {/* Indent details */}
                         <p>Pass Threshold: {lesson.quiz.pass_threshold}%</p>
                         <div className="flex items-center">
                            <span className="mr-1">Status:</span>
                            {lesson.quiz.attempt ? (
                                lesson.quiz.attempt.passed ? (
                                    <span className="flex items-center font-semibold text-green-600">
                                        <Check size={14} className="mr-1"/> Passed ({lesson.quiz.attempt.score}%)
                                    </span>
                                ) : (
                                     <span className="flex items-center font-semibold text-red-600">
                                         <X size={14} className="mr-1"/> Failed ({lesson.quiz.attempt.score}%)
                                     </span>
                                )
                            ) : (
                                <span className="flex items-center font-medium text-amber-600">
                                    <HelpCircle size={14} className="mr-1"/> Not Attempted
                                </span>
                           )}
                         </div>
                         {lesson.quiz.attempt && (
                             <p className="text-xs">
                                 (Last attempt on: {new Date(lesson.quiz.attempt.created_at).toLocaleDateString()})
                             </p>
                         )}
                      </div>
                      <div className="pl-6 pt-1"> {/* Indent button */}
                          <Link to={`/modules/${moduleId}/lessons/${lesson.id}/quiz`}>
                            <YDButton variant="outline" size="sm">
                              {lesson.quiz.attempt ? 'Retake Quiz' : 'Take Quiz'}
                            </YDButton>
                          </Link>
                      </div>
                    </div>
                  )}
                  {/* --- End of Quiz Section --- */}

                </div> // End of root div for lesson item
              )) : (
                // Card displayed if lessons array is empty AFTER loading
                <YDCard>
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">No lessons available for this module yet.</p>
                  </div>
                </YDCard>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModuleDetail;