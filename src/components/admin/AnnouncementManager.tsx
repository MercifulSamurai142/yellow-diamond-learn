import { useState } from "react";
import { format } from "date-fns";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, FileText, Loader2, CalendarIcon, X } from "lucide-react";
import { Announcement } from "@/pages/Admin";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface AnnouncementManagerProps {
  announcements: Announcement[];
  onAnnouncementsUpdate: (announcements: Announcement[]) => void;
  refreshData: () => Promise<void>;
}

const AnnouncementManager = ({ announcements, onAnnouncementsUpdate, refreshData }: AnnouncementManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    name: "", 
    description: "", 
    language: "english",
    expire_at: null as Date | null,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingDeleteExpired, setConfirmingDeleteExpired] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === 'document') {
        setDocumentFile(file);
      } else {
        setImageFile(file);
      }
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newAnnouncement.name) {
      toast({ title: "Error", description: "Announcement name is required", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let announcementId = editingId;

    try {
        if (editingId) {
            const updatesForDb: TablesUpdate<'announcements'> = {
                name: newAnnouncement.name,
                description: newAnnouncement.description,
                language: newAnnouncement.language,
                expire_at: newAnnouncement.expire_at ? newAnnouncement.expire_at.toISOString() : null,
                updated_at: new Date().toISOString()
            };
            const { error: updateError } = await supabase.from("announcements")
                .update(updatesForDb)
                .eq("id", editingId);
            if (updateError) throw updateError;
            announcementId = editingId;
        } else {
            const insertData: TablesInsert<'announcements'> = {
                name: newAnnouncement.name,
                description: newAnnouncement.description,
                language: newAnnouncement.language,
                expire_at: newAnnouncement.expire_at ? newAnnouncement.expire_at.toISOString() : null,
            };
            const { data, error } = await supabase.from("announcements")
                .insert(insertData)
                .select('id')
                .single();
            if (error || !data) throw error || new Error("Failed to create announcement record.");
            announcementId = data.id;
        }

        let fileUpdates: Partial<Announcement> = {};
        if (documentFile && announcementId) {
            const filePath = `public/${announcementId}/${documentFile.name}`;
            const { error: uploadError } = await supabase.storage.from("announcement-files").upload(filePath, documentFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("announcement-files").getPublicUrl(filePath);
            fileUpdates.url = urlData.publicUrl;
        }
        if (imageFile && announcementId) {
            const filePath = `public/${announcementId}/media/${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from("announcement-files").upload(filePath, imageFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("announcement-files").getPublicUrl(filePath);
            fileUpdates.image_url = urlData.publicUrl;
        }
        if (Object.keys(fileUpdates).length > 0) {
            const { error: finalUpdateError } = await supabase.from("announcements").update(fileUpdates).eq("id", announcementId!);
            if (finalUpdateError) throw finalUpdateError;
        }
        toast({ title: "Success", description: `Announcement ${editingId ? 'updated' : 'added'} successfully` });
        resetForm();
        await refreshData();
    } catch (error: any) {
        console.error("Error saving announcement:", error);
        toast({ variant: "destructive", title: "Error", description: `Failed to save announcement: ${error.message}` });
        if (!editingId && announcementId) {
            await supabase.from("announcements").delete().eq("id", announcementId);
        }
    } finally {
        setIsUploading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setConfirmingDeleteId(null);
    setNewAnnouncement({ 
        name: announcement.name, 
        description: announcement.description || "", 
        language: announcement.language || "english",
        expire_at: announcement.expire_at ? new Date(announcement.expire_at) : null
    });
    setIsAdding(true);
  };

  const handleDelete = async (announcementId: string) => {
    try {
        const announcementToDelete = announcements.find(a => a.id === announcementId);
        if (!announcementToDelete) return;

        const filesToDelete: string[] = [];
        if (announcementToDelete.url) {
            filesToDelete.push(new URL(announcementToDelete.url).pathname.split('/announcement-files/')[1]);
        }
        if (announcementToDelete.image_url) {
            filesToDelete.push(new URL(announcementToDelete.image_url).pathname.split('/announcement-files/')[1]);
        }
        if (filesToDelete.length > 0) {
            const { error: storageError } = await supabase.storage.from('announcement-files').remove(filesToDelete);
            if (storageError) {
                console.error("Error deleting storage files, proceeding with DB deletion:", storageError);
            }
        }

        const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
        if (error) throw error;

        toast({ title: "Success", description: "Announcement deleted successfully" });
        await refreshData();
    } catch (error: any) {
        console.error("Error deleting announcement:", error);
        toast({ variant: "destructive", title: "Error", description: `Failed to delete announcement: ${error.message}` });
    } finally {
        setConfirmingDeleteId(null);
    }
  };
  
  const handleDeleteExpiredAnnouncements = async () => {
    try {
      const today = new Date();
      const expiredAnnouncements = announcements.filter(
        (ann) => ann.expire_at && new Date(ann.expire_at) < today
      );

      if (expiredAnnouncements.length === 0) {
        toast({
          title: "No Expired Announcements",
          description: "There are no expired announcements to delete.",
        });
        setConfirmingDeleteExpired(false);
        return;
      }

      const expiredIds = expiredAnnouncements.map((ann) => ann.id);
      const filesToDelete: string[] = [];
      expiredAnnouncements.forEach((ann) => {
        if (ann.url) {
          filesToDelete.push(new URL(ann.url).pathname.split('/announcement-files/')[1]);
        }
        if (ann.image_url) {
          filesToDelete.push(new URL(ann.image_url).pathname.split('/announcement-files/')[1]);
        }
      });
      if (filesToDelete.length > 0) {
        await supabase.storage.from('announcement-files').remove(filesToDelete);
      }

      const { error: dbError } = await supabase.from("announcements").delete().in("id", expiredIds);
      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: `${expiredAnnouncements.length} expired announcement(s) have been deleted.`,
      });
      await refreshData();
    } catch (error: any) {
      console.error("Error deleting expired announcements:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: `Failed to delete expired announcements: ${error.message}`,
      });
    } finally {
      setConfirmingDeleteExpired(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewAnnouncement({ name: "", description: "", language: "english", expire_at: null });
    setDocumentFile(null);
    setImageFile(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Announcements</h3>
        <div className="flex items-center gap-2">
            {!isAdding && (
                <>
                    {!confirmingDeleteExpired ? (
                        <YDButton variant="outline" onClick={() => setConfirmingDeleteExpired(true)} className="hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 size={16} className="mr-2" /> Delete all expired announcements
                        </YDButton>
                    ) : (
                        <div className="flex items-center gap-2">
                            <YDButton variant="destructive" onClick={handleDeleteExpiredAnnouncements}>
                                <Trash2 size={16} className="mr-2" /> Delete all expired announcements permanently?
                            </YDButton>
                            <YDButton variant="outline" onClick={() => setConfirmingDeleteExpired(false)}>
                                <X size={16} className="mr-2" /> Cancel
                            </YDButton>
                        </div>
                    )}
                </>
            )}

            {!isAdding && !confirmingDeleteExpired && (
              <YDButton onClick={() => setIsAdding(true)}>
                <Plus size={16} className="mr-2" /> Add Announcement
              </YDButton>
            )}
        </div>
      </div>

      {isAdding && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">{editingId ? "Edit Announcement" : "Add New Announcement"}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="announcementName">Name / Title</Label>
                  <Input id="announcementName" value={newAnnouncement.name} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, name: e.target.value })} placeholder="Enter announcement title" />
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={newAnnouncement.language} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, language: value })}>
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
              <Label htmlFor="announcementDescription">Description / Body</Label>
              <Textarea id="announcementDescription" value={newAnnouncement.description} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })} placeholder="Enter the main content of the announcement" rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="announcementImage">Cover Image (Optional)</Label>
                    <Input id="announcementImage" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} disabled={isUploading} />
                    {imageFile && <p className="mt-2 text-sm text-muted-foreground">Image: {imageFile.name}</p>}
                </div>
                <div>
                    <Label htmlFor="announcementFile">Attachment (Optional)</Label>
                    <Input id="announcementFile" type="file" onChange={(e) => handleFileChange(e, 'document')} disabled={isUploading} />
                    {documentFile && <p className="mt-2 text-sm text-muted-foreground">Attachment: {documentFile.name}</p>}
                </div>
                 <div>
                    <Label htmlFor="expire_at">Expiry Date (Optional)</Label>
                    <div className="flex items-center gap-2">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newAnnouncement.expire_at && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newAnnouncement.expire_at ? format(newAnnouncement.expire_at, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={newAnnouncement.expire_at}
                                    onSelect={(date) => {
                                      if (date) {
                                        const endOfDay = new Date(date);
                                        endOfDay.setHours(23, 59, 59, 999);
                                        setNewAnnouncement({ ...newAnnouncement, expire_at: endOfDay });
                                      } else {
                                        setNewAnnouncement({ ...newAnnouncement, expire_at: null });
                                      }
                                      setIsCalendarOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {newAnnouncement.expire_at && (
                           <Button variant="ghost" size="icon" onClick={() => setNewAnnouncement({ ...newAnnouncement, expire_at: null })}>
                               <X className="h-4 w-4"/>
                           </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex space-x-2">
              <YDButton onClick={handleAddOrUpdate} disabled={isUploading}>
                {isUploading && <Loader2 size={16} className="mr-2 animate-spin" />}
                {editingId ? "Update" : "Add"} Announcement
              </YDButton>
              <YDButton variant="outline" onClick={resetForm}>Cancel</YDButton>
            </div>
          </div>
        </YDCard>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <YDCard><div className="p-6 text-center"><p className="text-muted-foreground">No announcements found.</p></div></YDCard>
        ) : (
          announcements.map((announcement) => (
            <YDCard key={announcement.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="p-2 bg-primary/10 rounded-lg mr-4"><FileText size={32} className="text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium">{announcement.name}</h4>
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground capitalize">{announcement.language}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{announcement.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                        {announcement.url && (
                            <a href={announcement.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-block">View Attachment</a>
                        )}
                        {announcement.image_url && (
                            <span className="text-sm text-muted-foreground inline-block">Has Cover Image</span>
                        )}
                         {announcement.expire_at && (
                            <span className="text-sm text-red-500 inline-block">Expires on {format(new Date(announcement.expire_at), "PPP")}</span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                    {confirmingDeleteId === announcement.id ? (
                        <>
                            <YDButton variant="destructive" size="sm" onClick={() => handleDelete(announcement.id)}>
                                Delete Announcement?
                            </YDButton>
                            <YDButton variant="outline" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                                Cancel
                            </YDButton>
                        </>
                    ) : (
                        <>
                            <YDButton variant="outline" size="icon" onClick={() => handleEdit(announcement)}><Pencil size={16} /></YDButton>
                            <YDButton variant="destructive" size="icon" onClick={() => setConfirmingDeleteId(announcement.id)}><Trash2 size={16} /></YDButton>
                        </>
                    )}
                </div>
              </div>
            </YDCard>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager;