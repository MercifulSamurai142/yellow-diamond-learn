// yellow-diamond-learn-dev/src/pages/Onboarding.tsx
import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, UserProfile } from "@/hooks/useProfile";
import { LanguageContext, Language } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Type for data from staging table
type StagingUser = Tables<"user_import_staging">;

// Translation object
const translations = {
  english: {
    welcome: "Welcome to Yellow Diamond Academy!",
    completeProfile: "Please Select Your Language and Submit Your Profile.",
    personalInformation: "Personal Information",
    pslId: "PSL-ID",
    fullName: "Full Name",
    emailAddress: "Email Address",
    role: "Role",
    region: "Region",
    state: "State",
    designation: "Designation",
    language: "Preferred Language",
    confirm: "Confirm & Get Started",
    fetching: "Loading Profile Data...",
    submitting: "Saving Profile...",
    notFoundTitle: "No Onboarding Data Found",
    notFoundDescription: "Your user data for onboarding could not be found. Please contact an administrator.",
    errorFetching: "Failed to load your onboarding data. Please try again.",
    updateSuccess: "Profile updated successfully!",
    languageUpdate: "Language updated. Reloading page...",
    updateFailed: "Failed to update profile. Please try again.",
    redirecting: "Redirecting..."
  },
  hindi: {
    welcome: "यलो डायमंड एकेडमी में आपका स्वागत है!",
    completeProfile: "शुरू करने के लिए कृपया अपनी प्रोफाइल पूरी करें।",
    personalInformation: "व्यक्तिगत जानकारी",
    pslId: "पीएसएल-आईडी",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    role: "भूमिका",
    region: "क्षेत्र",
    state: "राज्य",
    designation: "पदनाम",
    language: "पसंदीदा भाषा",
    confirm: "पुष्टि करें और शुरू करें",
    fetching: "प्रोफ़ाइल डेटा लोड हो रहा है...",
    submitting: "प्रोफ़ाइल सहेजा जा रहा है...",
    notFoundTitle: "कोई ऑनबोर्डिंग डेटा नहीं मिला",
    notFoundDescription: "आपकी ऑनबोर्डिंग के लिए उपयोगकर्ता डेटा नहीं मिला। कृपया एक व्यवस्थापक से संपर्क करें।",
    errorFetching: "आपका ऑनबोर्डिंग डेटा लोड करने में विफल। कृपया पुनः प्रयास करें।",
    updateSuccess: "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया!",
    languageUpdate: "भाषा अपडेट की गई। पृष्ठ पुनः लोड हो रहा है...",
    updateFailed: "प्रोफ़ाइल अपडेट करने में विफल। कृपया पुनः प्रयास करें।",
    redirecting: "रीडायरेक्ट कर रहा है..."
  },
  kannada: {
    welcome: "ಯೆಲ್ಲೊ ಡೈಮಂಡ್ ಅಕಾಡೆಮಿಗೆ ಸ್ವಾಗತ!",
    completeProfile: "ಪ್ರಾರಂಭಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
    personalInformation: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ",
    pslId: "ಪಿಎಸ್‌ಎಲ್-ಐಡಿ",
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    emailAddress: "ಇಮೇಲ್ ವಿಳಾಸ",
    role: "ಪಾತ್ರ",
    region: "ಪ್ರದೇಶ",
    state: "ರಾಜ್ಯ",
    designation: "ಹುದ್ದೆ",
    language: "ಪ್ರಾಶಸ್ತ್ಯದ ಭಾಷೆ",
    confirm: "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪ್ರಾರಂಭಿಸಿ",
    fetching: "ಪ್ರೊಫೈಲ್ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    submitting: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    notFoundTitle: "ಯಾವುದೇ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ",
    notFoundDescription: "ಆನ್‌ಬೋರ್ಡಿಂಗ್‌ಗಾಗಿ ನಿಮ್ಮ ಬಳಕೆದಾರ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    errorFetching: "ನಿಮ್ಮ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    updateSuccess: "ಪ್ರೊಫೈಲ್ ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    languageUpdate: "ಭಾಷೆ ನವೀಕರಿಸಲಾಗಿದೆ. ಪುಟವನ್ನು ಮರುಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    updateFailed: "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    redirecting: "ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ..."
  }
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile();
  const { currentLanguage, setLanguage } = useContext(LanguageContext)!;

  const t = translations[currentLanguage] || translations.english;

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: "",
    email: "",
    role: "learner",
    region: "",
    psl_id: null,
    designation: "",
    state: "",
    language: "english",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStagingData, setHasStagingData] = useState(false);
  const isMounted = useRef(true); // To track if component is mounted

  useEffect(() => {
    return () => {
      isMounted.current = false; // Mark component as unmounted
    };
  }, []);

  // Redirect if PSL ID is already present or profile is still loading
  useEffect(() => {
    if (isProfileLoading || !isMounted.current) return;

    if (profile && profile.psl_id) {
      toast({ title: "Profile already complete.", description: t.redirecting });
      navigate('/dashboard', { replace: true });
    } else if (user) {
      fetchStagingAndProfileData();
    } else {
      navigate('/login', { replace: true });
    }
  }, [isProfileLoading, profile, user, navigate, t.redirecting]);

  const fetchStagingAndProfileData = async () => {
    if (!user?.email || !isMounted.current) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: stagingData, error: stagingError } = await supabase
        .from('user_import_staging')
        .select('psl_id, name, designation, region, state, role')
        .eq('email', user.email)
        .single();

      if (!isMounted.current) return; // Exit if unmounted

      if (stagingError) {
        if (stagingError.code === 'PGRST116') { // No rows found
          setHasStagingData(false);
          toast({ variant: "destructive", title: t.notFoundTitle, description: t.notFoundDescription });
        } else {
          throw stagingError;
        }
      } else {
        setHasStagingData(true);
        setFormData(prev => ({
          ...prev,
          id: user.id,
          email: user.email!,
          role: stagingData.role || profile?.role || 'learner',
          psl_id: stagingData.psl_id,
          name: stagingData.name || profile?.name || user.email?.split('@')[0] || '',
          designation: stagingData.designation || profile?.designation || '',
          region: stagingData.region || profile?.region || '',
          state: stagingData.state || profile?.state || '',
          language: profile?.language || 'english',
        }));
      }
    } catch (error: any) {
      console.error("Error fetching onboarding data:", error);
      if (isMounted.current) {
        toast({ variant: "destructive", title: t.errorFetching, description: error.message });
        setHasStagingData(false);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, language: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be logged in to complete onboarding." });
      setIsSubmitting(false);
      return;
    }

    if (!formData.psl_id) {
        toast({ variant: "destructive", title: "Missing PSL-ID", description: "PSL-ID is required for onboarding. Please contact an administrator if you believe this is an error." });
        setIsSubmitting(false);
        return;
    }

    try {
      const updateData: Partial<UserProfile> = {
        id: user.id,
        email: user.email!,
        psl_id: formData.psl_id,
        name: formData.name,
        designation: formData.designation,
        region: formData.region,
        state: formData.state,
        role: formData.role,
        language: formData.language,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await updateProfile(updateData);

      if (error) throw error;

      toast({ title: t.updateSuccess, description: t.redirecting });

      // Update global language context if changed
      if (formData.language && formData.language !== currentLanguage) {
        setLanguage(formData.language as Language);
        // Force a full page reload to apply language changes across the app
        // This is necessary because some components might not re-render deeply enough
        // or rely on initial load for font registration in PDF generation.
        setTimeout(() => {
          if (isMounted.current) window.location.reload();
        }, 100); // Short delay to allow toast to show
      } else {
        // Just navigate if only profile data (other than language) was updated
        setTimeout(() => {
          if (isMounted.current) navigate('/dashboard', { replace: true });
        }, 100); // Short delay for smooth navigation
      }

    } catch (error: any) {
      console.error("Onboarding submission error:", error);
      if (isMounted.current) {
        toast({ variant: "destructive", title: t.updateFailed, description: error.message });
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-primary">{t.fetching}</p>
      </div>
    );
  }

  if (!hasStagingData && !isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <YDCard className="w-full max-w-md p-6 text-center">
                <h2 className="yd-section-title text-destructive">{t.notFoundTitle}</h2>
                <p className="text-muted-foreground mt-2">{t.notFoundDescription}</p>
                <YDButton onClick={() => navigate('/login')} className="mt-6">Go to Login</YDButton>
            </YDCard>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <YDCard className="w-full max-w-3xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yd-navy mb-2">{t.welcome}</h1>
          <p className="text-muted-foreground">{t.completeProfile}</p>
        </div>

        <h3 className="font-semibold mb-4">{t.personalInformation}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="psl_id">{t.pslId}</Label>
              <Input
                id="psl_id"
                name="psl_id"
                type="text"
                value={formData.psl_id || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">{t.designation}</Label>
              <Input
                id="designation"
                name="designation"
                type="text"
                value={formData.designation || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailAddress}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t.role}</Label>
              <Input
                id="role"
                name="role"
                type="text"
                value={formData.role || 'learner'}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">{t.state}</Label>
              <Input
                id="state"
                name="state"
                type="text"
                value={formData.state || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">{t.region}</Label>
              <Input
                id="region"
                name="region"
                type="text"
                value={formData.region || ''}
                readOnly
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t.language}</Label>
              <Select
                value={formData.language || 'english'}
                onValueChange={handleLanguageSelectChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-6">
            <YDButton type="submit" disabled={isSubmitting || !formData.psl_id}>
              {isSubmitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
              {isSubmitting ? t.submitting : t.confirm}
            </YDButton>
          </div>
        </form>
      </YDCard>
    </div>
  );
};

export default Onboarding;