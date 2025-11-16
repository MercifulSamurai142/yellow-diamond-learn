// yellow-diamond-learn-dev/src/pages/modules/Modules.tsx
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

// Translation object structure
const translations = {
  english: {
    module: "Module",
    noModulesAvailable: "No modules available for your profile in the selected language.",
  },
  hindi: {
    module: "मॉड्यूल",
    noModulesAvailable: "चयनित भाषा के लिए कोई मॉड्यूल उपलब्ध नहीं है।",
  },
  kannada: {
    module: "ಮಾಡ್ಯೂಲ್",
    noModulesAvailable: "ಆಯ್ಕೆಮಾಡಿದ ಭಾಷೆಗಾಗಿ ಯಾವುದೇ ಮಾಡ್ಯೂಲ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ.",
  }
};


const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentLanguage } = useContext(LanguageContext)!; // Get currentLanguage from context
  const { profile, isLoading: isProfileLoading } = useProfile();

  // Get current language translations
  const t = translations[currentLanguage] || translations.english; // Initialize t here


  useEffect(() => {
    if (isProfileLoading || !profile) {
      setIsLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        setIsLoading(true);
        
        let modulesQuery = supabase
          .from('modules')
          .select('*')
          .eq('language', currentLanguage) // Apply language filter
          .order('order');
        
        let initialModulesData: Module[] | null = null;
        let authorizedStates: string[] = [];

        if (profile.role === 'admin') {
            const { data, error } = await modulesQuery;
            if (error) throw error;
            initialModulesData = data;
        } else if (profile.role === 'region admin' && profile.id) {
            const { data: adminStatesData, error: adminStatesError } = await supabase
                .from('region_admin_state')
                .select('state')
                .eq('id', profile.id);
            if (adminStatesError) throw adminStatesError;
            authorizedStates = adminStatesData.map(row => row.state);

            if (authorizedStates.length === 0) {
                // If region admin has no states assigned, they see no modules.
                setModules([]);
                setIsLoading(false);
                return;
            }

            // Now get modules that match these states
            const { data: allModulesForLanguage, error: modulesError } = await modulesQuery;
            if (modulesError) throw modulesError;
            
            const { data: moduleStates, error: stateError } = await supabase.from('module_state').select('module_id, state');
            if (stateError) throw stateError;
            const statesMap = new Map<string, string[]>();
            for (const ms of moduleStates) {
                if (!statesMap.has(ms.module_id)) statesMap.set(ms.module_id, []);
                statesMap.get(ms.module_id)!.push(ms.state);
            }

            initialModulesData = (allModulesForLanguage || []).filter(module => {
                const moduleStates = statesMap.get(module.id) || [];
                const isModuleStateRestricted = moduleStates.length > 0;

                if (!isModuleStateRestricted) {
                    return false; // Modules with no state restriction are not shown to region admins
                }
                return moduleStates.some(ms => authorizedStates.includes(ms));
            });

        } else { // Learner role
            const { data: allModulesForLanguage, error: modulesError } = await modulesQuery;
            if (modulesError) throw modulesError;

            const { data: moduleDesignations, error: desError } = await supabase.from('module_designation').select('module_id, designation');
            if (desError) throw desError;
            const designationsMap = new Map<string, string[]>();
            for (const md of moduleDesignations) {
                if (!designationsMap.has(md.module_id)) designationsMap.set(md.module_id, []);
                designationsMap.get(md.module_id)!.push(md.designation);
            }

            const { data: moduleStates, error: stateError } = await supabase.from('module_state').select('module_id, state');
            if (stateError) throw stateError;
            const statesMap = new Map<string, string[]>();
            for (const ms of moduleStates) {
                if (!statesMap.has(ms.module_id)) statesMap.set(ms.module_id, []);
                statesMap.get(ms.module_id)!.push(ms.state);
            }

            const userDesignation = profile.designation;
            const userState = profile.state;

            initialModulesData = (allModulesForLanguage || []).filter(module => {
                const designations = designationsMap.get(module.id) || [];
                const states = statesMap.get(module.id) || [];
                
                const isDesignationRestricted = designations.length > 0;
                const isStateRestricted = states.length > 0;

                if (!isDesignationRestricted && !isStateRestricted) {
                    return false; 
                }
                
                const userMatchesDesignation = !isDesignationRestricted || (!!userDesignation && designations.includes(userDesignation));
                const userMatchesState = !isStateRestricted || (!!userState && states.includes(userState));

                return userMatchesDesignation && userMatchesState;
            });
        }
        
        setModules(initialModulesData || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [currentLanguage, profile, isProfileLoading]);

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
                        <p className="text-muted-foreground">{t.noModulesAvailable}</p>
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
                            <span>{t.module} {module.order}</span>
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