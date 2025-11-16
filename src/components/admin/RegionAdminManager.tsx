// yellow-diamond-learn-dev/src/components/admin/RegionAdminManager.tsx
import React, { useState, useEffect, useMemo } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, User, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tables } from "@/integrations/supabase/types";

// Re-using the state options from ModuleManager for consistency
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

type RegionAdminUser = Tables<"users">;
type RegionAdminState = Tables<"region_admin_state">;

interface RegionAdminManagerProps {
  // We'll manage state internally, so these props are not needed
  // from a parent like Admin.tsx.
  // We'll refetch all data when this component mounts or an action is performed.
}

const RegionAdminManager = ({}: RegionAdminManagerProps) => {
  const [regionAdmins, setRegionAdmins] = useState<RegionAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [initialStates, setInitialStates] = useState<string[]>([]); // To track original states for comparison
  const [currentAdminDetails, setCurrentAdminDetails] = useState<Partial<RegionAdminUser> | null>(null); // To display admin details
  const [isSaving, setIsSaving] = useState(false); // New state for save button loading

  const allStateOptions = useMemo(() => [
    ...STATE_OPTIONS_CENTRAL,
    ...STATE_OPTIONS_EAST,
    ...STATE_OPTIONS_NORTH,
    ...STATE_OPTIONS_SOUTH,
    ...STATE_OPTIONS_WEST,
  ], []);

  const fetchRegionAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'region admin')
        .order('name');

      if (error) throw error;
      setRegionAdmins(data || []);
    } catch (error: any) {
      console.error("Error fetching region admins:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load region administrators: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionAdmins();
  }, []);

  const handleEditAdmin = async (adminId: string) => {
    const adminToEdit = regionAdmins.find(admin => admin.id === adminId);
    if (!adminToEdit) return;

    setEditingAdminId(adminId);
    setCurrentAdminDetails(adminToEdit);

    try {
      const { data, error } = await supabase
        .from('region_admin_state')
        .select('state')
        .eq('id', adminId);

      if (error) throw error;

      const states = data.map(row => row.state);
      setSelectedStates(states);
      setInitialStates(states); // Store initial states
    } catch (error: any) {
      console.error("Error fetching admin states:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load states for admin: ${error.message}`,
      });
      setSelectedStates([]);
      setInitialStates([]);
    }
  };

  const handleStateChange = (state: string, checked: boolean) => {
    setSelectedStates(prev =>
      checked ? [...prev, state] : prev.filter(s => s !== state)
    );
  };

  const handleSelectAllStates = (stateOptions: string[], checked: boolean) => {
    if (checked) {
      setSelectedStates(prev => Array.from(new Set([...prev, ...stateOptions])));
    } else {
      setSelectedStates(prev => prev.filter(s => !stateOptions.includes(s)));
    }
  };

  const handleSaveStates = async () => {
    if (!editingAdminId) return;

    setIsSaving(true);
    try {
      // Determine added and removed states
      const statesToAdd = selectedStates.filter(state => !initialStates.includes(state));
      const statesToRemove = initialStates.filter(state => !selectedStates.includes(state));

      if (statesToAdd.length > 0) {
        const insertData = statesToAdd.map(state => ({ id: editingAdminId, state }));
        const { error: insertError } = await supabase
          .from('region_admin_state')
          .insert(insertData);
        if (insertError) throw insertError;
      }

      if (statesToRemove.length > 0) {
        // Delete operations need to match on all primary key columns
        for (const state of statesToRemove) {
          const { error: deleteError } = await supabase
            .from('region_admin_state')
            .delete()
            .eq('id', editingAdminId)
            .eq('state', state);
          if (deleteError) throw deleteError;
        }
      }

      toast({
        title: "Success",
        description: "Region admin's states updated successfully.",
      });
      cancelEdit();
      fetchRegionAdmins(); // Re-fetch all region admins and their states
    } catch (error: any) {
      console.error("Error updating admin states:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update states: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingAdminId(null);
    setSelectedStates([]);
    setInitialStates([]);
    setCurrentAdminDetails(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Region Admin State Manager</h3>
        <YDButton onClick={fetchRegionAdmins} disabled={isLoading || isSaving}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Data
        </YDButton>
      </div>

      {editingAdminId && currentAdminDetails && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Edit States for {currentAdminDetails.name || currentAdminDetails.email}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminName">Name</Label>
                <Input id="adminName" value={currentAdminDetails.name || ''} disabled />
              </div>
              <div>
                <Label htmlFor="adminEmail">Email</Label>
                <Input id="adminEmail" value={currentAdminDetails.email || ''} disabled />
              </div>
            </div>

            <div className="space-y-4 p-2 border rounded-md">
              <Label className="mb-2 block">Assigned States</Label>

              {/* Central States */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-sm">Central</h5>
                      <YDButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllStates(STATE_OPTIONS_CENTRAL, !STATE_OPTIONS_CENTRAL.every(state => selectedStates.includes(state)))}
                          disabled={isSaving}
                      >
                          {STATE_OPTIONS_CENTRAL.every(state => selectedStates.includes(state)) ? "Unselect All" : "Select All"}
                      </YDButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {STATE_OPTIONS_CENTRAL.map(stateOption => (
                          <div key={stateOption} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`state-central-${stateOption}`} 
                                  checked={selectedStates.includes(stateOption)} 
                                  onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                  disabled={isSaving}
                              />
                              <Label htmlFor={`state-central-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                          </div>
                      ))}
                  </div>
              </div>

              {/* East States */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-sm">East</h5>
                      <YDButton 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAllStates(STATE_OPTIONS_EAST, !STATE_OPTIONS_EAST.every(state => selectedStates.includes(state)))}
                          disabled={isSaving}
                      >
                          {STATE_OPTIONS_EAST.every(state => selectedStates.includes(state)) ? "Unselect All" : "Select All"}
                      </YDButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {STATE_OPTIONS_EAST.map(stateOption => (
                          <div key={stateOption} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`state-east-${stateOption}`} 
                                  checked={selectedStates.includes(stateOption)} 
                                  onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                  disabled={isSaving}
                              />
                              <Label htmlFor={`state-east-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                          </div>
                      ))}
                  </div>
              </div>

              {/* North States */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-sm">North</h5>
                      <YDButton 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAllStates(STATE_OPTIONS_NORTH, !STATE_OPTIONS_NORTH.every(state => selectedStates.includes(state)))}
                          disabled={isSaving}
                      >
                          {STATE_OPTIONS_NORTH.every(state => selectedStates.includes(state)) ? "Unselect All" : "Select All"}
                      </YDButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {STATE_OPTIONS_NORTH.map(stateOption => (
                          <div key={stateOption} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`state-north-${stateOption}`} 
                                  checked={selectedStates.includes(stateOption)} 
                                  onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                  disabled={isSaving}
                              />
                              <Label htmlFor={`state-north-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                          </div>
                      ))}
                  </div>
              </div>

              {/* South States */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-sm">South</h5>
                      <YDButton 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAllStates(STATE_OPTIONS_SOUTH, !STATE_OPTIONS_SOUTH.every(state => selectedStates.includes(state)))}
                          disabled={isSaving}
                      >
                          {STATE_OPTIONS_SOUTH.every(state => selectedStates.includes(state)) ? "Unselect All" : "Select All"}
                      </YDButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {STATE_OPTIONS_SOUTH.map(stateOption => (
                          <div key={stateOption} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`state-south-${stateOption}`} 
                                  checked={selectedStates.includes(stateOption)} 
                                  onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                  disabled={isSaving}
                              />
                              <Label htmlFor={`state-south-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                          </div>
                      ))}
                  </div>
              </div>

              {/* West States */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-sm">West</h5>
                      <YDButton 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAllStates(STATE_OPTIONS_WEST, !STATE_OPTIONS_WEST.every(state => selectedStates.includes(state)))}
                          disabled={isSaving}
                      >
                          {STATE_OPTIONS_WEST.every(state => selectedStates.includes(state)) ? "Unselect All" : "Select All"}
                      </YDButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {STATE_OPTIONS_WEST.map(stateOption => (
                          <div key={stateOption} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`state-west-${stateOption}`} 
                                  checked={selectedStates.includes(stateOption)} 
                                  onCheckedChange={(checked) => handleStateChange(stateOption, !!checked)}
                                  disabled={isSaving}
                              />
                              <Label htmlFor={`state-west-${stateOption}`} className="text-sm font-normal">{stateOption}</Label>
                          </div>
                      ))}
                  </div>
              </div>

            </div>

            <div className="flex space-x-2 mt-6">
              <YDButton onClick={handleSaveStates} disabled={isSaving}>
                {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                Save Changes
              </YDButton>
              <YDButton variant="outline" onClick={cancelEdit} disabled={isSaving}>
                <X size={16} className="mr-2" /> Cancel
              </YDButton>
            </div>
          </div>
        </YDCard>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {regionAdmins.length === 0 ? (
            <YDCard>
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No region administrators found.</p>
              </div>
            </YDCard>
          ) : (
            regionAdmins.map((admin) => (
              <YDCard key={admin.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 w-full">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{admin.name || 'Unnamed Admin'}</h4>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <p className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 capitalize inline-block mt-1">
                        {admin.role}
                      </p>
                      {admin.psl_id && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize inline-block mt-1 ml-2">
                              {admin.psl_id}
                          </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <YDButton variant="outline" size="sm" onClick={() => handleEditAdmin(admin.id)}>
                      <Pencil size={16} className="mr-1" /> Edit States
                    </YDButton>
                  </div>
                </div>
              </YDCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RegionAdminManager;