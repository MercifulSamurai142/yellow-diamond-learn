// yellow-diamond-learn-main/src/pages/modules/Modules.tsx
import { useEffect, useState, useContext } from "react"; // Import useContext
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { LanguageContext } from '@/contexts/LanguageContext'; // Import LanguageContext
import { useProfile } from "@/hooks/useProfile";

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
  const { profile, isLoading: isProfileLoading } = useProfile();

  useEffect(() => {
    if (isProfileLoading || !profile) {
      setIsLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        setIsLoading(true);
        // Filter modules by currentLanguage
        const { data: modulesData, error } = await supabase
          .from('modules')
          .select('*')
          .eq('language', currentLanguage) // Apply language filter
          .order('order');

        if (error) throw error;

        if (!modulesData) {
            setModules([]);
            setIsLoading(false);
            return;
        }

        let filteredModules = modulesData;

        if (profile.role !== 'admin') {
            const { data: moduleDesignations, error: desError } = await supabase.from('module_designation').select('module_id, designation');
            if (desError) throw desError;
            const designationsMap = new Map<string, string[]>();
            for (const md of moduleDesignations) {
                if (!designationsMap.has(md.module_id)) designationsMap.set(md.module_id, []);
                designationsMap.get(md.module_id)!.push(md.designation);
            }

            const { data: moduleRegions, error: regError } = await supabase.from('module_region').select('module_id, region');
            if (regError) throw regError;
            const regionsMap = new Map<string, string[]>();
            for (const mr of moduleRegions) {
                if (!regionsMap.has(mr.module_id)) regionsMap.set(mr.module_id, []);
                regionsMap.get(mr.module_id)!.push(mr.region);
            }

            const userDesignation = profile.designation;
            const userRegion = profile.region;

            filteredModules = modulesData.filter(module => {
                const designations = designationsMap.get(module.id) || [];
                const regions = regionsMap.get(module.id) || [];

                const isDesignationRestricted = designations.length > 0;
                const isRegionRestricted = regions.length > 0;

                // If a module has no restrictions, it is NOT shown.
                if (!isDesignationRestricted && !isRegionRestricted) {
                    return false;
                }
                
                // If it is restricted, the user must match all active restrictions.
                const userMatchesDesignation = !isDesignationRestricted || (!!userDesignation && designations.includes(userDesignation));
                const userMatchesRegion = !isRegionRestricted || (!!userRegion && regions.includes(userRegion));

                return userMatchesDesignation && userMatchesRegion;
            });
        }
        
        setModules(filteredModules || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [currentLanguage, profile, isProfileLoading]); // Re-run effect when currentLanguage changes

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Learning Modules</h2>
            
            {isLoading || isProfileLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.length === 0 ? (
                  <div className="md:col-span-3 lg:col-span-3">
                    <YDCard>
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No modules available for your profile in the selected language.</p>
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