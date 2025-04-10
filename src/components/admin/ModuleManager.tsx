
import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
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
    order: 1
  });

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

      const { data, error } = await supabase
        .from("modules")
        .insert({
          name: newModule.name,
          description: newModule.description,
          order: newModule.order
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module added successfully",
      });

      // Update local state
      if (data) {
        onModulesUpdate([...modules, data[0]]);
      }

      // Reset form
      setNewModule({ name: "", description: "", order: modules.length + 1 });
      setIsAddingModule(false);
      await refreshData();
    } catch (error) {
      console.error("Error adding module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add module",
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
      order: moduleToEdit.order
    });
    setIsAddingModule(true);
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

      const { error } = await supabase
        .from("modules")
        .update({
          name: newModule.name,
          description: newModule.description,
          order: newModule.order
        })
        .eq("id", editingModuleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module updated successfully",
      });

      // Update local state
      const updatedModules = modules.map(module => {
        if (module.id === editingModuleId) {
          return {
            ...module,
            name: newModule.name,
            description: newModule.description,
            order: newModule.order
          };
        }
        return module;
      });
      onModulesUpdate(updatedModules);

      // Reset form
      setNewModule({ name: "", description: "", order: modules.length + 1 });
      setIsAddingModule(false);
      setEditingModuleId(null);
      await refreshData();
    } catch (error) {
      console.error("Error updating module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update module",
      });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module deleted successfully",
      });

      // Update local state
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
    setNewModule({ name: "", description: "", order: modules.length + 1 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Modules</h3>
        {!isAddingModule && (
          <YDButton onClick={() => {
            setIsAddingModule(true);
            setNewModule({ name: "", description: "", order: modules.length + 1 });
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
            <div>
              <Label htmlFor="moduleName">Module Name</Label>
              <Input
                id="moduleName"
                value={newModule.name}
                onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                placeholder="Enter module name"
              />
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
