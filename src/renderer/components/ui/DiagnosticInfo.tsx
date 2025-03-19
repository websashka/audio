import React from 'react';
import { DiagnosticContainer, DiagnosticCloseButton } from './Styles';

interface DiagnosticInfoProps {
  showDiagnostic: boolean;
  diagnosticResults: { issues: string[], solutions: string[] } | null;
  onClose: () => void;
}

const DiagnosticInfo: React.FC<DiagnosticInfoProps> = ({
  showDiagnostic,
  diagnosticResults,
  onClose
}) => {
  if (!showDiagnostic || !diagnosticResults) {
    return null;
  }
  
  return (
    <DiagnosticContainer>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Diagnostic Results:</div>
      
      {diagnosticResults.issues.length > 0 && (
        <>
          <div style={{ fontWeight: 500 }}>Detected Issues:</div>
          <ul style={{ margin: '5px 0' }}>
            {diagnosticResults.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </>
      )}
      
      {diagnosticResults.solutions.length > 0 && (
        <>
          <div style={{ fontWeight: 500, marginTop: '5px' }}>Recommendations:</div>
          <ul style={{ margin: '5px 0' }}>
            {diagnosticResults.solutions.map((solution, index) => (
              <li key={index}>{solution}</li>
            ))}
          </ul>
        </>
      )}
      
      <DiagnosticCloseButton onClick={onClose}>
        Close
      </DiagnosticCloseButton>
    </DiagnosticContainer>
  );
};

export default DiagnosticInfo; 