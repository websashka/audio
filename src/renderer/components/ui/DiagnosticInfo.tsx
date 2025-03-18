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
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Результаты диагностики:</div>
      
      {diagnosticResults.issues.length > 0 && (
        <>
          <div style={{ fontWeight: 500 }}>Обнаруженные проблемы:</div>
          <ul style={{ margin: '5px 0' }}>
            {diagnosticResults.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </>
      )}
      
      {diagnosticResults.solutions.length > 0 && (
        <>
          <div style={{ fontWeight: 500, marginTop: '5px' }}>Рекомендации:</div>
          <ul style={{ margin: '5px 0' }}>
            {diagnosticResults.solutions.map((solution, index) => (
              <li key={index}>{solution}</li>
            ))}
          </ul>
        </>
      )}
      
      <DiagnosticCloseButton onClick={onClose}>
        Закрыть
      </DiagnosticCloseButton>
    </DiagnosticContainer>
  );
};

export default DiagnosticInfo; 