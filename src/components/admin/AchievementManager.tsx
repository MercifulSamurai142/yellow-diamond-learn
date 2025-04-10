
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

interface AchievementManagerProps {
  achievements: Achievement[];
  onAchievementsUpdate: (achievements: Achievement[]) => void;
  refreshData: () => Promise<void>;
}

const AchievementManager = ({ achievements, onAchievementsUpdate, refreshData }: AchievementManagerProps) => {
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState({
    name: "",
    description: "",
    criteria_type: "lessons_per_day", // Default criteria type
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
  ];

  const buildCriteriaJson = () => {
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
      default:
        return { type: "lessons_per_day", count: 5 };
    }
  };

  const parseCriteriaJson = (criteria: any) => {
    if (!criteria) return;
    
    setNewAchievement(prev => ({
      ...prev,
      criteria_type: criteria.type || "lessons_per_day",
      criteria_count: criteria.count || 5,
      criteria_score: criteria.score || 80,
      criteria_module: criteria.module || "",
      criteria_days: criteria.days || 5
    }));
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
          criteria: criteriaJson
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement added successfully",
      });

      // Update local state
      if (data) {
        onAchievementsUpdate([...achievements, data[0]]);
      }

      // Reset form
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
    
    // Parse criteria JSON
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
          criteria: criteriaJson
        })
        .eq("id", editingAchievementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement updated successfully",
      });

      // Update local state
      const updatedAchievements = achievements.map(achievement => {
        if (achievement.id === editingAchievementId) {
          return {
            ...achievement,
            name: newAchievement.name,
            description: newAchievement.description,
            criteria: criteriaJson
          };
        }
        return achievement;
      });
      onAchievementsUpdate(updatedAchievements);

      // Reset form
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

      // Update local state
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
                onValueChange={(value) => setNewAchievement({ ...newAchievement, criteria_type: value })}
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
            
            {/* Dynamic fields based on criteria type */}
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
            
            {["quiz_score", "module_average", "module_score"].includes(newAchievement.criteria_type) && (
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
                      {achievement.criteria && achievement.criteria.type === 'lessons_per_day' && 
                        `Complete ${achievement.criteria.count} lessons in a day`}
                      {achievement.criteria && achievement.criteria.type === 'complete_module' && 
                        `Complete a full module`}
                      {achievement.criteria && achievement.criteria.type === 'quiz_score' && 
                        `Get a ${achievement.criteria.score}% score on a quiz`}
                      {achievement.criteria && achievement.criteria.type === 'module_average' && 
                        `Average ${achievement.criteria.score}% score across all modules`}
                      {achievement.criteria && achievement.criteria.type === 'streak' && 
                        `Login and complete lessons for ${achievement.criteria.days} consecutive days`}
                      {achievement.criteria && achievement.criteria.type === 'module_score' && 
                        `Get ${achievement.criteria.score}% in the ${achievement.criteria.module} module`}
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
