
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Module = {
  id: string;
  name: string;
  description: string | null;
};

type Lesson = {
  id: string;
  title: string;
  duration_minutes: number;
  order: number;
};

const ModuleDetail = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchModuleAndLessons = async () => {
      try {
        setIsLoading(true);
        
        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        
        setModule(moduleData as Module);

        // Fetch lessons for this module
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', moduleId)
          .order('order');

        if (lessonsError) throw lessonsError;
        
        setLessons(lessonsData as Lesson[]);
      } catch (error) {
        console.error('Error fetching module details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (moduleId) {
      fetchModuleAndLessons();
    }
  }, [moduleId]);

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

  if (!module) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full flex-col">
              <h2 className="text-xl font-semibold mb-4">Module not found</h2>
              <Link to="/modules" className="text-primary hover:underline flex items-center">
                <ArrowLeft size={16} className="mr-1" />
                Back to modules
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
            <Link to="/modules" className="text-primary hover:underline flex items-center mb-4">
              <ArrowLeft size={16} className="mr-1" />
              Back to modules
            </Link>
            
            <h2 className="yd-section-title mb-2">{module.name}</h2>
            <p className="text-muted-foreground mb-8">{module.description}</p>
            
            <h3 className="text-lg font-semibold mb-4">Lessons</h3>
            
            <div className="space-y-4">
              {lessons.length > 0 ? lessons.map((lesson) => (
                <Link to={`/modules/${moduleId}/lessons/${lesson.id}`} key={lesson.id}>
                  <YDCard className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-medium">{lesson.title}</h4>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>{lesson.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen size={14} className="mr-1" />
                        <span>Lesson {lesson.order}</span>
                      </div>
                    </div>
                  </YDCard>
                </Link>
              )) : (
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
