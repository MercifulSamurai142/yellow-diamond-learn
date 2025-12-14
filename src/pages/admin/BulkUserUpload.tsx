// File: BulkUserUpload.tsx

import React, { FC, useMemo } from 'react'; // <-- Import useMemo
import BulkOperationForm from "../../components/admin/BulkOperationForm";
import { TEXT, OperationConfig, BASE_API_URL } from "./BulkUploadPage"; 

// The component acts as the wrapper/container
const BulkUserUpload: FC = () => {
  // Define the specific configuration for THIS operation INSIDE the component
  // Use useMemo to ensure TEXT and BASE_API_URL are initialized and prevent re-creation on every render
  const config: OperationConfig = useMemo(() => ({
    title: TEXT.userUploadTitle,
    fileLabel: TEXT.userUploadFileLabel,
    buttonText: TEXT.userUploadButtonLabel,
    endpoint: `${BASE_API_URL}/api/import-csv`,
    successMessage: TEXT.userUploadSuccess,
    failureMessage: TEXT.userFailure,
  }), []); // Empty dependency array means config is only created once

  return <BulkOperationForm config={config} />;
};

export default BulkUserUpload;