// File: src/components/admin/BulkOperationForm.tsx

import React, { useState, useRef, FC } from "react";
import YDButton from "@/components/ui/YDButton";
import { YDCard } from "@/components/ui/YDCard";
import { Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEXT, OperationConfig } from "../../pages/admin/BulkUploadPage";
import { supabase } from "@/integrations/supabase/client"; // ASSUMPTION: Import your Supabase client

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  details?: string;
  recordsImported?: number;
  data?: any;
}

interface BulkOperationFormProps {
  config: OperationConfig;
}

const BulkOperationForm: FC<BulkOperationFormProps> = ({ config }) => {
  const { profile } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminEmail = profile?.email || "";
  const isAdmin = profile?.role === 'admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse(null);

    // Only check for admin status/profile load, email is now extracted from JWT
    if (!isAdmin || !profile) {
      toast({
        variant: "destructive",
        title: TEXT.errorTitle,
        description: TEXT.adminError,
      });
      return;
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: TEXT.errorTitle,
        description: TEXT.fileSelectError,
      });
      return;
    }

    setIsLoading(true);

    // --- JWT TOKEN RETRIEVAL (Refactored for correctness) ---
    let jwtToken: string | null = null;
    try {
      if (!supabase) throw new Error("Supabase client is not initialized.");

      // CORRECTED: Await the promise and access the result object
      const result = await supabase.auth.getSession();
      const session = result.data.session;
      const error = result.error;
      
      if (error) throw error;

      jwtToken = session?.access_token || null;

    } catch (error) {
      console.error("Failed to retrieve Supabase session:", error);
      toast({
        variant: "destructive",
        title: TEXT.errorTitle,
        description: "Authentication failed. Could not retrieve session token.",
      });
      setIsLoading(false);
      return;
    }

    if (!jwtToken) {
      toast({
        variant: "destructive",
        title: TEXT.errorTitle,
        description: "No active user session found. Please log in again.",
      });
      setIsLoading(false);
      return;
    }
    // ----------------------------

    try {
      const formData = new FormData();
      // formData.append('email', adminEmail); // Removed: Email now extracted from JWT
      formData.append('file', file);     // Only file is sent

      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          // --- JWT is added here ---
          'Authorization': `Bearer ${jwtToken}`, 
          // NOTE: Do NOT set 'Content-Type': 'multipart/form-data'. 
          // The browser automatically sets it, including the correct boundary, when using FormData.
        },
        body: formData, // FormData (only file) is here
      });

      const data: ApiResponse = await res.json();
      setResponse(data);

      if (res.ok && data.success) {
        toast({
          title: TEXT.successTitle,
          description: data.message || config.successMessage,
          className: "bg-green-500 text-white"
        });
      } else {
        toast({
          variant: "destructive",
          title: TEXT.errorTitle,
          description: data.error || data.message || config.failureMessage,
        });
      }

    } catch (error: any) {
      console.error("Fetch error:", error);
      setResponse({
        success: false,
        error: `${TEXT.networkError} ${error.message}`,
      });
      toast({
        variant: "destructive",
        title: TEXT.errorTitle,
        description: `${TEXT.networkError} ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="yd-container animate-fade-in">
      <h2 className="yd-section-title mb-2">{config.title}</h2>
      <p className="text-muted-foreground mb-6">{TEXT.subtitle}</p>
      <YDCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Email Row (Read-only) remains for display/user info */}
          <div className="space-y-2">
            <Label htmlFor="adminEmail">{TEXT.emailLabel}</Label>
            <Input
              id="adminEmail"
              type="email"
              value={adminEmail}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          {/* CSV File Upload Row */}
          <div className="space-y-2">
            <Label htmlFor="file">{config.fileLabel}</Label>
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-input hover:border-primary/30'
                }`}
            >
              <input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              {file ? (
                <div className="flex items-center space-x-2 text-primary">
                  <FileText size={20} />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    title={TEXT.clearFile}
                    onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                    className="text-destructive hover:text-destructive/80 p-1"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload size={24} className="mx-auto mb-2" />
                  {TEXT.dragDropText}
                </div>
              )}
            </div>
          </div>

          <YDButton type="submit" className="w-full" disabled={isLoading || !isAdmin || !file}>
            {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            {isLoading ? TEXT.uploading : config.buttonText}
          </YDButton>
        </form>
      </YDCard>

      {response && (
        <YDCard className="mt-6 p-6">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">{TEXT.responseTitle}</h3>
          <div className="space-y-2">
            <p className="font-medium flex items-center">
              {response.success ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <XCircle className="h-4 w-4 mr-2 text-destructive" />}
              {response.success ? TEXT.successTitle : TEXT.errorTitle}
            </p>

            <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm">
              {response.message && <p>{response.message}</p>}
              {response.recordsImported !== undefined && <p>{TEXT.recordsProcessed} {response.recordsImported}</p>}
              {response.error && <p className="text-destructive font-mono break-all">{response.error}</p>}
              {response.details && <p className="text-destructive font-mono break-all">{response.details}</p>}
            </div>
          </div>
        </YDCard>
      )}
    </div>
  );
}
export default BulkOperationForm;