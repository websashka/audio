import React from 'react';
import {
  RecordButton,
  StopButton,
  VadSettingsContainer,
  VadSettingsTitle,
  VadSettingsSlider,
  VadSettingsHelp,
  ApplySettingsButton,
  ActionButtonsContainer
} from './Styles';

interface AudioControlsProps {
  isRecording: boolean;
  silenceDuration: number;
  setSilenceDuration: (value: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  updateSessionSettings: () => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isRecording,
  silenceDuration,
  setSilenceDuration,
  startRecording,
  stopRecording,
  updateSessionSettings
}) => {
  return (
    <>
      {isRecording ? (
        <ActionButtonsContainer>
          <StopButton onClick={stopRecording}>
            Stop Recording
          </StopButton>

          <VadSettingsContainer>
            <VadSettingsTitle>
              VAD Settings (Voice Activity Detection)
            </VadSettingsTitle>
            
            <VadSettingsSlider>
              <span style={{ fontSize: '13px' }}>Silence Duration (ms):</span>
              <input 
                type="range" 
                min="200" 
                max="2000" 
                step="100" 
                value={silenceDuration} 
                onChange={(e) => setSilenceDuration(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '13px', minWidth: '40px', textAlign: 'right' }}>{silenceDuration}</span>
            </VadSettingsSlider>
            
            <VadSettingsHelp>
              Higher value means longer silence before ending speech detection
            </VadSettingsHelp>
          </VadSettingsContainer>
          
          <ApplySettingsButton onClick={updateSessionSettings}>
            Apply Silence Detection Settings
          </ApplySettingsButton>
        </ActionButtonsContainer>
      ) : (
        <RecordButton onClick={startRecording}>
          Start Recording
        </RecordButton>
      )}
    </>
  );
};

export default AudioControls; 