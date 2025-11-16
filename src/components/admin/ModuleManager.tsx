// yellow-diamond-learn-dev/src/components/admin/ModuleManager.tsx
import React, { useState, useEffect } from "react";
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
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";

interface ModuleManagerProps {
  modules: Module[];
  moduleDesignations: ModuleDesignation[];
  moduleRegions: ModuleRegion[];
  englishModules: Module[]; // List of all English modules for reference
  onModulesUpdate: (modules: Module[]) => void;
  refreshData: () => Promise<void>;
}

const STATE_OPTIONS_CENTRAL = [
  "Chhattisgarh",
  "MP-1",
  "MP-2",
  "Nagpur",
];

const STATE_OPTIONS_EAST = [
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Jharkhand",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Tripura",
  "West Bengal",
];

const STATE_OPTIONS_NORTH = [
  "Delhi & NCR",
  "Eastern UP",
  "Haryana",
  "Himachal Pradesh",
  "Jammu Kashmir",
  "Punjab",
  "Rajasthan",
  "Uttarakhand",
  "West UP",
];

const STATE_OPTIONS_SOUTH = [
  "Andhra Pradesh",
  "Bangalore",
  "Karnataka",
  "Kerala",
  "Tamilnadu",
  "Telangana",
];

const STATE_OPTIONS_WEST = [
  "Gujarat - Avadh",
  "Mumbai",
  "Pune",
  "Rest of Maharashtra",
];


