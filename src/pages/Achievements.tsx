
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { Award, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Achievement = {
  id: string;
  name: string;
  description: string;
  criteria: any;
  earned: boolean;
  earned_at: string | null;
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get all achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('created_at');

        if (achievementsError) throw achievementsError;
        
        // Get user's earned achievements
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id);

        if (userAchievementsError) throw userAchievementsError;
        
        // Create a map of earned achievements
        const earnedMap: Record<string, string> = {};
        userAchievementsData.forEach(ua => {
          earnedMap[ua.achievement_id] = ua.earned_at;
        });
        
        // Combine the data
        const combinedAchievements = achievementsData.map(achievement => ({
          ...achievement,
          earned: !!earnedMap[achievement.id],
          earned_at: earnedMap[achievement.id] || null
        }));
        
        setAchievements(combinedAchievements as Achievement[]);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Achievements</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-gray-200"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <YDCard 
                    key={achievement.id}
                    className={`transition-all ${
                      achievement.earned 
                        ? 'border border-primary' 
                        : 'opacity-70'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`rounded-full p-3 ${
                          achievement.earned 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {achievement.earned ? (
                            <Award size={24} />
                          ) : (
                            <Lock size={24} />
                          )}
                        </div>
                        
                        {achievement.earned && (
                          <div className="text-xs text-muted-foreground">
                            Earned: {new Date(achievement.earned_at!).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </YDCard>
                ))}
                
                {achievements.length === 0 && (
                  <div className="col-span-3">
                    <YDCard>
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No achievements available yet.</p>
                      </div>
                    </YDCard>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Achievements;
