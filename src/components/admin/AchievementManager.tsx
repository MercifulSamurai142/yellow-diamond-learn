
import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Award } from "lucide-react";
import { Achievement } from "@/pages/Admin";
import { Json } from "@/integrations/supabase/types";

// Define achievement criteria types with a union type
type CriteriaType = 
  | "lessons_per_day" 
  | "complete_module" 
  | "quiz_score" 
  | "module_average" 
  | "streak" 
  | "module_score";

interface LessonsPerDayCriteria {
  type: "lessons_per_day";
  count: number;
}

interface CompleteModuleCriteria {
  type: "complete_module";
}

interface QuizScoreCriteria {
  type: "quiz_score";
  score: number;
}

interface ModuleAverageCriteria {
  type: "module_average";
  score: number;
}

interface StreakCriteria {
  type: "streak";
  days: number;
}

interface ModuleScoreCriteria {
  type: "module_score";
  module: string;
  score: number;
}

type AchievementCriteria = 
  | LessonsPerDayCriteria 
  | CompleteModuleCriteria 
  | QuizScoreCriteria 
  | ModuleAverageCriteria 
  | StreakCriteria 
  | ModuleScoreCriteria;

interface AchievementManagerProps {
  achievements: Achievement[];
  onAchievementsUpdate: (achievements: Achievement[]) => void;
  refreshData: () => Promise<void>;
}

interface NewAchievement {
  name: string;
  description: string;
  criteria_type: CriteriaType;
  criteria_count: number;
  criteria_score: number;
  criteria_module: string;
  criteria_days: number;
}

