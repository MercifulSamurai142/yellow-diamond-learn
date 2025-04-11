
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number;
  module_id: string;
  order: number;
};

type Module = {
  id: string;
  name: string;
};

type UserProgress = {
  id: string;
  status: string;
  completed_at: string | null;
};

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
      try {
        setIsLoading(true);
        if (!lessonId || !moduleId) return;
        
        // Fetch lesson details
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        
        setLesson(lessonData as Lesson);

        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('id, name')
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        
        setModule(moduleData as Module);

        // Check if there's a quiz for this lesson
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', lessonId);

        if (quizError) throw quizError;
        
        setHasQuiz(quizData && quizData.length > 0);

        // Find next lesson - FIX: Properly construct the query for finding the next lesson
        const { data: nextLessonData, error: nextLessonError } = await supabase
          .from('lessons')
          .select('id, order')
          .eq('module_id', moduleId)
          .gt('order', lessonData.order)
          .order('order', { ascending: true })
          .limit(1);

        if (nextLessonError) throw nextLessonError;
        
        if (nextLessonData && nextLessonData.length > 0) {
          setNextLesson(nextLessonData[0] as { id: string; order: number });
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
          
          setProgress(progressData as UserProgress);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load lesson content.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, moduleId, user]);

  const markAsCompleted = async () => {
    if (!user || !lessonId) return;
    
    try {
      // If progress exists, update it, otherwise create new record
      if (progress) {
        const { error } = await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', progress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }
      
      toast({
        title: "Lesson completed",
        description: "Your progress has been saved.",
      });
      
      // Navigate to quiz or next lesson
      if (hasQuiz) {
        navigate(`/modules/${moduleId}/lessons/${lessonId}/quiz`);
      } else if (nextLesson) {
        navigate(`/modules/${moduleId}/lessons/${nextLesson.id}`);
      } else {
        navigate(`/modules/${moduleId}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
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
              <h2 className="text-xl font-semibold mb-4">Lesson not found</h2>
              <Link to={`/modules/${moduleId}`} className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to module
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
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <Link to={`/modules/${moduleId}`} className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to {module.name}
              </Link>
              <div className="flex items-center text-muted-foreground">
                <Clock size={16} className="mr-1" />
                <span>{lesson.duration_minutes} minutes</span>
              </div>
            </div>
            
            <h2 className="yd-section-title mb-6">{lesson.title}</h2>
            
            <YDCard className="mb-8">
              <div className="p-6">
                {lesson.content ? (
                  <div className="prose max-w-none">
                    {/* In a real app, this would render rich text or markdown */}
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">This lesson has no content yet.</p>
                )}
              </div>
            </YDCard>
            
            <div className="flex justify-between items-center">
              {progress?.status === 'completed' ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 size={18} className="mr-2" />
                  <span>Completed</span>
                </div>
              ) : (
                <div></div>
              )}
              
              <YDButton onClick={markAsCompleted}>
                {progress?.status === 'completed' ? 'Continue' : 'Mark as Complete'}
                <ArrowRight size={16} className="ml-2" />
              </YDButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonDetail;
