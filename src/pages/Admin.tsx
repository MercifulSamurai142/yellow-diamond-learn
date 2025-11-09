// yellow-diamond-learn-dev/src/pages/Admin.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModuleManager from "@/components/admin/ModuleManager";
import LessonManager from "@/components/admin/LessonManager";
import QuizManager from "@/components/admin/QuizManager";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

// Update Module type to include reference_module_id
export type Module = Tables<"modules"> & {
  reference_module_id?: string | null; // Reverted to reference_module_id
};
export type Lesson = Tables<"lessons">;
export type Quiz = Tables<"quizzes">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;
export type Announcement = Tables<"announcements">;
export type UserProfile = Tables<"users">;
export type StagedUser = Tables<"user_import_staging">;
export type ModuleDesignation = Tables<"module_designation">;
export type ModuleRegion = Tables<"module_region">;


const Admin = () => {
  const { user: authUser } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<string>("modules");
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [moduleDesignations, setModuleDesignations] = useState<ModuleDesignation[]>([]);
  const [moduleRegions, setModuleRegions] = useState<ModuleRegion[]>([]);
  const [allEnglishModules, setAllEnglishModules] = useState<Module[]>([]); // New state for English modules

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [authUser, profile]);

  const loadData = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      let finalModules: Module[] = [];
      let finalLessons: Lesson[] = [];
      let finalQuizzes: Quiz[] = [];
      
      if (profile.role === 'admin') {
          const { data: modulesData, error: modulesError } = await supabase.from("modules").select("*").order("order");
          if (modulesError) throw modulesError;
          finalModules = modulesData || [];

      } else if (profile.role === 'region admin' && profile.region) {
          const { data: regionModuleData, error: regionModuleError } = await supabase
              .from('module_region')
              .select('module_id')
              .eq('region', profile.region);
          if (regionModuleError) throw regionModuleError;
          
          const moduleIds = regionModuleData.map(item => item.module_id);

          if (moduleIds.length > 0) {
              const { data: modulesData, error: modulesError } = await supabase
                  .from("modules")
                  .select("*")
                  .in("id", moduleIds)
                  .order("order");
              if (modulesError) throw modulesError;
              finalModules = modulesData || [];
          }
      }

      setModules(finalModules);

      if (finalModules.length > 0) {
          const moduleIds = finalModules.map(m => m.id);
          const { data: lessonsData, error: lessonsError } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("module_id, order");
          if (lessonsError) throw lessonsError;
          finalLessons = lessonsData || [];
          setLessons(finalLessons);

          if (finalLessons.length > 0) {
              const lessonIds = finalLessons.map(l => l.id);
              const { data: quizzesData, error: quizzesError } = await supabase.from("quizzes").select("*").in("lesson_id", lessonIds);
              if (quizzesError) throw quizzesError;
              finalQuizzes = quizzesData || [];
              setQuizzes(finalQuizzes);
          }
      }

      const { data: announcementsData, error: announcementsError } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      const { data: designationsData, error: designationsError } = await supabase.from("module_designation").select("*");
      if (designationsError) throw designationsData;
      setModuleDesignations(designationsData || []);
      
      const { data: regionsData, error: regionsError } = await supabase.from("module_region").select("*");
      if (regionsError) throw regionsError;
      setModuleRegions(regionsData || []);

      // Fetch all English modules for the reference dropdown
      const { data: engModulesData, error: engModulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("language", "english")
        .order("name");
      if (engModulesError) throw engModulesError;
      setAllEnglishModules(engModulesData || []);


    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="yd-container animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="yd-section-title">Admin Dashboard</h2>
                <YDButton onClick={loadData} disabled={isLoading}>
                  {isLoading ? "Loading..." : "Refresh Data"}
                </YDButton>
              </div>
              
              <Tabs defaultValue="modules" onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full grid grid-cols-4">
                  <TabsTrigger value="modules">Modules</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="modules" className="space-y-4">
                  <ModuleManager 
                    modules={modules} 
                    moduleDesignations={moduleDesignations}
                    moduleRegions={moduleRegions}
                    englishModules={allEnglishModules} // Pass new prop here
                    onModulesUpdate={setModules} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="lessons" className="space-y-4">
                  <LessonManager 
                    lessons={lessons} 
                    modules={modules} 
                    onLessonsUpdate={setLessons} 
                    refreshData={loadData} 
                  />
                </TabsContent>
                
                <TabsContent value="quizzes" className="space-y-4">
                  <QuizManager 
                    quizzes={quizzes} 
                    lessons={lessons} 
                    onQuizzesUpdate={setQuizzes} 
                    refreshData={loadData} 
                  />
                </TabsContent>

                <TabsContent value="announcements" className="space-y-4">
                  <AnnouncementManager
                    announcements={announcements}
                    onAnnouncementsUpdate={setAnnouncements}
                    refreshData={loadData}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
  );
};

export default Admin;