const ModuleManager = ({ modules, moduleDesignations, moduleRegions, englishModules, onModulesUpdate, refreshData }: ModuleManagerProps) => {
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    order: 1,
    video_url: null as string | null,
    language: 'english',
    reference_module_id: null as string | null,
  });
  const [designations, setDesignations] = useState<string[]>([]);
  const [designationInput, setDesignationInput] = useState("");
  const [states, setStates] = useState<string[]>([]); // Changed from regions to states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<{ name: string }[]>([]);
  const [isListingVideos, setIsListingVideos] = useState(false);
  const [referenceSearchQuery, setReferenceSearchQuery] = useState('');
  const [isReferenceSelectOpen, setIsReferenceSelectOpen] = useState(false);

  useEffect(() => {
    console.log("ModuleManager mounted/updated. Initial englishModules:", englishModules);
  }, [englishModules]);


  const t = {
    referenceModule: "Reference Module",
    selectReferenceModule: "Select a reference English module",
    searchModules: "Search modules...",
    noModulesFound: "No modules found.",
  };

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
  
  // Renamed to handleStateChange
  const handleStateChange = (state: string, checked: boolean) => {
    setStates(prev => checked ? [...prev, state] : prev.filter(s => s !== state));
  };

  // New handler for "Select All"
  const handleSelectAllStates = (stateOptions: string[], checked: boolean) => {
    if (checked) {
      setStates(prev => Array.from(new Set([...prev, ...stateOptions])));
    } else {
      setStates(prev => prev.filter(s => !stateOptions.includes(s)));
    }
  };

  const saveModuleDependencies = async (moduleId: string) => {
    const { error: deleteDesignationError } = await supabase.from('module_designation').delete().eq('module_id', moduleId);
    if (deleteDesignationError) throw deleteDesignationError;
    
    // Changed to module_state
    const { error: deleteStateError } = await supabase.from('module_state').delete().eq('module_id', moduleId);
    if (deleteStateError) throw deleteStateError;

    if (designations.length > 0) {
      const designationInserts = designations.map(d => ({ module_id: moduleId, designation: d }));
      const { error: insertDesignationError } = await supabase.from('module_designation').insert(designationInserts);
      if (insertDesignationError) throw insertDesignationError;
    }

    // Changed to module_state
    if (states.length > 0) {
      const stateInserts = states.map(s => ({ module_id: moduleId, state: s }));
      const { error: insertStateError } = await supabase.from('module_state').insert(stateInserts);
      if (insertStateError) throw insertStateError;
    }
  };

  const handleAddModule = async () => {
    try {
      if (!newModule.name) {
        toast({ title: "Error", description: "Module name is required", variant: "destructive" });
        return;
      }

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules").insert({ 
          ...newModule, 
          video_url: null,
          reference_module_id: newModule.reference_module_id,
        })
        .select()
        .single();

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
      reference_module_id: moduleToEdit.reference_module_id || null,
    });
    
    const currentDesignations = moduleDesignations.filter(md => md.module_id === moduleId).map(md => md.designation);
    setDesignations(currentDesignations);

    // Changed to module_state
    const { data: moduleStates, error: stateError } = await supabase.from('module_state').select('state').eq('module_id', moduleId);
    if (stateError) {
        console.error("Error fetching module states:", stateError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load module states.' });
        setStates([]);
    } else {
        setStates(moduleStates?.map(ms => ms.state) || []);
    }
    
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
        .from("modules").update({ 
          ...newModule, 
          video_url: finalVideoUrl,
          reference_module_id: newModule.reference_module_id,
        })
        .eq("id", editingModuleId)
        .select()
        .single();

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
      // Delete associated module_designation and module_state records first due to foreign key constraints
      await supabase.from('module_designation').delete().eq('module_id', moduleId);
      await supabase.from('module_state').delete().eq('module_id', moduleId); // Changed to module_state

      // Attempt to delete associated video from storage bucket
      try {
        const { data: fileList, error: listError } = await supabase.storage
          .from('module-videos')
          .list(`public/${moduleId}`);

        if (listError) throw listError;

        if (fileList && fileList.length > 0) {
          const filesToDelete = fileList.map(file => `public/${moduleId}/${file.name}`);
          const { error: storageError } = await supabase.storage
            .from('module-videos')
            .remove(filesToDelete);
          if (storageError) console.error("Error deleting module videos from storage:", storageError);
        }
      } catch (storageOpError) {
        console.warn("Could not delete module videos from storage. Continuing with DB deletion:", storageOpError);
      }
      
      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;

      toast({ title: "Success", description: "Module deleted successfully" });
      await refreshData();
    } catch (error: any) {
      console.error("Error deleting module:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to delete module: ${error.message}. Make sure there are no lessons attached to this module.` });
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
    setNewModule({ 
      name: "", 
      description: "", 
      order: modules.length + 1, 
      video_url: null, 
      language: 'english',
      reference_module_id: null,
    });
    setDesignations([]);
    setDesignationInput("");
    setStates([]); // Changed from regions to states
    setVideoFile(null);
    setIsUploading(false);
    setReferenceSearchQuery('');
    setIsReferenceSelectOpen(false);
  };

  // Pre-filter modules based on search query
  const filteredEnglishModules = englishModules.filter(m => {
    const moduleNameLower = m.name.toLowerCase();
    const searchQueryLower = referenceSearchQuery.toLowerCase();
    const isMatch = moduleNameLower.includes(searchQueryLower);
    console.log(`Filtering: Module Name: "${moduleNameLower}", Search Query: "${searchQueryLower}", Includes: ${isMatch}`);
    return isMatch;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Modules</h3>
        {!isAddingModule && (
          <YDButton onClick={() => {
            setIsAddingModule(true);
            setNewModule({ // Reset to default when adding new
              name: "",
              description: "",
              order: modules.length + 1,
              video_url: null,
              language: 'english',
              reference_module_id: null,
            });
          }}>
            <Plus size={16} className="mr-2" /> Add Module
          </YDButton>
        )}
      </div>

      {isAddingModule && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">{editingModuleId ? "Edit Module" : "Add New Module"}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Module Name</Label>
                <Input value={newModule.name} onChange={(e) => setNewModule({ ...newModule, name: e.target.value })} placeholder="Enter module name" />
              </div>
              <div>
                <Label>Module Language</Label>
                <Select value={newModule.language} onValueChange={(value) => setNewModule({ ...newModule, language: value, reference_module_id: value === 'english' ? null : newModule.reference_module_id })}>
                  <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Reference Module Dropdown */}
            {newModule.language !== "english" && (
                <div className="space-y-2">
                    <Label htmlFor="referenceModule">{t.referenceModule}</Label>
                    <Select
                        open={isReferenceSelectOpen}
                        onOpenChange={setIsReferenceSelectOpen}
                        value={newModule.reference_module_id || ""}
                        onValueChange={(value) => {
                            setNewModule({ ...newModule, reference_module_id: value });
                            setIsReferenceSelectOpen(false);
                        }}
                        disabled={newModule.language === "english"}
                    >
                        <SelectTrigger id="referenceModule">
                            <SelectValue placeholder={t.selectReferenceModule}>
                                {newModule.reference_module_id
                                    ? englishModules.find(m => m.id === newModule.reference_module_id)?.name || t.selectReferenceModule
                                    : t.selectReferenceModule}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <Command>
                                <CommandInput placeholder={t.searchModules} value={referenceSearchQuery} onValueChange={setReferenceSearchQuery} />
                                <CommandList>
                                    {/* Conditional rendering of CommandEmpty based on filteredEnglishModules */}
                                    {filteredEnglishModules.length === 0 ? (
                                        <CommandEmpty>{t.noModulesFound}</CommandEmpty>
                                    ) : (
                                        filteredEnglishModules.map((module) => (
                                            <CommandItem
                                                key={module.id}
                                                value={module.id}
                                                onSelect={(currentValue) => {
                                                    setNewModule(prev => ({
                                                        ...prev,
                                                        reference_module_id: currentValue === prev.reference_module_id ? null : currentValue,
                                                    }));
                                                    setReferenceSearchQuery("");
                                                    setIsReferenceSelectOpen(false);
                                                }}
                                            >
                                                {module.name}
                                            </CommandItem>
                                        ))
                                    )}
                                </CommandList>
                            </Command>
                        </SelectContent>
                    </Select>
                </div>
            )}

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

            {/* States Input - Changed from Regions */}
            <div>
                <Label className="mb-2">Module States</Label>
                <div className="space-y-4 p-2 border rounded-md">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">Central</h5>
                            <YDButton 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAllStates(STATE_OPTIONS_CENTRAL, !STATE_OPTIONS_CENTRAL.every(state => states.includes(state)))}
                            >
                                {STATE_OPTIONS_CENTRAL.every(state => states.includes(state)) ? "Unselect All" : "Select All"}
                            </YDButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS_CENTRAL.map(stateOption => (
                                <div key={stateOption} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`state-${stateOption}`} 
                                        checked={states.includes(stateOption)} 
                                        onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                    />
                                    <Label htmlFor={`state-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">East</h5>
                            <YDButton 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAllStates(STATE_OPTIONS_EAST, !STATE_OPTIONS_EAST.every(state => states.includes(state)))}
                            >
                                {STATE_OPTIONS_EAST.every(state => states.includes(state)) ? "Unselect All" : "Select All"}
                            </YDButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS_EAST.map(stateOption => (
                                <div key={stateOption} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`state-${stateOption}`} 
                                        checked={states.includes(stateOption)} 
                                        onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                    />
                                    <Label htmlFor={`state-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">North</h5>
                            <YDButton 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAllStates(STATE_OPTIONS_NORTH, !STATE_OPTIONS_NORTH.every(state => states.includes(state)))}
                            >
                                {STATE_OPTIONS_NORTH.every(state => states.includes(state)) ? "Unselect All" : "Select All"}
                            </YDButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS_NORTH.map(stateOption => (
                                <div key={stateOption} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`state-${stateOption}`} 
                                        checked={states.includes(stateOption)} 
                                        onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                    />
                                    <Label htmlFor={`state-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">South</h5>
                            <YDButton 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAllStates(STATE_OPTIONS_SOUTH, !STATE_OPTIONS_SOUTH.every(state => states.includes(state)))}
                            >
                                {STATE_OPTIONS_SOUTH.every(state => states.includes(state)) ? "Unselect All" : "Select All"}
                            </YDButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS_SOUTH.map(stateOption => (
                                <div key={stateOption} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`state-${stateOption}`} 
                                        checked={states.includes(stateOption)} 
                                        onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                    />
                                    <Label htmlFor={`state-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">West</h5>
                            <YDButton 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectAllStates(STATE_OPTIONS_WEST, !STATE_OPTIONS_WEST.every(state => states.includes(state)))}
                            >
                                {STATE_OPTIONS_WEST.every(state => states.includes(state)) ? "Unselect All" : "Select All"}
                            </YDButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {STATE_OPTIONS_WEST.map(stateOption => (
                                <div key={stateOption} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`state-${stateOption}`} 
                                        checked={states.includes(stateOption)} 
                                        onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                    />
                                    <Label htmlFor={`state-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
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
                      {module.language !== 'english' && module.reference_module_id && (
                        <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          Ref: {englishModules.find(m => m.id === module.reference_module_id)?.name || 'Unknown'}
                        </span>
                      )}
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