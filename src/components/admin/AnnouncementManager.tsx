import { useState } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, FileText, Loader2 } from "lucide-react";
import { Announcement } from "@/pages/Admin";

interface AnnouncementManagerProps {
  announcements: Announcement[];
  onAnnouncementsUpdate: (announcements: Announcement[]) => void;
  refreshData: () => Promise<void>;
}

const AnnouncementManager = ({ announcements, onAnnouncementsUpdate, refreshData }: AnnouncementManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ name: "", description: "", language: "english" });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // New state for image
  const [isUploading, setIsUploading] = useState(false);

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
    let announcementRecord = announcements.find(a => a.id === editingId);

    try {
        let updates: Partial<Announcement> = {};

        // Step 1: Insert or Update text data
        if (editingId) {
            announcementId = editingId;
            const { error: updateError } = await supabase.from("announcements").update({
                name: newAnnouncement.name,
                description: newAnnouncement.description,
                language: newAnnouncement.language,
                updated_at: new Date().toISOString()
            }).eq("id", editingId);
            if (updateError) throw updateError;
        } else {
            const { data, error } = await supabase.from("announcements").insert({
                name: newAnnouncement.name,
                description: newAnnouncement.description,
                language: newAnnouncement.language
            }).select('id').single();
            if (error || !data) throw error || new Error("Failed to create announcement record.");
            announcementId = data.id;
        }

        // Step 2: Upload document if selected
        if (documentFile && announcementId) {
            const filePath = `public/${announcementId}/${documentFile.name}`;
            const { error: uploadError } = await supabase.storage.from("announcement-files").upload(filePath, documentFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("announcement-files").getPublicUrl(filePath);
            updates.url = urlData.publicUrl;
        }

        // Step 3: Upload image if selected
        if (imageFile && announcementId) {
            const filePath = `public/${announcementId}/media/${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from("announcement-files").upload(filePath, imageFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("announcement-files").getPublicUrl(filePath);
            updates.image_url = urlData.publicUrl;
        }

        // Step 4: Update the record with file URLs if any were generated
        if (Object.keys(updates).length > 0) {
            const { error: finalUpdateError } = await supabase.from("announcements").update(updates).eq("id", announcementId);
            if (finalUpdateError) throw finalUpdateError;
        }

        toast({ title: "Success", description: `Announcement ${editingId ? 'updated' : 'added'} successfully` });
        resetForm();
        await refreshData();

    } catch (error: any) {
        console.error("Error saving announcement:", error);
        toast({ variant: "destructive", title: "Error", description: `Failed to save announcement: ${error.message}` });
        // Clean up orphaned DB record if it was a failed new creation
        if (!editingId && announcementId) {
            await supabase.from("announcements").delete().eq("id", announcementId);
        }
    } finally {
        setIsUploading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setNewAnnouncement({ name: announcement.name, description: announcement.description || "", language: announcement.language || "english" });
    setIsAdding(true);
  };

  const handleDelete = async (announcementId: string) => {
    const announcementToDelete = announcements.find(a => a.id === announcementId);
    if (!announcementToDelete) return;

    // Delete associated files from storage
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

    // Delete record from database
    try {
        const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
        if (error) throw error;
        toast({ title: "Success", description: "Announcement deleted successfully" });
        await refreshData();
    } catch (error: any) {
        console.error("Error deleting announcement:", error);
        toast({ variant: "destructive", title: "Error", description: `Failed to delete announcement: ${error.message}` });
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewAnnouncement({ name: "", description: "", language: "english" });
    setDocumentFile(null);
    setImageFile(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Announcements</h3>
        {!isAdding && (
          <YDButton onClick={() => setIsAdding(true)}>
            <Plus size={16} className="mr-2" /> Add Announcement
          </YDButton>
        )}
      </div>

      {isAdding && (
        <YDCard className="p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">{editingId ? "Edit Announcement" : "Add New Announcement"}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
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
            <div className="grid grid-cols-2 gap-4">
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
                    {announcement.url && (
                        <a href={announcement.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block mr-4">View Attachment</a>
                    )}
                    {announcement.image_url && (
                        <span className="text-sm text-muted-foreground mt-2 inline-block">Has Cover Image</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <YDButton variant="outline" size="icon" onClick={() => handleEdit(announcement)}><Pencil size={16} /></YDButton>
                  <YDButton variant="destructive" size="icon" onClick={() => handleDelete(announcement.id)}><Trash2 size={16} /></YDButton>
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