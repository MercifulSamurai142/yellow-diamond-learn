import { useState, useRef } from "react";
import { YDCard } from "@/components/ui/YDCard";
import YDButton from "@/components/ui/YDButton";
import { Loader2, Upload, FileText, XCircle, CheckCircle, Save, RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import * as Papa from 'papaparse';

// Define the required columns and the subset that will be inserted
const REQUIRED_CSV_HEADERS = ["psl_id", "name", "email", "designation", "region", "state", "role"];
type StagingInsert = TablesInsert<'user_import_staging'>;

interface UploadStatus {
  status: 'initial' | 'parsing' | 'validating' | 'uploading' | 'complete';
  message: string;
  isError: boolean;
  details: string[];
  recordsProcessed: number;
}

interface BulkUploadProps {
    actionType: 'insert' | 'update';
    // This prop is used to notify the parent page to clear status on tab switch if needed
    onStatusChange: (status: UploadStatus) => void; 
}

const BulkUpload = ({ actionType, onStatusChange }: BulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [currentStatus, setCurrentStatus] = useState<UploadStatus>({
    status: 'initial', message: 'Ready for upload.', isError: false, details: [], recordsProcessed: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TEXT = {
    title: actionType === 'insert' ? "Insert New Users" : "Update Existing Users",
    subtitle: actionType === 'insert' 
        ? "Upload new user records. Fails if any psl_id already exists."
        : "Upload to update existing user records. Fails if any psl_id is missing.",
    fileInputLabel: "Select CSV File (psl_id, name, email, ...)",
    dragDropText: "Drag 'n' drop a CSV file here, or click to select",
    clearFile: "Clear File",
    buttonText: actionType === 'insert' ? "Start Insert (Insert Only)" : "Start Update (Update Only)",
    uploading: (action: string) => `${action}ing...`,
    errorTitle: "Upload Failed",
    updateOnlyMissingError: "Cannot update: One or more provided P.S.L.-IDs do not exist in the staging table. Insertion failed.",
    insertSuccess: (count: number) => `Successfully inserted ${count} records.`,
    updateSuccess: (count: number) => `Successfully updated ${count} records.`,
    duplicateError: "A record with a duplicate psl_id or email already exists. Insertion failed.",
    processingMessage: (status: string) => `Processing: ${status}...`
  };

  const handleStatusUpdate = (update: Partial<UploadStatus>) => {
      const newStatus = { ...currentStatus, ...update };
      setCurrentStatus(newStatus);
      onStatusChange(newStatus); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      handleStatusUpdate({ status: 'initial', message: 'File selected: ' + selectedFile.name, isError: false, details: [], recordsProcessed: 0 });
    } else {
      setFile(null);
      toast({ title: "Invalid File Type", description: "Please select a CSV file.", variant: "destructive" });
    }
  };

  const handleClearFile = () => {
    setFile(null);
    handleStatusUpdate({ status: 'initial', message: 'Ready for upload.', isError: false, details: [], recordsProcessed: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const validateRow = (row: any, index: number, headers: string[]): string | StagingInsert => {
    const requiredForInsert = ["psl_id", "name", "email"];

    for (const key of requiredForInsert) {
      if (!row[key] || String(row[key]).trim() === '') {
        return `Row ${index + 1}: Missing or empty value for required field '${key}'.`;
      }
    }

    if (!String(row.email).includes('@') || !String(row.email).includes('.')) {
      return `Row ${index + 1}: Invalid email format for '${row.email}'.`;
    }

    const dataToInsert: StagingInsert = {
        psl_id: String(row.psl_id).trim(),
        name: String(row.name).trim(),
        email: String(row.email).toLowerCase().trim(),
    };

    return dataToInsert;
  };


  const startProcessing = () => {
    if (!file) return;
    
    setIsProcessing(true);
    handleStatusUpdate({ status: 'parsing', message: 'Parsing CSV...' });

    const BATCH_SIZE = 1000;
    let totalRecordsProcessed = 0;
    const allValidationErrors: string[] = [];
    let initialHeaders: string[] = [];


    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().trim(),
      chunkSize: BATCH_SIZE * 100, // Read a bigger chunk for internal processing, but parse/validate per BATCH_SIZE
      chunk: async (results, parser) => {
        
        // --- Setup for the first chunk ---
        if (totalRecordsProcessed === 0) {
            initialHeaders = results.meta.fields || [];
            const missing = REQUIRED_CSV_HEADERS.filter(req => !initialHeaders.includes(req));

            if (missing.length > 0) {
                parser.abort(); // Stop parsing on error
                handleStatusUpdate({ status: 'complete', message: `Missing required headers: ${missing.join(', ')}.`, isError: true, details: [`Missing required headers: ${missing.join(', ')}.`], recordsProcessed: 0 });
                setIsProcessing(false);
                return;
            }
        }
        
        initialHeaders = initialHeaders.length > 0 ? initialHeaders : REQUIRED_CSV_HEADERS;

        const inserts: StagingInsert[] = [];
        let chunkValidationErrors: string[] = [];

        results.data.forEach((row, index) => {
          const validationResult = validateRow(row, totalRecordsProcessed + index, initialHeaders);
          if (typeof validationResult === 'string') {
            chunkValidationErrors.push(validationResult);
            allValidationErrors.push(validationResult);
          } else {
            inserts.push(validationResult);
          }
        });
        
        if (allValidationErrors.length > 50) { // Safety abort threshold
             parser.abort();
             handleStatusUpdate({ status: 'complete', message: `Aborting: Too many (${allValidationErrors.length}) validation errors found.`, isError: true, details: allValidationErrors.slice(0, 50), recordsProcessed: totalRecordsProcessed });
             setIsProcessing(false);
             return;
        }

        if (inserts.length > 0) {
            parser.pause(); 
            totalRecordsProcessed += inserts.length;
            await bulkDatabaseOperation(inserts, totalRecordsProcessed);
            parser.resume();
        }
        
        // FIX IS HERE: Pass object directly
        handleStatusUpdate({ 
            message: `Validated and processed ${totalRecordsProcessed} rows...`,
            recordsProcessed: totalRecordsProcessed,
            details: allValidationErrors
        });
      },
      complete: async () => {
        // This 'complete' only runs after all chunks are done (or aborted)
        if (isProcessing) { 
            const finalMessage = allValidationErrors.length > 0 
                ? `Finished with errors. Total rows processed: ${currentStatus.recordsProcessed}`
                : `Successfully finished processing all rows. Total processed: ${currentStatus.recordsProcessed}`;
            
            handleStatusUpdate({ 
                status: 'complete', 
                message: finalMessage,
                isError: allValidationErrors.length > 0, 
                details: allValidationErrors, 
                recordsProcessed: currentStatus.recordsProcessed 
            });
        }
        setIsProcessing(false);
        handleClearFile();
      },
      error: (err) => {
        handleStatusUpdate({ status: 'complete', message: `Fatal CSV Error: ${err.message}`, isError: true, details: [`Fatal CSV Error: ${err.message}`], recordsProcessed: currentStatus.recordsProcessed });
        setIsProcessing(false);
      }
    });
  };

  const bulkDatabaseOperation = async (inserts: StagingInsert[], currentTotalProcessed: number) => {
    handleStatusUpdate({ status: 'uploading', message: `Submitting batch of ${inserts.length} records... Total: ${currentTotalProcessed}`});
    
    try {
      let dbOperation;
      
      if (actionType === 'insert') {
          // INSERT ONLY - relies on DB constraint to throw error for duplicates
          dbOperation = await supabase
              .from('user_import_staging')
              .insert(inserts);
      } else {
          // UPDATE ONLY (FAIL IF MISSING) LOGIC
          const pslIdsToUpdate = inserts.map(i => i.psl_id);

          // Step 1: Check if all psl_id exist in the DB.
          const { data: existingRecords, error: fetchError } = await supabase
              .from('user_import_staging')
              .select('psl_id')
              .in('psl_id', pslIdsToUpdate);

          if (fetchError) throw fetchError;

          const existingPslIds = new Set(existingRecords?.map(r => r.psl_id) || []);

          if (existingPslIds.size < pslIdsToUpdate.length) {
              // If the number of existing records is less than the number of records to update, then some are missing.
              throw { code: 'CUSTOM_MISSING_RECORD', message: TEXT.updateOnlyMissingError };
          }
          
          // Step 2: Since we confirmed all exist, UPSERT is used which functions as an UPDATE.
           dbOperation = await supabase
              .from('user_import_staging')
              .upsert(inserts, { onConflict: 'psl_id' }); 
      }
      
      const { error: dbError } = dbOperation;

      if (dbError) throw dbError;

      const successMessage = actionType === 'insert' 
          ? TEXT.insertSuccess(currentTotalProcessed) 
          : TEXT.updateSuccess(currentTotalProcessed);

      // FIX: Pass object directly
      handleStatusUpdate({ 
        message: successMessage,
        isError: false, 
        recordsProcessed: currentTotalProcessed 
      });
      toast({ title: "Batch Success", description: `Batch of ${inserts.length} processed.`, duration: 1500 });
      
    } catch (dbError: any) {
        let errorMessage = "Database Operation Failed.";
        
        if (dbError.code === 'CUSTOM_MISSING_RECORD') {
            errorMessage = dbError.message;
        }
        // Check for common PostgreSQL/Supabase unique constraint violation error code
        else if (dbError.code === '23505') {
            errorMessage = TEXT.duplicateError;
        } else {
            errorMessage = `Database error: ${dbError.message}`;
        }

        handleStatusUpdate({ 
            status: 'complete', 
            message: `Aborted processing due to database error: ${errorMessage}`,
            isError: true, 
            details: [`Batch error at row ${currentTotalProcessed}: ${dbError.message}`], 
            recordsProcessed: currentTotalProcessed - inserts.length // Only count successfully submitted rows
        });
        setIsProcessing(false);
        throw new Error("Batch processing aborted.");
    }
  };


  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">{TEXT.processingMessage(currentStatus.status)}</p>
            <p className="text-sm text-muted-foreground mt-1">{currentStatus.message}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <YDCard className={`p-6 ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{TEXT.subtitle}</p>
            <Label htmlFor="csvFile">{TEXT.fileInputLabel}</Label>
            <div
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange({ target: { files: e.dataTransfer.files } } as any); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-10 rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-input'}`}
            >
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="hidden" disabled={isProcessing} />
              {file ? 
                  <div className="flex items-center justify-center gap-2 text-primary">
                      <FileText /> {file.name}
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleClearFile(); }} className="text-destructive hover:text-destructive/80 p-1" disabled={isProcessing}>
                        <XCircle size={16} />
                      </button>
                  </div> 
                  : TEXT.dragDropText}
            </div>
            
            <YDButton 
              onClick={startProcessing}
              disabled={isProcessing || !file}
              className="w-full"
              variant={actionType === 'insert' ? 'default' : 'outline'}
            >
              {actionType === 'insert' ? <Save className="mr-2" /> : <RotateCw className="mr-2" />}
              {TEXT.buttonText}
            </YDButton>
          </div>
        </YDCard>
        
        {currentStatus.status !== 'initial' && (
          <YDCard className={`p-4 ${currentStatus.isError ? 'border-destructive' : 'border-green-500'}`}>
            <div className="font-medium flex items-center gap-2">
              {currentStatus.isError ? <XCircle className="text-destructive" /> : <CheckCircle className="text-green-500" />}
              {currentStatus.message}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
               {currentStatus.recordsProcessed} records processed.
            </div>
            {currentStatus.details.length > 0 && (
              <div className="mt-2 p-2 border rounded-md bg-red-50 max-h-40 overflow-y-auto">
                <ul className="text-xs text-destructive list-disc list-inside space-y-1">
                  {currentStatus.details.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            )}
          </YDCard>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;