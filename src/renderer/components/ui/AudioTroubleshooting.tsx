import React from 'react';
import { AudioTroubleshootingLink, DiagnosticLink } from './Styles';

interface AudioTroubleshootingProps {
  isMacOS: boolean;
  isRecording: boolean;
  onOpenAudioSettings: () => void;
  onRunDiagnostic: () => void;
}

const AudioTroubleshooting: React.FC<AudioTroubleshootingProps> = ({
  isMacOS,
  isRecording,
  onOpenAudioSettings,
  onRunDiagnostic
}) => {
  if (isRecording || !isMacOS) {
    return null;
  }
  
  return (
    <AudioTroubleshootingLink onClick={onOpenAudioSettings}>
      Проблемы с захватом звука? Откройте <span style={{ color: '#4285f4' }}>настройки звука</span>
      <div style={{ marginTop: '5px' }}>
        или <DiagnosticLink
          onClick={(e) => {
            e.stopPropagation();
            onRunDiagnostic();
          }}
        >
          запустите диагностику
        </DiagnosticLink>
      </div>
    </AudioTroubleshootingLink>
  );
};

export default AudioTroubleshooting; 