const AchievementManager = ({ achievements, onAchievementsUpdate, refreshData }: AchievementManagerProps) => {
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState<NewAchievement>({
    name: "",
    description: "",
    criteria_type: "lessons_per_day",
    criteria_count: 5,
    criteria_score: 80,
    criteria_module: "",
    criteria_days: 5
  });

  const criteriaTypes = [
    { value: "lessons_per_day", label: "Lessons completed in a day" },
    { value: "complete_module", label: "Complete a full module" },
    { value: "quiz_score", label: "Achieve a specific quiz score" },
    { value: "module_average", label: "Average score across all modules" },
    { value: "streak", label: "Login streak for consecutive days" },
    { value: "module_score", label: "Score in a specific module" }
  ] as const;

  const buildCriteriaJson = (): AchievementCriteria => {
    switch (newAchievement.criteria_type) {
      case "lessons_per_day":
        return { type: "lessons_per_day", count: newAchievement.criteria_count };
      case "complete_module":
        return { type: "complete_module" };
      case "quiz_score":
        return { type: "quiz_score", score: newAchievement.criteria_score };
      case "module_average":
        return { type: "module_average", score: newAchievement.criteria_score };
      case "streak":
        return { type: "streak", days: newAchievement.criteria_days };
      case "module_score":
        return { 
          type: "module_score", 
          module: newAchievement.criteria_module,
          score: newAchievement.criteria_score
        };
    }
  };

  const parseCriteriaJson = (criteria: Json | null) => {
    if (!criteria) return;
    
    try {
      // Type guard to check if criteria is an object with a type property
      if (
        typeof criteria === 'object' && 
        criteria !== null && 
        !Array.isArray(criteria) && 
        'type' in criteria && 
        typeof criteria.type === 'string'
      ) {
        const criteriaType = criteria.type as CriteriaType;
        
        setNewAchievement(prev => {
          const newState = { ...prev, criteria_type: criteriaType };
          
          if ('count' in criteria && typeof criteria.count === 'number') {
            newState.criteria_count = criteria.count;
          }
          
          if ('score' in criteria && typeof criteria.score === 'number') {
            newState.criteria_score = criteria.score;
          }
          
          if ('module' in criteria && typeof criteria.module === 'string') {
            newState.criteria_module = criteria.module;
          }
          
          if ('days' in criteria && typeof criteria.days === 'number') {
            newState.criteria_days = criteria.days;
          }
          
          return newState;
        });
      }
    } catch (error) {
      console.error("Error parsing criteria JSON:", error);
    }
  };

  const handleAddAchievement = async () => {
    try {
      if (!newAchievement.name || !newAchievement.description) {
        toast({
          title: "Error",
          description: "Achievement name and description are required",
          variant: "destructive",
        });
        return;
      }

      const criteriaJson = buildCriteriaJson();
      const { data, error } = await supabase
        .from("achievements")
        .insert({
          name: newAchievement.name,
          description: newAchievement.description,
          criteria: criteriaJson as unknown as Json
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement added successfully",
      });

      if (data) {
        onAchievementsUpdate([...achievements, data[0]]);
      }

      resetForm();
      await refreshData();
    } catch (error) {
      console.error("Error adding achievement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add achievement",
      });
    }
  };

  const handleEditAchievement = async (achievementId: string) => {
    const achievementToEdit = achievements.find(a => a.id === achievementId);
    if (!achievementToEdit) return;

    setEditingAchievementId(achievementId);
    setNewAchievement({
      name: achievementToEdit.name,
      description: achievementToEdit.description,
      criteria_type: "lessons_per_day",
      criteria_count: 5,
      criteria_score: 80,
      criteria_module: "",
      criteria_days: 5
    });
    
    parseCriteriaJson(achievementToEdit.criteria);
    setIsAddingAchievement(true);
  };

  const handleUpdateAchievement = async () => {
    if (!editingAchievementId) return;

    try {
      if (!newAchievement.name || !newAchievement.description) {
        toast({
          title: "Error",
          description: "Achievement name and description are required",
          variant: "destructive",
        });
        return;
      }

      const criteriaJson = buildCriteriaJson();
      const { error } = await supabase
        .from("achievements")
        .update({
          name: newAchievement.name,
          description: newAchievement.description,
          criteria: criteriaJson as unknown as Json
        })
        .eq("id", editingAchievementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement updated successfully",
      });

      const updatedAchievements = achievements.map(achievement => {
        if (achievement.id === editingAchievementId) {
          return {
            ...achievement,
            name: newAchievement.name,
            description: newAchievement.description,
            criteria: criteriaJson as unknown as Json
          };
        }
        return achievement;
      });
      onAchievementsUpdate(updatedAchievements);

      resetForm();
      await refreshData();
    } catch (error) {
      console.error("Error updating achievement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update achievement",
      });
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", achievementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement deleted successfully",
      });

      onAchievementsUpdate(achievements.filter(achievement => achievement.id !== achievementId));
      await refreshData();
    } catch (error) {
      console.error("Error deleting achievement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete achievement",
      });
    }
  };

  const resetForm = () => {
    setIsAddingAchievement(false);
    setEditingAchievementId(null);
    setNewAchievement({
      name: "",
      description: "",
      criteria_type: "lessons_per_day",
      criteria_count: 5,
      criteria_score: 80,
      criteria_module: "",
      criteria_days: 5
    });
  };

  const renderCriteriaDescription = (criteria: Json): React.ReactNode => {
    try {
      if (typeof criteria !== 'object' || criteria === null || Array.isArray(criteria)) {
        return "Invalid criteria format";
      }
      
      if (!('type' in criteria) || typeof criteria.type !== 'string') {
        return "Unknown criteria type";
      }

      switch (criteria.type) {
        case 'lessons_per_day': 
          return `Complete ${('count' in criteria && typeof criteria.count === 'number') ? criteria.count : '?'} lessons in a day`;
        case 'complete_module': 
          return 'Complete a full module';
        case 'quiz_score': 
          return `Get a ${('score' in criteria && typeof criteria.score === 'number') ? criteria.score : '?'}% score on a quiz`;
        case 'module_average': 
          return `Average ${('score' in criteria && typeof criteria.score === 'number') ? criteria.score : '?'}% score across all modules`;
        case 'streak': 
          return `Login and complete lessons for ${('days' in criteria && typeof criteria.days === 'number') ? criteria.days : '?'} consecutive days`;
        case 'module_score': 
          return `Get ${('score' in criteria && typeof criteria.score === 'number') ? criteria.score : '?'}% in the ${('module' in criteria && typeof criteria.module === 'string') ? criteria.module : '?'} module`;
        default:
          return "Unknown criteria type";
      }
    } catch (error) {
      console.error("Error rendering criteria description:", error);
      return "Error displaying criteria";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Achievements</h3>
        {!isAddingAchievement && (
          <YDButton onClick={() => setIsAddingAchievement(true)}>
            <Plus size={16} className="mr-2" /> Add Achievement
          </YDButton>
        )}
      </div>

      {isAddingAchievement && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingAchievementId ? "Edit Achievement" : "Add New Achievement"}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="achievementName">Achievement Name</Label>
              <Input
                id="achievementName"
                value={newAchievement.name}
                onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                placeholder="Enter achievement name"
              />
            </div>
            
            <div>
              <Label htmlFor="achievementDescription">Description</Label>
              <Textarea
                id="achievementDescription"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                placeholder="Enter achievement description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="criteriaType">Criteria Type</Label>
              <Select
                value={newAchievement.criteria_type}
                onValueChange={(value: CriteriaType) => setNewAchievement({ ...newAchievement, criteria_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select criteria type" />
                </SelectTrigger>
                <SelectContent>
                  {criteriaTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newAchievement.criteria_type === "lessons_per_day" && (
              <div>
                <Label htmlFor="criteriaCount">Number of Lessons</Label>
                <Input
                  id="criteriaCount"
                  type="number"
                  value={newAchievement.criteria_count}
                  onChange={(e) => setNewAchievement({ ...newAchievement, criteria_count: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            )}
            
            {(newAchievement.criteria_type === "quiz_score" || 
              newAchievement.criteria_type === "module_average" || 
              newAchievement.criteria_type === "module_score") && (
              <div>
                <Label htmlFor="criteriaScore">Required Score (%)</Label>
                <Input
                  id="criteriaScore"
                  type="number"
                  value={newAchievement.criteria_score}
                  onChange={(e) => setNewAchievement({ ...newAchievement, criteria_score: parseInt(e.target.value) || 70 })}
                  min="1"
                  max="100"
                />
              </div>
            )}
            
            {newAchievement.criteria_type === "module_score" && (
              <div>
                <Label htmlFor="criteriaModule">Module Reference</Label>
                <Input
                  id="criteriaModule"
                  value={newAchievement.criteria_module}
                  onChange={(e) => setNewAchievement({ ...newAchievement, criteria_module: e.target.value })}
                  placeholder="sales-finance"
                />
              </div>
            )}
            
            {newAchievement.criteria_type === "streak" && (
              <div>
                <Label htmlFor="criteriaDays">Number of Consecutive Days</Label>
                <Input
                  id="criteriaDays"
                  type="number"
                  value={newAchievement.criteria_days}
                  onChange={(e) => setNewAchievement({ ...newAchievement, criteria_days: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              {editingAchievementId ? (
                <YDButton onClick={handleUpdateAchievement}>Update Achievement</YDButton>
              ) : (
                <YDButton onClick={handleAddAchievement}>Add Achievement</YDButton>
              )}
              <YDButton variant="outline" onClick={resetForm}>
                Cancel
              </YDButton>
            </div>
          </div>
        </YDCard>
      )}

      <div className="space-y-4">
        {achievements.length === 0 ? (
          <YDCard>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No achievements found. Create your first achievement badge.</p>
            </div>
          </YDCard>
        ) : (
          achievements.map((achievement) => (
            <YDCard key={achievement.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="p-2 bg-primary/10 rounded-lg mr-4 flex-shrink-0">
                    <Award size={32} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">{achievement.name}</h4>
                    <p className="text-muted-foreground mt-1">{achievement.description}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Criteria: </strong>
                      {renderCriteriaDescription(achievement.criteria)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <YDButton
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditAchievement(achievement.id)}
                  >
                    <Pencil size={16} />
                  </YDButton>
                  <YDButton
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteAchievement(achievement.id)}
                  >
                    <Trash2 size={16} />
                  </YDButton>
                </div>
              </div>
            </YDCard>
          ))
        )}
      </div>
    </div>
  );
};

export default AchievementManager;
