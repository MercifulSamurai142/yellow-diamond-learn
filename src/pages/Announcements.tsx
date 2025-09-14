import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Download, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LanguageContext } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

type Announcement = Tables<"announcements">;

// Translations for the page content
const translations = {
  english: {
    title: "Announcements",
    subtitle: "Stay updated with the latest news and documents.",
    viewDocument: "Download Attachment",
    noAnnouncements: "No announcements have been posted yet in this language. Please check back later.",
    errorTitle: "Error",
    errorDescription: "Could not load announcements."
  },
  hindi: {
    title: "घोषणाएँ",
    subtitle: "नवीनतम समाचारों और दस्तावेजों से अपडेट रहें।",
    viewDocument: "अटैचमेंट डाउनलोड करें",
    noAnnouncements: "इस भाषा में अभी तक कोई घोषणा पोस्ट नहीं की गई है। कृपया बाद में फिर से देखें।",
    errorTitle: "त्रुटि",
    errorDescription: "घोषणाएँ लोड नहीं हो सकीं।"
  },
  kannada: {
    title: "ಪ್ರಕಟಣೆಗಳು",
    subtitle: "ಇತ್ತೀಚಿನ ಸುದ್ದಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳೊಂದಿಗೆ ನವೀಕೃತವಾಗಿರಿ.",
    viewDocument: "ಲಗತ್ತನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    noAnnouncements: "ಈ ಭಾಷೆಯಲ್ಲಿ ಯಾವುದೇ ಪ್ರಕಟಣೆಗಳನ್ನು ಇನ್ನೂ ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.",
    errorTitle: "ದೋಷ",
    errorDescription: "ಪ್ರಕಟಣೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
  }
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentLanguage } = useContext(LanguageContext)!;

  const t = translations[currentLanguage] || translations.english;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString();
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('language', currentLanguage)
          .or(`expire_at.is.null,expire_at.gt.${today}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast({
            variant: "destructive",
            title: t.errorTitle,
            description: t.errorDescription
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [currentLanguage, t.errorTitle, t.errorDescription]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <Megaphone className="h-8 w-8 text-primary" />
                <div>
                    <h2 className="yd-section-title">{t.title}</h2>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.length === 0 ? (
                  <YDCard>
                    <div className="p-10 text-center">
                      <p className="text-muted-foreground">{t.noAnnouncements}</p>
                    </div>
                  </YDCard>
                ) : (
                  announcements.map((announcement) => (
                    <Link to={`/announcements/${announcement.id}`} key={announcement.id}>
                        <YDCard className="p-0 overflow-hidden transition-all hover:shadow-xl hover:border-primary cursor-pointer">
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-gray-800">{announcement.name}</h3>
                                    <div className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                                        {new Date(announcement.created_at!).toLocaleDateString()}
                                    </div>
                                </div>
                                {announcement.description && (
                                    <p className="text-gray-600 mt-2 whitespace-pre-wrap line-clamp-2">{announcement.description}</p>
                                )}
                                {announcement.url && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                            <Download size={16} />
                                            <span>{t.viewDocument}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {announcement.image_url && (
                                <div className="w-full bg-slate-100 dark:bg-slate-800" style={{ height: 'auto' }}>
                                    <img 
                                        src={announcement.image_url} 
                                        alt={announcement.name} 
                                        className="w-full h-auto object-contain" 
                                    />
                                </div>
                            )}
                        </YDCard>
                        <div className="p-2"></div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Announcements;