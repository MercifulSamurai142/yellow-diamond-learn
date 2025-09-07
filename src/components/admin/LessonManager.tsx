import React, { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
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
    module_id: "",
    video_url: null as string | null,
    language: "english",
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<{ name: string }[]>([]);
  const [isListingVideos, setIsListingVideos] = useState(false);

  // Handler for video file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };
  
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

      // Step 1: Insert lesson data without video URL
      const { data: newLessonData, error } = await supabase
        .from("lessons")
        .insert({
          title: newLesson.title,
          content: newLesson.content,
          duration_minutes: newLesson.duration_minutes,
          order: newLesson.order,
          module_id: newLesson.module_id,
          language: newLesson.language,
          video_url: null // Start with null
        })
        .select()
        .single();

      if (error) throw error;
      if (!newLessonData) throw new Error("Failed to create lesson, no data returned.");

      let finalLessonData = newLessonData;

      // Step 2: If there's a video file, upload it and update the lesson
      if (videoFile) {
        setIsUploading(true);
        const fileExtension = videoFile.name.split('.').pop();
        const filePath = `public/${newLessonData.id}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("lesson-videos")
          .upload(filePath, videoFile, { upsert: true });

        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("lesson-videos").getPublicUrl(filePath);
        
        // Step 3: Update the lesson with the new video_url
        const { data: updatedData, error: updateError } = await supabase
          .from("lessons")
          .update({ video_url: urlData.publicUrl })
          .eq("id", newLessonData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        finalLessonData = updatedData;
      }
      
      toast({
        title: "Success",
        description: "Lesson added successfully",
      });

      // Update local state
      if (finalLessonData) {
        onLessonsUpdate([...lessons, finalLessonData]);
      }

      resetForm();
      await refreshData();
    } catch (error: any) {
      console.error("Error adding lesson:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add lesson: ${error.message}`,
      });
    }
  };

  const handleEditLesson = async (lessonId: string) => {
    const lessonToEdit = lessons.find((l) => l.id === lessonId);
    if (!lessonToEdit) return;

    setEditingLessonId(lessonId);
    setNewLesson({
      title: lessonToEdit.title,
      content: lessonToEdit.content || "",
      duration_minutes: lessonToEdit.duration_minutes,
      order: lessonToEdit.order,
      module_id: lessonToEdit.module_id || "",
      video_url: lessonToEdit.video_url || null,
      language: lessonToEdit.language || "english",
    });
    setSelectedModuleId(lessonToEdit.module_id || null);
    setIsAddingLesson(true);
    fetchAvailableVideos(lessonId);
  };

  const fetchAvailableVideos = async (lessonId: string) => {
    setIsListingVideos(true);
    try {
        const { data, error } = await supabase.storage
            .from('lesson-videos')
            .list(`public/${lessonId}`);
        if (error) throw error;
        setAvailableVideos(data || []);
    } catch (error) {
        console.error("Error listing videos:", error);
        toast({ variant: 'destructive', title: 'Could not fetch video list.' });
        setAvailableVideos([]);
    } finally {
        setIsListingVideos(false);
    }
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

      let finalVideoUrl = newLesson.video_url;

      // Handle video upload if a new file is selected
      if (videoFile) {
        setIsUploading(true);
        const fileExtension = videoFile.name.split('.').pop();
        const filePath = `public/${editingLessonId}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("lesson-videos")
          .upload(filePath, videoFile, { upsert: true });

        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("lesson-videos").getPublicUrl(filePath);
        finalVideoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("lessons")
        .update({
          title: newLesson.title,
          content: newLesson.content,
          duration_minutes: newLesson.duration_minutes,
          order: newLesson.order,
          module_id: newLesson.module_id,
          language: newLesson.language,
          video_url: finalVideoUrl,
        })
        .eq("id", editingLessonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });

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

  const handleRemoveVideo = async (videoName: string) => {
    if (!editingLessonId) return;

    const isConfirmed = window.confirm(`Are you sure you want to permanently delete the video "${videoName}"? This action cannot be undone.`);
    if (!isConfirmed) return;

    const filePath = `public/${editingLessonId}/${videoName}`;
    try {
        const { error: storageError } = await supabase.storage
            .from('lesson-videos')
            .remove([filePath]);

        if (storageError) throw storageError;

        toast({ title: 'Success', description: 'Video deleted from storage.' });

        // Check if the deleted video was the active one in the database
        const { data: lessonData } = await supabase.from('lessons').select('video_url').eq('id', editingLessonId).single();
        const activeVideoUrl = lessonData?.video_url;

        const deletedVideoUrlPart = `/${filePath}`;
        // If the deleted video is the one currently saved in the DB, nullify the column
        if (activeVideoUrl && activeVideoUrl.endsWith(deletedVideoUrlPart)) {
            await supabase.from('lessons').update({ video_url: null }).eq('id', editingLessonId);
            setNewLesson(prev => ({ ...prev, video_url: null }));
        }
        
        // Refresh the list of videos in the UI
        fetchAvailableVideos(editingLessonId);
    } catch (error: any) {
        console.error("Error deleting video:", error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to delete video: ${error.message}` });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      // Before deleting from DB, remove associated video from storage
      const lessonToDelete = lessons.find(l => l.id === lessonId);
      if (lessonToDelete?.video_url) {
        try {
          const filePath = new URL(lessonToDelete.video_url).pathname.split('/lesson-videos/')[1];
          await supabase.storage.from('lesson-videos').remove([filePath]);
        } catch(storageError) {
          console.error("Failed to delete video from storage, but proceeding with DB deletion:", storageError);
        }
      }
      
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
      module_id: "",
      video_url: null,
      language: "english",
    });
    setVideoFile(null);
    setIsUploading(false);
    setSelectedModuleId(null);
    setAvailableVideos([]);
    setIsListingVideos(false);
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter((lesson) => lesson.module_id === moduleId);
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
                        Module {module.order} - {module.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lesson Title</Label>
                  <Input
                    id="lessonTitle"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Enter lesson title"
                    className="flex-grow"
                  />
                </div>
                <div>
                  <Label>Lesson Language</Label>
                  <Select
                    value={newLesson.language}
                    onValueChange={(value) => setNewLesson({ ...newLesson, language: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
              </div>
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

            <div>
              <Label htmlFor="lessonVideo">Upload Lesson Video (Optional)</Label>
                <Input
                  id="lessonVideo"
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoFileChange}
                  disabled={isUploading}
                />
              {videoFile && <p className="mt-2 text-sm text-muted-foreground">New video to upload: {videoFile.name}</p>}
              {isUploading && <p className="text-sm text-muted-foreground mt-2 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading video...</p>}
            </div>
            
            {editingLessonId && (
              <div>
                <Label>Available Videos</Label>
                {isListingVideos ? (
                  <p className="text-sm text-muted-foreground">Loading video list...</p>
                ) : availableVideos.length > 0 ? (
                  <div className="mt-2 space-y-2 rounded-md border p-2">
                    {availableVideos.map(video => (
                      <div key={video.name} className="flex items-center justify-between text-sm">
                        <span>{video.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.name)}
                          className="text-red-500 hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-sm text-muted-foreground mt-1">No videos uploaded for this lesson.</p>)}
              </div>
            )}
            
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