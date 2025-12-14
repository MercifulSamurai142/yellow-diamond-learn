// File: BulkUploadPage.tsx
import { useState, useContext } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageContext } from "@/contexts/LanguageContext";

// Import the specific operation components
import BulkUserUpload from "./BulkUserUpload";
import BulkUserUpdate from "./BulkUserUpdate";
import BulkQuizUpload from "./BulkQuizUpload";
import BulkQuizUpdate from "./BulkQuizUpdate";

// Base URL for API calls. Use relative path or environment variable for production.
export const BASE_API_URL ="http://localhost:3000";

// Define the shape of a configuration object (MUST BE EXPORTED)
export interface OperationConfig {
  title: string;
  fileLabel: string;
  buttonText: string;
  endpoint: string;
  successMessage: string;
  failureMessage: string;
}

// Define all static English text directly (MUST BE EXPORTED)
// ... (Keep the TEXT constant exactly as it was, just ensure it's exported)
// Define all static English text directly
export const TEXT = {
  // Common Texts
  subtitle: "Import new data or update existing records via CSV.",
  emailLabel: "Admin Email (Read-only)",
  uploading: "Uploading...",
  dragDropText: "Drag 'n' drop a CSV file here, or click to select",
  successTitle: "Operation Successful",
  errorTitle: "Operation Failed",
  responseTitle: "API Response",
  recordsProcessed: "Records Processed: ",
  adminError: "Admin profile is not loaded or user is not an admin.",
  fileSelectError: "Please select a CSV file.",
  networkError: "Network Error:",
  clearFile: "Clear File",

  // User Operation Texts
  userUploadTitle: "Bulk User Upload",
  userUpdateTitle: "Bulk User Update",
  userUploadFileLabel: "Select CSV File (psl_id, name, email, designation, region, state, role)",
  userUpdateButtonLabel: "Update & Validate CSV",
  userUploadButtonLabel: "Upload & Validate CSV",
  userUpdateFileLabel: "Select CSV File (psl_id, name, email, designation, region, state, role - psl_id is mandatory)",
  userUploadSuccess: "User data imported successfully.",
  userUpdateSuccess: "User data updated successfully.",
  userFailure: "Failed to process user data or other server error.",

  // Quiz Operation Texts
  quizUploadTitle: "Bulk Quiz Upload",
  quizUpdateTitle: "Bulk Quiz Edit",
  quizUploadFileLabel: "Select CSV File (quiz_id, name, description, ... quiz columns)", // Placeholder for specific columns
  quizUpdateButtonLabel: "Edit & Validate CSV",
  quizUploadButtonLabel: "Upload & Validate CSV",
  quizUpdateFileLabel: "Select CSV File (quiz_id, name, description, ... - quiz_id is mandatory)", // Placeholder for specific columns
  quizUploadSuccess: "Quiz data imported successfully.",
  quizUpdateSuccess: "Quiz data updated successfully.",
  quizFailure: "Failed to process quiz data or other server error.",
};


type OperationType = 'user_upload' | 'user_update' | 'quiz_upload' | 'quiz_update';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = useState<OperationType>('user_upload'); 
  const { currentLanguage } = useContext(LanguageContext)!;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OperationType)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="user_upload">{TEXT.userUploadTitle}</TabsTrigger>
              <TabsTrigger value="user_update">{TEXT.userUpdateTitle}</TabsTrigger>
              <TabsTrigger value="quiz_upload">{TEXT.quizUploadTitle}</TabsTrigger>
              <TabsTrigger value="quiz_update">{TEXT.quizUpdateTitle}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user_upload">
              {/* NOTE: No props passed here, the component handles its own config */}
              <BulkUserUpload /> 
            </TabsContent>
            <TabsContent value="user_update">
              <BulkUserUpdate />
            </TabsContent>
            <TabsContent value="quiz_upload">
              <BulkQuizUpload />
            </TabsContent>
            <TabsContent value="quiz_update">
              <BulkQuizUpdate />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default BulkUploadPage;