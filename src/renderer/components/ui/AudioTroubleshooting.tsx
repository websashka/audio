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
      Audio capture issues? Open <span style={{ color: '#4285f4' }}>sound settings</span>
      <div style={{ marginTop: '5px' }}>
        or <DiagnosticLink
          onClick={(e) => {
            e.stopPropagation();
            onRunDiagnostic();
          }}
        >
          run diagnostics
        </DiagnosticLink>
      </div>
    </AudioTroubleshootingLink>
  );
};

export default AudioTroubleshooting; 