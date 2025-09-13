import { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { YDCard } from "@/components/ui/YDCard";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LanguageContext } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

type Announcement = Tables<"announcements">;

const translations = {
  english: {
    back: "Back to Announcements",
    notFound: "Announcement Not Found",
    notFoundDesc: "The announcement you are looking for does not exist.",
    download: "Download Attachment",
    downloading: "Downloading..."
  },
  hindi: {
    back: "घोषणाओं पर वापस जाएं",
    notFound: "घोषणा नहीं मिली",
    notFoundDesc: "आप जिस घोषणा की तलाश कर रहे हैं वह मौजूद नहीं है।",
    download: "अटैचमेंट डाउनलोड करें",
    downloading: "डाउनलोड हो रहा है..."
  },
  kannada: {
    back: "ಪ್ರಕಟಣೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    notFound: "ಪ್ರಕಟಣೆ ಕಂಡುಬಂದಿಲ್ಲ",
    notFoundDesc: "ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪ್ರಕಟಣೆ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ.",
    download: "ಲಗತ್ತನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    downloading: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
  }
};

const AnnouncementDetail = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { currentLanguage } = useContext(LanguageContext)!;

  const t = translations[currentLanguage] || translations.english;

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!announcementId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single();

        if (error) {
            if (error.code === 'PGRST116') { // Code for "No rows found"
                setAnnouncement(null);
            } else {
                throw error;
            }
        } else {
            setAnnouncement(data);
        }
      } catch (error: any) {
        console.error('Error fetching announcement:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load announcement: ${error.message}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  const handleDownload = async (url: string) => {
    if (!url) return;
    setIsDownloading(true);
    try {
        const urlParts = url.split('/announcement-files/');
        if (urlParts.length < 2) {
            throw new Error("Invalid announcement file URL format.");
        }
        const filePath = urlParts[1];
        const fileName = filePath.split('/').pop() || 'download';

        const { data, error } = await supabase.storage
            .from('announcement-files')
            .download(filePath);

        if (error) throw error;
        if (!data) throw new Error("No file data received.");

        const blob = new Blob([data], { type: data.type });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        toast({
            title: "Download Started",
            description: `Downloading ${fileName}.`
        });

    } catch (error: any) {
        console.error("Download error:", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: error.message || "Could not download the attachment."
        });
    } finally {
        setIsDownloading(false);
    }
};

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <Link to="/announcements" className="text-primary hover:underline flex items-center mb-4 text-sm">
              <ArrowLeft size={16} className="mr-1" />
              {t.back}
            </Link>

            {!announcement ? (
                <YDCard className="p-10 text-center">
                    <h2 className="text-xl font-semibold mb-2">{t.notFound}</h2>
                    <p className="text-muted-foreground">{t.notFoundDesc}</p>
                </YDCard>
            ) : (
                <YDCard className="p-0 overflow-hidden">
                    {announcement.image_url && (
                    <img 
                        src={announcement.image_url} 
                        alt={announcement.name} 
                        className="w-full h-auto max-h-96 object-cover" 
                    />
                    )}
                    <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{announcement.name}</h2>
                        <div className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                            {new Date(announcement.created_at!).toLocaleDateString()}
                        </div>
                    </div>
                    {announcement.description && (
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">{announcement.description}</p>
                    )}
                    {announcement.url && (
                        <div className="mt-6 pt-4 border-t">
                            <button
                                onClick={() => handleDownload(announcement.url!)}
                                disabled={isDownloading}
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDownloading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                <span>{isDownloading ? t.downloading : t.download}</span>
                            </button>
                        </div>
                    )}
                    </div>
                </YDCard>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementDetail;