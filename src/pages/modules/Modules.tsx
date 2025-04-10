
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { supabase } from "@/integrations/supabase/client";

type Module = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  created_at: string | null;
  updated_at: string | null;
};

const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('modules')
          .select('*')
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
  }, []);

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
                {modules.map((module) => (
                  <Link to={`/modules/${module.id}`} key={module.id}>
                    <YDCard className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                      <div className="p-4">
                        <h3 className="text-xl font-semibold text-yd-navy mb-2">{module.name}</h3>
                        <p className="text-muted-foreground mb-4">{module.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>Module {module.order}</span>
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

export default Modules;
