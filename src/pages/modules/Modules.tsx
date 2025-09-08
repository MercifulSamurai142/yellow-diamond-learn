// yellow-diamond-learn-main/src/pages/modules/Modules.tsx
import { useEffect, useState, useContext } from "react"; // Import useContext
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext

type Module = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  language: string | null; // Ensure language is part of the type
  created_at: string | null;
  updated_at: string | null;
};

const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage from context

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        // Filter modules by currentLanguage
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('language', currentLanguage) // Apply language filter
          .order('order');

        if (error) throw error;
        
        setModules(data || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [currentLanguage]); // Re-run effect when currentLanguage changes

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Learning Modules</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.length === 0 ? (
                  <div className="md:col-span-3 lg:col-span-3">
                    <YDCard>
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No modules available for the selected language.</p>
                      </div>
                    </YDCard>
                  </div>
                ) : (
                  modules.map((module) => (
                    <Link to={`/modules/${module.id}`} key={module.id} className="group">
                      <YDCard className={cn(
                        "h-full transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1",
                        module.order === 1 && "bg-primary border-orange-600 text-primary-foreground"
                      )}>
                        <div className="p-4">
                          <div className={cn(
                            "flex items-center text-sm",
                            module.order === 1 ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            <span>Module {module.order}</span>
                          </div>
                          <h3 className={cn(
                            "text-xl font-semibold mb-2",
                             module.order === 1 ? "text-white" : "text-yd-navy"
                          )}>
                            {module.name}
                          </h3>
                          <p className={cn(
                            "mb-4 line-clamp-2 md:line-clamp-none min-h-[2.5rem]",
                            module.order === 1 ? "text-primary-foreground/90" : "text-muted-foreground"
                          )}>{module.description}</p>                          
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

export default Modules;