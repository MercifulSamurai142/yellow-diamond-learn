import { useEffect, useState, useContext } from "react";
import { Award, Download, Eye, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import YDButton from "@/components/ui/YDButton";
import { YDCard, YDCardContent } from "@/components/ui/YDCard";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useProfile } from "@/hooks/useProfile";
import { LanguageContext } from "@/contexts/LanguageContext";

interface CompletedModule {
  module_id: string;
  completion_date: string;
  modules: {
    name: string;
    description: string | null;
  }
}

// Translation object
const translations = {
  english: {
    title: "Your Certificates",
    subtitle: "View your earned certificates of completion",
    loginPromptTitle: "Log in to get Certified",
    loginPromptDescription: "Please log in to view your certificates of completion.",
    noCertsTitle: "Complete modules to earn certificates",
    noCertsDescription: "Finish all lessons in a module to receive a certificate you can view and download here.",
    completedOn: "Completed on",
    view: "View",
    download: "Download",
    downloading: "Downloading...",
    previewTitle: "Certificate Preview",
    downloadPdf: "Download PDF",
    errorLoading: "Failed to load your certificates.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    refreshComplete: "Refresh Complete",
    refreshDescription: "Checked for new certificate eligibility."
  },
  hindi: {
    title: "आपके प्रमाणपत्र",
    subtitle: "पूर्णता के अपने अर्जित प्रमाणपत्र देखें",
    loginPromptTitle: "प्रमाणित होने के लिए लॉग इन करें",
    loginPromptDescription: "कृपया अपनी पूर्णता के प्रमाणपत्र देखने के लिए लॉग इन करें।",
    noCertsTitle: "प्रमाणपत्र अर्जित करने के लिए मॉड्यूल पूरे करें",
    noCertsDescription: "यहां देखने और डाउनलोड करने के लिए एक प्रमाणपत्र प्राप्त करने के लिए एक मॉड्यूल में सभी पाठ पूरे करें।",
    completedOn: "को पूरा हुआ",
    view: "देखें",
    download: "डाउनलोड करें",
    downloading: "डाउनलोड हो रहा है...",
    previewTitle: "प्रमाणपत्र पूर्वावलोकन",
    downloadPdf: "पीडीएफ डाउनलोड करें",
    errorLoading: "आपके प्रमाणपत्र लोड करने में विफल।",
    refresh: "ताज़ा करें",
    refreshing: "ताज़ा कर रहा है...",
    refreshComplete: "ताज़ा करना पूर्ण",
    refreshDescription: "नए प्रमाणपत्र पात्रता के लिए जाँच की गई।"
  },
  kannada: {
    title: "ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರಗಳು",
    subtitle: "ನೀವು ಪೂರ್ಣಗೊಳಿಸಿದ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    loginPromptTitle: "ಪ್ರಮಾಣೀಕರಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ",
    loginPromptDescription: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
    noCertsTitle: "ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಗಳಿಸಲು ಮಾಡ್ಯೂಲ್‌ಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ",
    noCertsDescription: "ನೀವು ಇಲ್ಲಿ ವೀಕ್ಷಿಸಬಹುದಾದ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದಾದ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಸ್ವೀಕರಿಸಲು ಮಾಡ್ಯೂಲ್‌ನಲ್ಲಿನ ಎಲ್ಲಾ ಪಾಠಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
    completedOn: "ದಂದು ಪೂರ್ಣಗೊಂಡಿದೆ",
    view: "ವೀಕ್ಷಿಸಿ",
    download: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    downloading: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    previewTitle: "ಪ್ರಮಾಣಪತ್ರ ಪೂರ್ವವೀಕ್ಷಣೆ",
    downloadPdf: "ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    errorLoading: "ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.",
    refresh: "ರಿಫ್ರೆಶ್",
    refreshing: "ರಿಫ್ರೆಶ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    refreshComplete: "ರಿಫ್ರೆಶ್ ಪೂರ್ಣಗೊಂಡಿದೆ",
    refreshDescription: "ಹೊಸ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಹತೆಗಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ."
  }
};


const CertificatesPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CompletedModule[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<CompletedModule | null>(null);
  const { currentLanguage } = useContext(LanguageContext)!;

  const t = translations[currentLanguage] || translations.english;

  const fetchCompletedModules = async () => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }
    try {
      setIsLoadingData(true);
      const { data, error } = await supabase
        .from('modules_completed')
        .select(`
          module_id,
          completion_date,
          modules!inner (
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('modules.language', currentLanguage)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      
      const validData = data?.filter(c => c.modules) || [];
      setCertificates(validData as CompletedModule[]);

    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: t.errorLoading,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if(!isAuthLoading) {
        fetchCompletedModules();
    }
  }, [user, isAuthLoading, currentLanguage]);

  const handleRefreshCertificates = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id, lessons(id)')
            .eq('language', currentLanguage);

        if (modulesError) throw modulesError;

        const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('status', 'completed');
        
        if (progressError) throw progressError;

        const completedLessonIds = new Set(progressData.map(p => p.lesson_id));

        const newlyCompletedModules = modules.filter(module => {
            const lessonIdsInModule = module.lessons.map(l => l.id);
            return lessonIdsInModule.length > 0 && lessonIdsInModule.every(id => completedLessonIds.has(id));
        });
        
        const newCompletionsToInsert = newlyCompletedModules.map(m => ({
            user_id: user.id,
            module_id: m.id
        }));

        if (newCompletionsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('modules_completed')
                .upsert(newCompletionsToInsert, { 
                    onConflict: 'user_id, module_id',
                    ignoreDuplicates: true 
                });
            
            if (insertError) throw insertError;
        }

        toast({
            title: t.refreshComplete,
            description: t.refreshDescription,
        });

        await fetchCompletedModules();

    } catch (error) {
        console.error("Error refreshing certificates:", error);
        toast({
            variant: "destructive",
            title: "Refresh Failed",
            description: "Could not check for new certificates."
        });
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleDownload = async (certificate: CompletedModule) => {
    if (!profile) {
        toast({ title: "Profile not loaded", description: "Please wait for your profile to load before downloading.", variant: "destructive"});
        return;
    }

    setIsDownloading(certificate.module_id);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const primaryColor = '#F97316';
      const navyColor = '#1E293B';   
      const gray = '#64748B';      

      doc.setFillColor(253, 250, 245);
      doc.rect(0, 0, 297, 210, 'F');
      
      doc.setDrawColor(primaryColor);
      doc.setLineWidth(4);
      doc.rect(10, 10, 277, 190);

      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = 'https://www.yellowdiamond.in/wp-content/uploads/2024/06/YD-logo@2x.png';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                doc.addImage(img, 'PNG', 245, 18, 30, 15);
                resolve();
            };
            img.onerror = (e) => {
                console.error("Could not load certificate logo:", e);
                doc.setFontSize(10);
                doc.setTextColor(gray);
                doc.text('Yellow Diamond', 260, 25, { align: 'center' });
                resolve(); 
            };
        });
      } catch (e) {
         console.error("Image loading promise rejected:", e);
      }
      
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(navyColor);
      doc.text('Certificate of Completion', 148.5, 50, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.text('This certificate is awarded to', 148.5, 75, { align: 'center' });
      
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text(profile.name || 'Valued Team Member', 148.5, 90, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.text('for successfully completing the module', 148.5, 110, { align: 'center' });
      
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(navyColor);
      doc.text(certificate.modules.name, 148.5, 125, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.text(`Completed on: ${new Date(certificate.completion_date).toLocaleDateString()}`, 148.5, 150, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(navyColor);
      doc.line(110, 175, 187, 175);
      doc.setFontSize(12);
      doc.text('Yellow Diamond Academy Director', 148.5, 182, { align: 'center' });
      
      doc.save(`${certificate.modules.name.replace(/\s+/g, '_')}_Certificate.pdf`);
      
      toast({
        title: "Certificate Downloaded",
        description: `Your certificate for "${certificate.modules.name}" has been downloaded.`,
      });

    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating your certificate.",
        variant: "destructive"
      });
      console.error("PDF generation error:", error);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleView = (certificate: CompletedModule) => {
    setViewingCertificate(certificate);
  };

  const CertificatePreview = ({ certificate }: { certificate: CompletedModule }) => (
    <div className="bg-yellow-50 border-4 border-primary p-6 mx-auto max-w-3xl text-center rounded-lg">
      <h2 className="text-3xl font-bold text-yd-navy mb-4">Certificate of Completion</h2>
      <p className="text-lg text-yd-gray">This certifies that</p>
      <p className="text-3xl font-bold text-primary my-2">{profile?.name || "Valued Team Member"}</p>
      <p className="text-lg text-yd-gray">has successfully completed the module</p>
      <p className="text-2xl font-bold text-yd-navy my-2">{certificate.modules.name}</p>
      <p className="text-md text-yd-gray mt-4">Completed on: {new Date(certificate.completion_date).toLocaleDateString()}</p>
      <div className="mt-12">
        <div className="h-0.5 w-48 bg-yd-navy mx-auto mb-2"></div>
        <p className="text-sm text-yd-gray">Yellow Diamond Academy Director</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isAuthLoading || isProfileLoading || isLoadingData) {
      return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return (
        <YDCard>
            <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                    <Award className="h-6 w-6" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-yd-navy">{t.loginPromptTitle}</h2>
                <p className="mx-auto max-w-md text-sm text-yd-gray">
                   {t.loginPromptDescription}
                </p>
            </div>
        </YDCard>
      );
    }

    if (certificates.length === 0) {
      return (
        <YDCard>
            <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                    <Award className="h-6 w-6" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-yd-navy">{t.noCertsTitle}</h2>
                <p className="mx-auto max-w-md text-sm text-yd-gray">
                    {t.noCertsDescription}
                </p>
            </div>
        </YDCard>
      );
    }

    return (
        <div className="space-y-4">
          {certificates.map(cert => (
            <YDCard key={cert.module_id} className="hover:shadow-lg transition-shadow duration-300">
              <YDCardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 text-white shadow-md flex-shrink-0">
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                      <h3 className="font-bold text-lg text-yd-navy">{cert.modules.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          <span>{t.completedOn} {new Date(cert.completion_date).toLocaleDateString()}</span>
                      </div>
                  </div>
                  <div className="flex flex-row gap-2 self-start sm:self-center">
                    <YDButton 
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(cert)}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      {t.view}
                    </YDButton>
                    <YDButton 
                      size="sm"
                      onClick={() => handleDownload(cert)}
                      disabled={!!isDownloading}
                    >
                      {isDownloading === cert.module_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1.5" />
                          {t.download}
                        </>
                      )}
                    </YDButton>
                  </div>
              </YDCardContent>
            </YDCard>
          ))}
        </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="yd-section-title mb-2">{t.title}</h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>
                {user && (
                    <YDButton onClick={handleRefreshCertificates} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {isRefreshing ? t.refreshing : t.refresh}
                    </YDButton>
                )}
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
      <Dialog open={!!viewingCertificate} onOpenChange={(open) => !open && setViewingCertificate(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-4 border-0 bg-transparent">
          {viewingCertificate && <CertificatePreview certificate={viewingCertificate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificatesPage;