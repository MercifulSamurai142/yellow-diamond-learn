// yellow-diamond-learn-main/src/pages/Profile.tsx
import { useState, useEffect, useRef, useContext } from "react";
import { Camera, Save, Loader2, Eye, EyeOff } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";
import { useProfile, UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useProgress } from "@/contexts/ProgressContext";
import { LanguageContext, Language } from "@/contexts/LanguageContext"; // Import Language and useLanguage
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components


// Translation object
const translations = {
  english: {
    profile: "Profile",
    personalInformation: "Personal Information",
    fullName: "Full Name",
    pslId: "PSL-ID",
    emailAddress: "Email Address",
    role: "Role",
    region: "Region",
    state: "State",
    designation: "Designation",
    language: "Language", // Added translation
    email: "Email",
    joined: "Joined",
    learningProgress: "Learning Progress",
    overallProgress: "Overall Progress",
    modulesCompleted: "Modules Completed",
    achievementsUnlocked: "Achievements Unlocked",
    password: "Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePassword: "Change Password",
    saveChanges: "Save Changes",
    updateProfile: "Update Profile",
    fetching: "Fetching...",
    saving: "Saving...",
    user: "User",
    learner: "Learner",
    notAvailable: "Not available",
    recent: "Recent",
    changeProfilePicture: "Change profile picture",
    deleteProfilePicture: "Delete profile picture"
  },
  hindi: {
    profile: "प्रोफाइल",
    personalInformation: "व्यक्तिगत जानकारी",
    fullName: "पूरा नाम",
    pslId: "पीएसएल-आईडी",
    emailAddress: "ईमेल पता",
    role: "भूमिका",
    region: "क्षेत्र",
    state: "राज्य",
    designation: "पदनाम",
    language: "भाषा", // Added translation
    email: "ईमेल",
    joined: "शामिल हुआ",
    learningProgress: "सीखने की प्रगति",
    overallProgress: "समग्र प्रगति",
    modulesCompleted: "मॉड्यूल पूरे किए गए",
    achievementsUnlocked: "उपलब्धियां अनलॉक की गईं",
    password: "पासवर्ड",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    changePassword: "पासवर्ड बदलें",
    saveChanges: "परिवर्तन सहेजें",
    updateProfile: "प्रोफ़ाइल अपडेट करें",
    fetching: "ला रहा है...",
    saving: "सहेज रहा है...",
    user: "उपयोगकर्ता",
    learner: "शिक्षार्थी",
    notAvailable: "उपलब्ध नहीं",
    recent: "हाल ही में",
    changeProfilePicture: "प्रोफाइल चित्र बदलें",
    deleteProfilePicture: "प्रोफाइल चित्र हटाएं"
  },
  kannada: {
    profile: "ಪ್ರೊಫೈಲ್",
    personalInformation: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ",
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    pslId: "ಪಿಎಸ್‌ಎಲ್-ಐಡಿ",
    emailAddress: "ಇಮೇಲ್ ವಿಳಾಸ",
    role: "ಪಾತ್ರ",
    region: "ಪ್ರದೇಶ",
    state: "ರಾಜ್ಯ",
    designation: "ಹುದ್ದೆ",
    language: "ಭಾಷೆ", // Added translation
    email: "ಇಮೇಲ್",
    joined: "ಸೇರಿದರು",
    learningProgress: "ಕಲಿಕೆಯ ಪ್ರಗತಿ",
    overallProgress: "ಒಟ್ಟಾರೆ ಪ್ರಗತಿ",
    modulesCompleted: "ಮಾಡ್ಯೂಲ್‌ಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ",
    achievementsUnlocked: "ಸಾಧನೆಗಳನ್ನು ಅನ್‌ಲಾಕ್ ಮಾಡಲಾಗಿದೆ",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    currentPassword: "ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್",
    newPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
    confirmNewPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    changePassword: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
    saveChanges: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    updateProfile: "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ",
    fetching: "ತರುತ್ತಿದೆ...",
    saving: "ಉಳಿಸುತ್ತಿದೆ...",
    user: "ಬಳಕೆದಾರ",
    learner: "ಕಲಿಯುವವರು",
    notAvailable: "ಲಭ್ಯವಿಲ್ಲ",
    recent: "ಇತ್ತೀಚಿನ",
    changeProfilePicture: "ಪ್ರೊಫೈಲ್ ಚಿತ್ರವನ್ನು ಬದಲಾಯಿಸಿ",
    deleteProfilePicture: "ಪ್ರೊಫೈಲ್ ಚಿತ್ರವನ್ನು ಅಳಿಸಿ"
  }
};

