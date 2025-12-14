// File: BulkUserUpdate.tsx

import React, { FC, useMemo } from 'react'; // <-- Import useMemo
import BulkOperationForm from "../../components/admin/BulkOperationForm";
import { TEXT, OperationConfig, BASE_API_URL } from "./BulkUploadPage";

const BulkUserUpdate: FC = () => {
  const config: OperationConfig = useMemo(() => ({
    title: TEXT.userUpdateTitle,
    fileLabel: TEXT.userUpdateFileLabel,
    buttonText: TEXT.userUpdateButtonLabel,
    endpoint: `${BASE_API_URL}/api/update-csv`,
    successMessage: TEXT.userUpdateSuccess,
    failureMessage: TEXT.userFailure,
  }), []);

  return <BulkOperationForm config={config} />;
};

export default BulkUserUpdate;