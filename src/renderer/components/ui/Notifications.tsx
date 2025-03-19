import React from 'react';
import { SaveConfirmation, ErrorMessage } from './Styles';

interface NotificationsProps {
  showSaveConfirmation: boolean;
  savedFilePath: string | null;
  showError: boolean;
  errorMessage: string;
}

const Notifications: React.FC<NotificationsProps> = ({
  showSaveConfirmation,
  savedFilePath,
  showError,
  errorMessage
}) => {
  return (
    <>
      {showSaveConfirmation && savedFilePath && (
        <SaveConfirmation>
          Recording saved to {savedFilePath}
        </SaveConfirmation>
      )}

      {showError && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}
    </>
  );
};

export default Notifications; 