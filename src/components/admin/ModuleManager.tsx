import React, { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Loader2, X } from "lucide-react";
import { Module, ModuleDesignation, ModuleRegion } from "@/pages/Admin";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ModuleManagerProps {
  modules: Module[];
  moduleDesignations: ModuleDesignation[];
  moduleRegions: ModuleRegion[];
  onModulesUpdate: (modules: Module[]) => void;
  refreshData: () => Promise<void>;
}

const REGION_OPTIONS = ["North", "South", "East", "West", "Central"];

const ModuleManager = ({ modules, moduleDesignations, moduleRegions, onModulesUpdate, refreshData }: ModuleManagerProps) => {
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    order: 1,
    video_url: null as string | null,
    language: 'english',
  });
  const [designations, setDesignations] = useState<string[]>([]);
  const [designationInput, setDesignationInput] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<{ name: string }[]>([]);
  const [isListingVideos, setIsListingVideos] = useState(false);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setVideoFile(e.target.files[0]);
    }
  };
  
  const handleDesignationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const newDesignation = designationInput.trim();
      if (newDesignation && !designations.includes(newDesignation)) {
        setDesignations([...designations, newDesignation]);
        setDesignationInput("");
      }
    }
  };

  const removeDesignation = (designationToRemove: string) => {
    setDesignations(designations.filter(d => d !== designationToRemove));
  };
  
  const handleRegionChange = (region: string, checked: boolean) => {
    setRegions(prev => checked ? [...prev, region] : prev.filter(r => r !== region));
  };

  const saveModuleDependencies = async (moduleId: string) => {
    // Delete existing designations and regions for this module
    const { error: deleteDesignationError } = await supabase.from('module_designation').delete().eq('module_id', moduleId);
    if (deleteDesignationError) throw deleteDesignationError;
    
    const { error: deleteRegionError } = await supabase.from('module_region').delete().eq('module_id', moduleId);
    if (deleteRegionError) throw deleteRegionError;

    // Insert new designations
    if (designations.length > 0) {
      const designationInserts = designations.map(d => ({ module_id: moduleId, designation: d }));
      const { error: insertDesignationError } = await supabase.from('module_designation').insert(designationInserts);
      if (insertDesignationError) throw insertDesignationError;
    }

    // Insert new regions
    if (regions.length > 0) {
      const regionInserts = regions.map(r => ({ module_id: moduleId, region: r }));
      const { error: insertRegionError } = await supabase.from('module_region').insert(regionInserts);
      if (insertRegionError) throw insertRegionError;
    }
  };

  const handleAddModule = async () => {
    try {
      if (!newModule.name) {
        toast({ title: "Error", description: "Module name is required", variant: "destructive" });
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules").insert({ ...newModule, video_url: null }).select().single();

      if (moduleError) throw moduleError;
      if (!moduleData) throw new Error("Failed to create module.");

      await saveModuleDependencies(moduleData.id);

      let finalModuleData = moduleData;

      if (videoFile) {
        setIsUploading(true);
        const filePath = `public/${moduleData.id}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage.from("module-videos").upload(filePath, videoFile, { upsert: true });
        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("module-videos").getPublicUrl(filePath);
        const { data: updatedData, error: updateError } = await supabase
          .from("modules").update({ video_url: urlData.publicUrl }).eq("id", moduleData.id).select().single();
        if (updateError) throw updateError;
        finalModuleData = updatedData;
      }

      toast({ title: "Success", description: "Module added successfully" });
      onModulesUpdate([...modules, finalModuleData]);
      cancelModuleAction();
      await refreshData();

    } catch (error: any) {
      console.error("Error adding module:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to add module: ${error.message}` });
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
    
    const currentDesignations = moduleDesignations.filter(md => md.module_id === moduleId).map(md => md.designation);
    setDesignations(currentDesignations);

    const currentRegions = moduleRegions.filter(mr => mr.module_id === moduleId).map(mr => mr.region);
    setRegions(currentRegions);
    
    setIsAddingModule(true);
    fetchAvailableVideos(moduleId);
  };
  
  const handleUpdateModule = async () => {
    if (!editingModuleId) return;

    try {
      if (!newModule.name) {
        toast({ title: "Error", description: "Module name is required", variant: "destructive" });
        return;
      }

      let finalVideoUrl = newModule.video_url;

      if (videoFile) {
        setIsUploading(true);
        const filePath = `public/${editingModuleId}/${videoFile.name}`;
        const { error: uploadError } = await supabase.storage.from("module-videos").upload(filePath, videoFile, { upsert: true });
        setIsUploading(false);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("module-videos").getPublicUrl(filePath);
        finalVideoUrl = urlData.publicUrl;
      }

      const { data: updatedModule, error } = await supabase
        .from("modules").update({ ...newModule, video_url: finalVideoUrl }).eq("id", editingModuleId).select().single();

      if (error) throw error;
      
      await saveModuleDependencies(editingModuleId);

      toast({ title: "Success", description: "Module updated successfully" });
      cancelModuleAction();
      await refreshData();
    } catch (error: any) {
      console.error("Error updating module:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to update module: ${error.message}` });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await supabase.storage.from('module-videos').remove([`public/${moduleId}`]);
      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;

      toast({ title: "Success", description: "Module deleted successfully" });
      await refreshData();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete module. Make sure there are no lessons attached to this module." });
    }
  };
  
  const fetchAvailableVideos = async (moduleId: string) => {
    setIsListingVideos(true);
    try {
      const { data, error } = await supabase.storage.from('module-videos').list(`public/${moduleId}`);
      if (error) throw error;
      setAvailableVideos(data || []);
    } catch (error) {
      console.error("Error listing module videos:", error);
      toast({ variant: 'destructive', title: 'Could not fetch video list.' });
    } finally {
      setIsListingVideos(false);
    }
  };

  const cancelModuleAction = () => {
    setIsAddingModule(false);
    setEditingModuleId(null);
    setNewModule({ name: "", description: "", order: modules.length + 1, video_url: null, language: 'english' });
    setDesignations([]);
    setDesignationInput("");
    setRegions([]);
    setVideoFile(null);
    setIsUploading(false);
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
          <h4 className="text-lg font-medium mb-4">{editingModuleId ? "Edit Module" : "Add New Module"}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module Name</Label>
                <Input value={newModule.name} onChange={(e) => setNewModule({ ...newModule, name: e.target.value })} placeholder="Enter module name" />
              </div>
              <div>
                <Label>Module Language</Label>
                <Select value={newModule.language} onValueChange={(value) => setNewModule({ ...newModule, language: value })}>
                  <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
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
              <Textarea id="moduleDescription" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} placeholder="Enter module description" rows={3} />
            </div>
            
            {/* Designations Input */}
            <div>
                <Label htmlFor="designationInput">Module Designations</Label>
                <Input 
                    id="designationInput"
                    value={designationInput} 
                    onChange={e => setDesignationInput(e.target.value)} 
                    onKeyDown={handleDesignationKeyDown}
                    placeholder="Type designation and press Enter/Tab" 
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    {designations.map(d => (
                        <Badge key={d} variant="secondary" className="flex items-center gap-1">
                            {d}
                            <button onClick={() => removeDesignation(d)} className="rounded-full hover:bg-muted-foreground/20">
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Regions Input */}
            <div>
                <Label>Module Regions</Label>
                <div className="grid grid-cols-3 gap-2 p-2 border rounded-md mt-1">
                    {REGION_OPTIONS.map(region => (
                        <div key={region} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`region-${region}`} 
                                checked={regions.includes(region)} 
                                onCheckedChange={(checked) => handleRegionChange(region, !!checked)}
                            />
                            <Label htmlFor={`region-${region}`} className="text-sm font-normal">{region}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
              <Label htmlFor="moduleVideo">Upload Module Intro Video (Optional)</Label>
              <Input id="moduleVideo" type="file" accept="video/mp4,video/webm" onChange={handleVideoFileChange} disabled={isUploading} />
              {isUploading && <p className="text-sm text-muted-foreground mt-2 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading video...</p>}
            </div>

            <div>
              <Label htmlFor="moduleOrder">Order</Label>
              <Input id="moduleOrder" type="number" value={newModule.order} onChange={(e) => setNewModule({ ...newModule, order: parseInt(e.target.value) || 1 })} min="1" />
            </div>
            
            <div className="flex space-x-2">
              <YDButton onClick={editingModuleId ? handleUpdateModule : handleAddModule}>
                {editingModuleId ? "Update Module" : "Add Module"}
              </YDButton>
              <YDButton variant="outline" onClick={cancelModuleAction}>Cancel</YDButton>
            </div>
          </div>
        </YDCard>
      )}

      <div className="space-y-4">
        {modules.length === 0 ? (
          <YDCard><div className="p-6 text-center"><p className="text-muted-foreground">No modules found.</p></div></YDCard>
        ) : (
          modules.sort((a, b) => a.order - b.order).map((module) => (
              <YDCard key={module.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-primary/20 text-primary rounded-full mr-2">{module.order}</span>
                      <h4 className="text-lg font-medium">{module.name}</h4>
                    </div>
                    <p className="text-muted-foreground mt-1">{module.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <YDButton variant="outline" size="icon" onClick={() => handleEditModule(module.id)}><Pencil size={16} /></YDButton>
                    <YDButton variant="destructive" size="icon" onClick={() => handleDeleteModule(module.id)}><Trash2 size={16} /></YDButton>
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