const Profile = () => {
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile(); // Removed refetchProfile destructuring
  const { user } = useAuth();
  const { progressStats, isLoading: isProgressLoadingStats } = useProgress();
  const { currentLanguage, setLanguage } = useContext(LanguageContext)!; // Get setLanguage from LanguageContext

  const t = translations[currentLanguage] || translations.english;

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: "",
    email: "",
    role: "learner",
    region: "",
    psl_id: null,
    designation: "",
    state: "",
    language: "english", // Initialize language
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [updating, setUpdating] = useState(false);
  const [isFetchingStagingData, setIsFetchingStagingData] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPopulatedProfile = useRef<Partial<UserProfile> | null>(null); // To prevent infinite loop

  useEffect(() => {
    if (profile) {
      // Create a snapshot of the profile data that formData cares about
      const profileSnapshot: Partial<UserProfile> = {
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "learner",
        region: profile.region || "",
        psl_id: profile.psl_id || null,
        designation: profile.designation || "",
        state: profile.state || "",
        language: profile.language || "english",
      };

      // Only update formData if the profile snapshot is meaningfully different
      // from what we last used to populate the form
      if (JSON.stringify(profileSnapshot) !== JSON.stringify(lastPopulatedProfile.current)) {
        setFormData(profileSnapshot);
        lastPopulatedProfile.current = profileSnapshot; // Update the ref
      }
    } else if (user && !profile) {
      // This branch is for when user is logged in but profile hasn't loaded or doesn't exist
      // Only set email if it's different to prevent unnecessary renders
      if (formData.email !== (user.email || "")) {
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }
      // Since profile is null, reset lastPopulatedProfile
      lastPopulatedProfile.current = null;
    }
  }, [profile, user, formData.email]); // formData.email is added because it's set in the else-if branch
                                      // and its change should trigger re-evaluation for that branch.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value })); // Corrected: `prev` is the formData itself.
  };
  
  // New handler for language select
  const handleLanguageSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, language: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please select a profile picture smaller than 1MB.",
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to upload a picture.",
      });
      return;
    }
    setIsUploadingPicture(true);
    try {
      const filePath = `profile-picture/${user.id}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Could not get public URL for the uploaded image.");
      }
      await updateProfile({
        profile_picture: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: error.message || "There was a problem uploading your picture." });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleFetchStagingData = async () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User email not found.",
      });
      return;
    }
    setIsFetchingStagingData(true);
    try {
      const { data, error } = await supabase
        .from('user_import_staging')
        .select('psl_id, name, designation, region, state')
        .eq('email', user.email)
        .single();
      if (error || !data) {
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        toast({
          variant: "destructive",
          title: "Not Found",
          description: "Your PSL-ID could not be found. Please contact an administrator.",
        });
      } else {
        setFormData(prev => ({
          ...prev,
          psl_id: data.psl_id,
          name: data.name || prev.name,
          designation: data.designation || prev.designation,
          region: data.region || prev.region,
          state: data.state || prev.state,
        }));
        toast({
          title: "Profile Data Loaded",
          description: "Press the 'Save Changes' button to update your profile.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching staging data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch profile data. Please try again.",
      });
    } finally {
      setIsFetchingStagingData(false);
    }
  };
  
  const handleSave = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      const updateData: Partial<UserProfile> = {};
      if (formData.name !== profile.name) updateData.name = formData.name;
      if (formData.region !== profile.region) updateData.region = formData.region;
      if (formData.designation !== profile.designation) updateData.designation = formData.designation;
      if (formData.psl_id && formData.psl_id !== profile.psl_id) updateData.psl_id = formData.psl_id;
      if (formData.state !== profile.state) updateData.state = formData.state;
      
      const prevLanguage = profile.language;
      const newLanguage = formData.language;
      if (newLanguage && newLanguage !== prevLanguage) {
          updateData.language = newLanguage; // Include language in update
      }

      if (Object.keys(updateData).length === 0) {
        toast({ title: "No changes detected." });
        setUpdating(false);
        return;
      }

      // Update the profile in the database
      const { error } = await updateProfile(updateData);
      if (error) throw error;

      // If language was among the updated fields and it actually changed,
      // update the global LanguageContext immediately.
      // And then force a page reload.
      if (updateData.language && updateData.language !== prevLanguage) {
          setLanguage(updateData.language as Language); // Update global context immediately
          toast({
            title: "Language Updated",
            description: `Your preferred language is now ${updateData.language}. Reloading page...`,
          });
          setTimeout(() => { // Give toast time to show before reloading
            window.location.reload(); 
          }, 1000);
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      }

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

  const handleChangePassword = async () => {
    setIsPasswordChanging(true);
    try {
      if (!passwordData.currentPassword) {
        toast({
          variant: "destructive",
          title: "Missing Current Password",
          description: "Please enter your current password to proceed.",
        });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Password mismatch",
          description: "New passwords do not match.",
        });
        return;
      }
      if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
        toast({
          variant: "destructive",
          title: "Invalid New Password",
          description: "New password must be at least 6 characters long.",
        });
        return;
      }
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: passwordData.currentPassword,
      });
      if (reauthError) {
        if (reauthError.message.includes("Invalid login credentials")) {
          toast({
            variant: "destructive",
            title: "Incorrect Current Password",
            description: "The current password you entered is incorrect.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Reauthentication Failed",
            description: reauthError.message,
          });
        }
        return;
      }
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      if (updatePasswordError) {
        throw updatePasswordError;
      }
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: error.message || "There was a problem changing your password.",
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

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

  const getInitials = () => {
    const nameToUse = profile?.name || formData.name;
    if (!nameToUse) return user?.email?.[0].toUpperCase() || 'U';
    return nameToUse.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
            <h2 className="yd-section-title mb-6">{t.profile}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <YDCard className="text-center p-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {profile?.profile_picture ? (
                      <img
                        src={profile?.profile_picture ? `${profile.profile_picture}?t=${Date.now()}` : undefined}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-medium">
                        {getInitials()}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      disabled={isUploadingPicture}
                    />
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 disabled:bg-primary/70"
                      disabled={isUploadingPicture}
                      title={t.changeProfilePicture}
                    >
                      {isUploadingPicture ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                  </div>
                  <h3 className="text-xl font-semibold">{formData.name || t.user}</h3>
                  <p className="text-muted-foreground capitalize">{formData.designation || formData.role || t.learner}</p>
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">{t.email}</span>
                      <span>{formData.email || t.notAvailable}</span>
                    </div>
                     <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">{t.state}</span>
                      <span>{formData.state || t.notAvailable}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-muted-foreground">{t.joined}</span>
                      <span>
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          : t.recent}
                      </span>
                    </div>
                  </div>
                </YDCard>
                <YDCard className="mt-6 p-6">
                  <h3 className="font-semibold mb-4">{t.learningProgress}</h3>
                  {isProgressLoadingStats ? (
                    <div className="space-y-4 p-4">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{t.overallProgress}</span>
                          <span className="text-sm font-medium">{progressStats.moduleProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${progressStats.moduleProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{t.modulesCompleted}</span>
                          <span className="text-sm font-medium">
                            {progressStats.completedModules}/{progressStats.totalModules}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${moduleCompletionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </YDCard>
              </div>
              <div className="md:col-span-2">
                <YDCard className="p-6">
                  <h3 className="font-semibold mb-6">{t.personalInformation}</h3>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="psl_id" className="block text-sm font-medium text-foreground">
                          {t.pslId}
                        </label>
                        <input
                          id="psl_id"
                          name="psl_id"
                          type="text"
                          value={formData.psl_id || ''}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                       <div className="space-y-2">
                        <label htmlFor="designation" className="block text-sm font-medium text-foreground">
                          {t.designation}
                        </label>
                        <input
                          id="designation"
                          name="designation"
                          type="text"
                          value={formData.designation || ''}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-foreground">
                          {t.fullName}
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name || ''}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                          {t.emailAddress}
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium text-foreground">
                          {t.role}
                        </label>
                        <input
                          id="role"
                          name="role"
                          type="text"
                          value={formData.role}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                       <div className="space-y-2">
                        <label htmlFor="state" className="block text-sm font-medium text-foreground">
                          {t.state}
                        </label>
                        <input
                          id="state"
                          name="state"
                          type="text"
                          value={formData.state || ''}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        />
                      </div>
                      <div className="space-y-2"> {/* Added Language field */}
                        <label htmlFor="language" className="block text-sm font-medium text-foreground">
                          {t.language}
                        </label>
                        <Select
                          value={formData.language || 'english'}
                          onValueChange={handleLanguageSelectChange}
                          disabled={updating}
                        >
                          <SelectTrigger id="language" className="w-full">
                            <SelectValue placeholder={t.language} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                            <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-1"> {/* Adjusted grid span */}
                        <label htmlFor="region" className="block text-sm font-medium text-foreground">
                          {t.region}
                        </label>
                        <select
                          id="region"
                          name="region"
                          value={formData.region || ''}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled
                        >
                          <option value="North India">North India</option>
                          <option value="South India">South India</option>
                          <option value="East India">East India</option>
                          <option value="West India">West India</option>
                          <option value="Central India">Central India</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4 flex items-center gap-4">
                      <YDButton type="submit" disabled={updating || isProfileLoading}>
                        {updating ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
                        {updating ? t.saving : t.saveChanges}
                      </YDButton>
                      {!profile?.psl_id && (
                        <YDButton type="button" variant="outline" onClick={handleFetchStagingData} disabled={isFetchingStagingData || updating}>
                            {isFetchingStagingData ? <Loader2 size={16} className="mr-2 animate-spin"/> : null}
                            {isFetchingStagingData ? t.fetching : t.updateProfile}
                        </YDButton>
                      )}
                    </div>
                  </form>
                </YDCard>
                <YDCard className="mt-6 p-6">
                  <h3 className="font-semibold mb-6">{t.password}</h3>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
                          {t.currentPassword}
                        </label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div></div>
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                          {t.newPassword}
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                          {t.confirmNewPassword}
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <YDButton variant="outline" type="submit" disabled={isPasswordChanging}>
                        {isPasswordChanging ? <Loader2 size={16} className="mr-2 animate-spin"/> : null}
                        {t.changePassword}
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