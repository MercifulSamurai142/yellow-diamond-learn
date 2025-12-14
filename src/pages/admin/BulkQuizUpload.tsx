// File: BulkQuizUpdate.tsx

import React, { FC, useMemo } from 'react'; // <-- Import useMemo
import BulkOperationForm from "../../components/admin/BulkOperationForm";
import { TEXT, OperationConfig, BASE_API_URL } from "./BulkUploadPage";

const BulkQuizUpdate: FC = () => {
  const config: OperationConfig = useMemo(() => ({
    title: TEXT.quizUpdateTitle,
    fileLabel: TEXT.quizUpdateFileLabel,
    buttonText: TEXT.quizUpdateButtonLabel,
    endpoint: `${BASE_API_URL}/api/update-quiz`,
    successMessage: TEXT.quizUpdateSuccess,
    failureMessage: TEXT.quizFailure,
  }), []);

  return <BulkOperationForm config={config} />;
};

export default BulkQuizUpdate;