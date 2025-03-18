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
            Остановить запись
          </StopButton>

          <VadSettingsContainer>
            <VadSettingsTitle>
              Настройка VAD (обнаружения тишины)
            </VadSettingsTitle>
            
            <VadSettingsSlider>
              <span style={{ fontSize: '13px' }}>Длительность тишины (мс):</span>
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
              Чем выше значение, тем дольше тишина перед завершением речи
            </VadSettingsHelp>
          </VadSettingsContainer>
          
          <ApplySettingsButton onClick={updateSessionSettings}>
            Применить настройки обнаружения тишины
          </ApplySettingsButton>
        </ActionButtonsContainer>
      ) : (
        <RecordButton onClick={startRecording}>
          Начать запись
        </RecordButton>
      )}
    </>
  );
};

export default AudioControls; 