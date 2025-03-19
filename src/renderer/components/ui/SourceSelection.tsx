import React from 'react';
import { AudioDevice } from '../../types';
import { SourceSelector, DeviceInfo } from './Styles';

interface SourceSelectionProps {
  isMacOS: boolean;
  desktopSources: AudioDevice[];
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  isRecording: boolean;
}

const SourceSelection: React.FC<SourceSelectionProps> = ({
  isMacOS,
  desktopSources,
  selectedSource,
  setSelectedSource,
  isRecording
}) => {
  if (!isMacOS || desktopSources.length === 0 || isRecording) {
    return (
      <DeviceInfo>
        <span>🔊</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>System Audio</span>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {isMacOS ? 'macOS system audio recording' : 'System audio capture'}
          </span>
        </div>
        <span style={{ marginLeft: 'auto', color: '#4285f4', fontWeight: 500 }}>On</span>
      </DeviceInfo>
    );
  }
  
  return (
    <>
      <SourceSelector 
        value={selectedSource} 
        onChange={(e) => setSelectedSource(e.target.value)}
      >
        {desktopSources.map(source => (
          <option key={source.deviceId} value={source.deviceId}>
            {source.label}
          </option>
        ))}
      </SourceSelector>
      
      <DeviceInfo>
        <span>🔊</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>System Audio</span>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {isMacOS ? 'macOS system audio recording' : 'System audio capture'}
          </span>
        </div>
        <span style={{ marginLeft: 'auto', color: '#4285f4', fontWeight: 500 }}>On</span>
      </DeviceInfo>
    </>
  );
};

export default SourceSelection; 