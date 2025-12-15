import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import BulkUpload from "@/components/admin/BulkUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Re-using the BulkUpload component's status interface to manage state across tabs
interface UploadStatus {
  status: 'initial' | 'parsing' | 'validating' | 'uploading' | 'complete';
  message: string;
  isError: boolean;
  details: string[];
  recordsProcessed: number;
}


const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = useState<'insert' | 'update'>('insert');
  const [insertStatus, setInsertStatus] = useState<UploadStatus | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UploadStatus | null>(null);

  const handleInsertStatusChange = (status: UploadStatus) => {
      setInsertStatus(status);
      setUpdateStatus(null); // Clear other tab's status on change
  };

  const handleUpdateStatusChange = (status: UploadStatus) => {
      setUpdateStatus(status);
      setInsertStatus(null); // Clear other tab's status on change
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="yd-container animate-fade-in">
            <h2 className="yd-section-title mb-2">Bulk Upload User</h2>
            <p className="text-muted-foreground mb-8">Process user data locally and sync with staging table.</p>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'insert' | 'update')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="insert">Insert New Users</TabsTrigger>
                <TabsTrigger value="update">Update Existing Users</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insert">
                <BulkUpload 
                  actionType="insert" 
                  onStatusChange={handleInsertStatusChange}
                />
              </TabsContent>
              
              <TabsContent value="update">
                <BulkUpload 
                  actionType="update" 
                  onStatusChange={handleUpdateStatusChange}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BulkUploadPage;