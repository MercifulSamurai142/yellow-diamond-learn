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
import { Module } from "@/pages/Admin";

interface ModuleManagerProps {
  modules: Module[];
  onModulesUpdate: (modules: Module[]) => void;
  refreshData: () => Promise<void>;
}

const ModuleManager = ({ modules, onModulesUpdate, refreshData }: ModuleManagerProps) => {
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    order: 1,
    video_url: null as string | null,
    language: 'english',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<{ name: string }[]>([]);
  const [isListingVideos, setIsListingVideos] = useState(false);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleAddModule = async () => {
    try {
      if (!newModule.name) {
        toast({
          title: "Error",
          description: "Module name is required",
          variant: "destructive",
        });
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .insert({
          name: newModule.name,
          description: newModule.description,
          order: newModule.order,
          language: newModule.language,
          video_url: null
        })
        .select()
        .single();

      if (moduleError) throw moduleError;
      if (!moduleData) throw new Error("Failed to create module.");

      let finalModuleData = moduleData;

      if (videoFile) {
        setIsUploading(true);
        const fileExtension = videoFile.name.split('.').pop();
        const filePath = `public/${moduleData.id}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("module-videos")
          .upload(filePath, videoFile, { upsert: true });
        
        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("module-videos").getPublicUrl(filePath);

        const { data: updatedData, error: updateError } = await supabase
          .from("modules")
          .update({ video_url: urlData.publicUrl })
          .eq("id", moduleData.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        finalModuleData = updatedData;
      }

      toast({
        title: "Success",
        description: "Module added successfully",
      });
      
      onModulesUpdate([...modules, finalModuleData]);
      cancelModuleAction();
      await refreshData();

    } catch (error: any) {
      console.error("Error adding module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add module: ${error.message}`,
      });
    }
  };

  const handleEditModule = async (moduleId: string) => {
    const moduleToEdit = modules.find(m => m.id === moduleId);
    if (!moduleToEdit) return;

    setEditingModuleId(moduleId);
    setNewModule({
      name: moduleToEdit.name,
      description: moduleToEdit.description || "",
      order: moduleToEdit.order,
      video_url: moduleToEdit.video_url || null,
      language: moduleToEdit.language || "english",
    });
    setIsAddingModule(true);
    fetchAvailableVideos(moduleId);
  };
  
  const fetchAvailableVideos = async (moduleId: string) => {
    setIsListingVideos(true);
    try {
        const { data, error } = await supabase.storage
            .from('module-videos')
            .list(`public/${moduleId}`);
        if (error) throw error;
        setAvailableVideos(data || []);
    } catch (error) {
        console.error("Error listing module videos:", error);
        toast({ variant: 'destructive', title: 'Could not fetch video list.' });
        setAvailableVideos([]);
    } finally {
        setIsListingVideos(false);
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModuleId) return;

    try {
      if (!newModule.name) {
        toast({
          title: "Error",
          description: "Module name is required",
          variant: "destructive",
        });
        return;
      }

      let finalVideoUrl = newModule.video_url;

      if (videoFile) {
        setIsUploading(true);
        const fileExtension = videoFile.name.split('.').pop();
        const filePath = `public/${editingModuleId}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("module-videos")
          .upload(filePath, videoFile, { upsert: true });
        
        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("module-videos").getPublicUrl(filePath);
        finalVideoUrl = urlData.publicUrl;
      }

      const { data: updatedModule, error } = await supabase
        .from("modules")
        .update({
          name: newModule.name,
          description: newModule.description,
          order: newModule.order,
          language: newModule.language,
          video_url: finalVideoUrl,
        })
        .eq("id", editingModuleId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module updated successfully",
      });

      const updatedModules = modules.map(module => 
        module.id === editingModuleId ? updatedModule : module
      );
      onModulesUpdate(updatedModules);
      
      cancelModuleAction();
      await refreshData();
    } catch (error: any) {
      console.error("Error updating module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update module: ${error.message}`,
      });
    }
  };
  
  const handleRemoveVideo = async (videoName: string) => {
    if (!editingModuleId) return;

    const isConfirmed = window.confirm(`Are you sure you want to permanently delete the video "${videoName}"? This action cannot be undone.`);
    if (!isConfirmed) return;

    try {
      const filePath = `public/${editingModuleId}/${videoName}`;
      const { error } = await supabase.storage.from('module-videos').remove([filePath]);
      
      if (error) throw error;
      
      const { data: moduleData } = await supabase.from('modules').select('video_url').eq('id', editingModuleId).single();
      const activeVideoUrl = moduleData?.video_url;

      const deletedVideoUrlPart = `/${filePath}`;
      if (activeVideoUrl && activeVideoUrl.endsWith(deletedVideoUrlPart)) {
          await supabase.from('modules').update({ video_url: null }).eq('id', editingModuleId);
          setNewModule(prev => ({ ...prev, video_url: null }));
      }
      
      toast({ title: "Video Removed", description: "The video file has been deleted." });
      fetchAvailableVideos(editingModuleId);

    } catch(err: any) {
      console.error("Error removing video:", err);
      toast({ variant: 'destructive', title: 'Error', description: `Could not remove video: ${err.message}` });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('module-videos')
        .list(`public/${moduleId}`);
      
      if (listError) throw listError;
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `public/${moduleId}/${file.name}`);
        await supabase.storage.from('module-videos').remove(filePaths);
      }

      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module and its videos deleted successfully",
      });

      onModulesUpdate(modules.filter(module => module.id !== moduleId));
      await refreshData();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete module. Make sure there are no lessons attached to this module.",
      });
    }
  };

  const cancelModuleAction = () => {
    setIsAddingModule(false);
    setEditingModuleId(null);
    setNewModule({ name: "", description: "", order: modules.length + 1, video_url: null, language: 'english' });
    setVideoFile(null);
    setIsUploading(false);
    setAvailableVideos([]);
    setIsListingVideos(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Modules</h3>
        {!isAddingModule && (
          <YDButton onClick={() => {
            setIsAddingModule(true);
            setNewModule({ name: "", description: "", order: modules.length + 1, video_url: null, language: 'english' });
          }}>
            <Plus size={16} className="mr-2" /> Add Module
          </YDButton>
        )}
      </div>

      {isAddingModule && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingModuleId ? "Edit Module" : "Add New Module"}
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module Name</Label>
                <Input
                  id="moduleName"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  placeholder="Enter module name"
                />
              </div>
              <div>
                <Label>Module Language</Label>
                <Select value={newModule.language} onValueChange={(value) => setNewModule({ ...newModule, language: value })}>
                  <SelectTrigger>
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
            
            <div>
              <Label htmlFor="moduleDescription">Description</Label>
              <Textarea
                id="moduleDescription"
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                placeholder="Enter module description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="moduleVideo">Upload Module Intro Video (Optional)</Label>
              <Input
                id="moduleVideo"
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoFileChange}
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-muted-foreground mt-2 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading video...</p>}
              {videoFile && <p className="mt-2 text-sm text-muted-foreground">New video to upload: {videoFile.name}</p>}
            </div>

            {editingModuleId && (
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
                ) : (<p className="text-sm text-muted-foreground mt-1">No videos uploaded for this module.</p>)}
              </div>
            )}
            
            <div>
              <Label htmlFor="moduleOrder">Order</Label>
              <Input
                id="moduleOrder"
                type="number"
                value={newModule.order}
                onChange={(e) => setNewModule({ ...newModule, order: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div className="flex space-x-2">
              {editingModuleId ? (
                <YDButton onClick={handleUpdateModule}>Update Module</YDButton>
              ) : (
                <YDButton onClick={handleAddModule}>Add Module</YDButton>
              )}
              <YDButton variant="outline" onClick={cancelModuleAction}>
                Cancel
              </YDButton>
            </div>
          </div>
        </YDCard>
      )}

      <div className="space-y-4">
        {modules.length === 0 ? (
          <YDCard>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No modules found. Create your first module.</p>
            </div>
          </YDCard>
        ) : (
          modules
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <YDCard key={module.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-primary/20 text-primary rounded-full mr-2">
                        {module.order}
                      </span>
                      <h4 className="text-lg font-medium">{module.name}</h4>
                    </div>
                    <p className="text-muted-foreground mt-1">{module.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <YDButton
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditModule(module.id)}
                    >
                      <Pencil size={16} />
                    </YDButton>
                    <YDButton
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteModule(module.id)}
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

export default ModuleManager;