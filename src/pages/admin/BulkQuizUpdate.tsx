// File: BulkQuizUpload.tsx

import React, { FC, useMemo } from 'react'; // <-- Import useMemo
import BulkOperationForm from "../../components/admin/BulkOperationForm";
import { TEXT, OperationConfig, BASE_API_URL } from "./BulkUploadPage";

const BulkQuizUpload: FC = () => {
  const config: OperationConfig = useMemo(() => ({
    title: TEXT.quizUploadTitle,
    fileLabel: TEXT.quizUploadFileLabel,
    buttonText: TEXT.quizUploadButtonLabel,
    endpoint: `${BASE_API_URL}/api/import-quiz`,
    successMessage: TEXT.quizUploadSuccess,
    failureMessage: TEXT.quizFailure,
  }), []);

  return <BulkOperationForm config={config} />;
};

export default BulkQuizUpload;