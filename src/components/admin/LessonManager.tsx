
import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Module, Lesson } from "@/pages/Admin";

interface LessonManagerProps {
  lessons: Lesson[];
  modules: Module[];
  onLessonsUpdate: (lessons: Lesson[]) => void;
  refreshData: () => Promise<void>;
}

const LessonManager = ({ lessons, modules, onLessonsUpdate, refreshData }: LessonManagerProps) => {
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: "",
    content: "",
    duration_minutes: 15,
    order: 1,
    module_id: ""
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const handleAddLesson = async () => {
    try {
      if (!newLesson.title || !newLesson.module_id) {
        toast({
          title: "Error",
          description: "Lesson title and module are required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          title: newLesson.title,
          content: newLesson.content,
          duration_minutes: newLesson.duration_minutes,
          order: newLesson.order,
          module_id: newLesson.module_id
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson added successfully",
      });

      // Update local state
      if (data) {
        onLessonsUpdate([...lessons, data[0]]);
      }

      // Reset form
      resetForm();
      await refreshData();
    } catch (error) {
      console.error("Error adding lesson:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add lesson",
      });
    }
  };

  const handleEditLesson = async (lessonId: string) => {
    const lessonToEdit = lessons.find(l => l.id === lessonId);
    if (!lessonToEdit) return;

    setEditingLessonId(lessonId);
    setNewLesson({
      title: lessonToEdit.title,
      content: lessonToEdit.content || "",
      duration_minutes: lessonToEdit.duration_minutes,
      order: lessonToEdit.order,
      module_id: lessonToEdit.module_id || ""
    });
    setSelectedModuleId(lessonToEdit.module_id || null);
    setIsAddingLesson(true);
  };

  const handleUpdateLesson = async () => {
    if (!editingLessonId) return;

    try {
      if (!newLesson.title || !newLesson.module_id) {
        toast({
          title: "Error",
          description: "Lesson title and module are required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("lessons")
        .update({
          title: newLesson.title,
          content: newLesson.content,
          duration_minutes: newLesson.duration_minutes,
          order: newLesson.order,
          module_id: newLesson.module_id
        })
        .eq("id", editingLessonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });

      // Update local state
      const updatedLessons = lessons.map(lesson => {
        if (lesson.id === editingLessonId) {
          return {
            ...lesson,
            title: newLesson.title,
            content: newLesson.content,
            duration_minutes: newLesson.duration_minutes,
            order: newLesson.order,
            module_id: newLesson.module_id
          };
        }
        return lesson;
      });
      onLessonsUpdate(updatedLessons);

      // Reset form
      resetForm();
      await refreshData();
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lesson",
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });

      // Update local state
      onLessonsUpdate(lessons.filter(lesson => lesson.id !== lessonId));
      await refreshData();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete lesson. Make sure there are no quizzes attached to this lesson.",
      });
    }
  };

  const resetForm = () => {
    setIsAddingLesson(false);
    setEditingLessonId(null);
    setNewLesson({
      title: "",
      content: "",
      duration_minutes: 15,
      order: 1,
      module_id: ""
    });
    setSelectedModuleId(null);
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(lesson => lesson.module_id === moduleId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Lessons</h3>
        {!isAddingLesson && (
          <YDButton onClick={() => setIsAddingLesson(true)}>
            <Plus size={16} className="mr-2" /> Add Lesson
          </YDButton>
        )}
      </div>

      {isAddingLesson && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingLessonId ? "Edit Lesson" : "Add New Lesson"}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lessonModule">Module</Label>
              <Select
                value={newLesson.module_id}
                onValueChange={(value) => {
                  setNewLesson({ 
                    ...newLesson, 
                    module_id: value,
                    order: getModuleLessons(value).length + 1
                  });
                  setSelectedModuleId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules
                    .sort((a, b) => a.order - b.order)
                    .map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lessonTitle">Lesson Title</Label>
              <Input
                id="lessonTitle"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            
            <div>
              <Label htmlFor="lessonContent">Content (HTML supported)</Label>
              <Textarea
                id="lessonContent"
                value={newLesson.content || ""}
                onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                placeholder="Enter lesson content"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lessonDuration">Duration (minutes)</Label>
                <Input
                  id="lessonDuration"
                  type="number"
                  value={newLesson.duration_minutes}
                  onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: parseInt(e.target.value) || 15 })}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="lessonOrder">Order</Label>
                <Input
                  id="lessonOrder"
                  type="number"
                  value={newLesson.order}
                  onChange={(e) => setNewLesson({ ...newLesson, order: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              {editingLessonId ? (
                <YDButton onClick={handleUpdateLesson}>Update Lesson</YDButton>
              ) : (
                <YDButton onClick={handleAddLesson}>Add Lesson</YDButton>
              )}
              <YDButton variant="outline" onClick={resetForm}>
                Cancel
              </YDButton>
            </div>
          </div>
        </YDCard>
      )}

      <div className="space-y-6">
        {modules.length === 0 ? (
          <YDCard>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No modules found. Create a module first before adding lessons.</p>
            </div>
          </YDCard>
        ) : (
          modules
            .sort((a, b) => a.order - b.order)
            .map((module) => {
              const moduleLessons = lessons.filter(lesson => lesson.module_id === module.id);
              
              return (
                <div key={module.id}>
                  <h4 className="text-md font-medium text-muted-foreground mb-2">
                    Module {module.order}: {module.name}
                  </h4>
                  
                  {moduleLessons.length === 0 ? (
                    <YDCard>
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No lessons found for this module.</p>
                      </div>
                    </YDCard>
                  ) : (
                    <div className="space-y-2">
                      {moduleLessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <YDCard key={lesson.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-primary/20 text-primary rounded-full mr-2">
                                    {lesson.order}
                                  </span>
                                  <h4 className="font-medium">{lesson.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{lesson.duration_minutes} minutes</p>
                              </div>
                              <div className="flex space-x-2">
                                <YDButton
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditLesson(lesson.id)}
                                >
                                  <Pencil size={16} />
                                </YDButton>
                                <YDButton
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                  <Trash2 size={16} />
                                </YDButton>
                              </div>
                            </div>
                          </YDCard>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default LessonManager;
