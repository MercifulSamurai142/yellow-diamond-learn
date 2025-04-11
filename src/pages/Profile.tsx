import { useState, useEffect } from "react"; // Added useEffect if needed for formData sync
import { Camera, Save, Loader2 } from "lucide-react"; // Added Loader2
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";
import { useProfile, UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useProgress } from "@/contexts/ProgressContext";

const Profile = () => {
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile();
  const { user } = useAuth();
  // Use the progress context
  const { progressStats, isLoading: isProgressLoading } = useProgress();

  const [formData, setFormData] = useState<Partial<UserProfile> & { region?: string }>({
    name: "",
    email: "",
    role: "learner",
    region: "North India", // Default or placeholder
  });

  // Effect to update formData when profile loads/changes
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev, // Keep existing region if not in profile
        name: profile.name || "",
        email: profile.email || user?.email || "",
        role: profile.role || "learner",
        // region: profile.region || prev.region || "North India", // Uncomment if region comes from profile
      }));
    } else if (user && !profile) {
       // Set email from user if profile hasn't loaded yet but user exists
       setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [profile, user]); // Add user dependency


  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [updating, setUpdating] = useState(false);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Update profile information
  const handleSave = async () => {
    if (!profile) return;

    setUpdating(true);

    try {
      // Only update fields that exist in the profile update type
      const updateData: Partial<Pick<UserProfile, 'name' /* add other updatable fields here like 'region' if applicable */>> = {};
      if (formData.name !== profile.name) updateData.name = formData.name;
      // if (formData.region !== profile.region) updateData.region = formData.region; // Add region if updatable

      if (Object.keys(updateData).length === 0) {
         toast({ title: "No changes detected."});
         setUpdating(false);
         return;
      }

      const { error } = await updateProfile(updateData);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile.",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New passwords do not match.",
      });
      return;
    }
     if (!passwordData.newPassword || passwordData.newPassword.length < 6) { // Example minimum length
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "New password must be at least 6 characters long.",
      });
      return;
     }

    // TODO: Implement actual Supabase password update logic
    // This would involve calling supabase.auth.updateUser({ password: passwordData.newPassword })
    // You might need the current password for verification depending on your security settings
    console.log("Password change data:", passwordData); // Placeholder
    toast({
      title: "Password update initiated", // Adjust message as needed
      description: "Check your email if confirmation is required.", // Adjust message
    });

    // Reset password fields
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

   // Display loading state for the whole profile page if profile data is loading
  if (isProfileLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get initials from name for the avatar
  const getInitials = () => {
    // Ensure formData.name is used as the fallback if profile isn't loaded yet but formData has it
    const nameToUse = profile?.name || formData.name;
    if (!nameToUse) return user?.email?.[0].toUpperCase() || 'U';
    return nameToUse.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate percentages safely
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  const moduleCompletionPercentage = calculatePercentage(progressStats.completedModules, progressStats.totalModules);
  const achievementUnlockPercentage = calculatePercentage(progressStats.unlockedAchievements, progressStats.totalAchievements);


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-6">Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile sidebar */}
              <div className="md:col-span-1">
                <YDCard className="text-center">
                  {/* ... (Avatar section - no changes needed here) ... */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                      {profile?.profile_picture ? (
                        <img
                          src={profile.profile_picture}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-medium">
                          {getInitials()}
                        </div>
                      )}
                      {/* TODO: Implement profile picture upload functionality */}
                      <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90">
                        <Camera size={16} />
                      </button>
                    </div>

                    <h3 className="text-xl font-semibold">{formData.name || 'User'}</h3>
                    <p className="text-muted-foreground capitalize">{formData.role || 'Learner'}</p>

                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between text-sm py-2">
                        <span className="text-muted-foreground">Email</span>
                        <span>{formData.email || 'Not available'}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2">
                        <span className="text-muted-foreground">Region</span>
                        <span>{formData.region}</span> {/* Assuming region is in formData */}
                      </div>
                      <div className="flex justify-between text-sm py-2">
                        <span className="text-muted-foreground">Joined</span>
                        <span>
                          {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>
                </YDCard>

                {/* Progress summary - UPDATED SECTION */}
                <YDCard className="mt-6">
                  <h3 className="font-semibold mb-4">Learning Progress</h3>
                   {isProgressLoading ? (
                     <div className="space-y-4 p-4">
                       <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                       <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                       <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-2"></div>
                       <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                       <div className="h-4 bg-muted rounded w-2/3 animate-pulse mt-2"></div>
                       <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {/* Overall Course Progress */}
                       <div>
                         <div className="flex justify-between mb-1">
                           <span className="text-sm">Overall Progress</span>
                           <span className="text-sm font-medium">{progressStats.moduleProgress}%</span>
                         </div>
                         <div className="w-full bg-muted rounded-full h-2">
                           <div
                             className="bg-primary rounded-full h-2"
                             style={{ width: `${progressStats.moduleProgress}%` }} // Dynamic width
                           ></div>
                         </div>
                       </div>

                       {/* Modules Completed */}
                       <div>
                         <div className="flex justify-between mb-1">
                           <span className="text-sm">Modules Completed</span>
                           <span className="text-sm font-medium">
                             {progressStats.completedModules}/{progressStats.totalModules}
                           </span>
                         </div>
                         <div className="w-full bg-muted rounded-full h-2">
                           <div
                             className="bg-primary rounded-full h-2"
                             style={{ width: `${moduleCompletionPercentage}%` }} // Dynamic width
                           ></div>
                         </div>
                       </div>

                       {/* Achievements Unlocked */}
                       <div>
                         <div className="flex justify-between mb-1">
                           <span className="text-sm">Achievements Unlocked</span>
                           <span className="text-sm font-medium">
                             {progressStats.unlockedAchievements}/{progressStats.totalAchievements}
                           </span>
                         </div>
                         <div className="w-full bg-muted rounded-full h-2">
                           <div
                             className="bg-primary rounded-full h-2"
                             style={{ width: `${achievementUnlockPercentage}%` }} // Dynamic width
                           ></div>
                         </div>
                       </div>
                     </div>
                   )}
                </YDCard>
              </div>

              {/* Profile settings */}
              <div className="md:col-span-2">
                <YDCard>
                  <h3 className="font-semibold mb-6">Personal Information</h3>

                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          // Email changes require verification, typically done via Supabase Auth UI or specific flow
                          // onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium text-foreground">
                          Role
                        </label>
                        <input
                          id="role"
                          name="role"
                          type="text"
                          value={formData.role}
                          // Role changes might be admin-only
                          // onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="region" className="block text-sm font-medium text-foreground">
                          Region
                        </label>
                        <select // Assuming region is editable, otherwise make it disabled like 'role'
                          id="region"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="North India">North India</option>
                          <option value="South India">South India</option>
                          <option value="East India">East India</option>
                          <option value="West India">West India</option>
                          <option value="Central India">Central India</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <YDButton type="submit" disabled={updating || isProfileLoading}>
                        {updating ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
                        {updating ? "Saving..." : "Save Changes"}
                      </YDButton>
                    </div>
                  </form>
                </YDCard>

                <YDCard className="mt-6">
                  <h3 className="font-semibold mb-6">Password</h3>

                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Removed Current Password field - Supabase updateUser doesn't require it by default */}
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-2">
                         <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <YDButton variant="outline" type="submit">
                        Change Password
                      </YDButton>
                    </div>
                  </form>
                </YDCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;