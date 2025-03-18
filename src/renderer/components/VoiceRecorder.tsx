import React, { useEffect } from 'react';
import {
  RecorderContainer,
  Header,
  CloseButton,
  TabContainer,
  Tab,
  Timer,
  ActionBar,
  ActionButton,
  SubtitlesContainer
} from './ui/Styles';

// Импорты компонентов
import SourceSelection from './ui/SourceSelection';
import AudioControls from './ui/AudioControls';
import ResponsesList from './ui/ResponsesList';
import Notifications from './ui/Notifications';
import DiagnosticInfo from './ui/DiagnosticInfo';
import AudioDriverInfo from './ui/AudioDriverInfo';
import AudioTroubleshooting from './ui/AudioTroubleshooting';


import { useAudio } from '../hooks/useAudio';
import { useOpenAI } from '../hooks/useOpenAI';
import { useTimer } from '../hooks/useTimer';

const VoiceRecorder: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'Meeting' | 'Note'>('Meeting');

  const {
    isMacOS,
    desktopSources,
    selectedSource,
    setSelectedSource,
    audioDriverMessage,
    diagnosticResults,
    showDiagnostic,
    setShowDiagnostic,
    runDiagnostic
  } = useAudio();
  
  const {
    isRecording,
    silenceDuration,
    setSilenceDuration,
    errorMessage,
    showError,
    openaiResponses,
    responseFilter,
    setResponseFilter,
    savedFilePath,
    showSaveConfirmation,
    responsesContainerRef,
    startRecording: startOpenAI,
    stopRecording: stopOpenAI,
    updateSessionSettings,
    clearResponses,
    saveResponsesToFile,
    scrollToLatestResponse,
    currentSubtitle
  } = useOpenAI();
  
  const { timer, startTimer, stopTimer } = useTimer();
  
  // Запуск записи
  const startRecording = async () => {
    startTimer();
    await startOpenAI(selectedSource);
  };
  
  // Остановка записи
  const stopRecording = async () => {
    stopTimer();
    await stopOpenAI();
  };
  
  // Открытие настроек звука
  const openAudioSettings = () => {
    window.electron.openAudioSettings();
  };
  
  // Эффект для скролла к последнему сообщению
  useEffect(() => {
    scrollToLatestResponse();
  }, [openaiResponses.length, scrollToLatestResponse]);
  
  return (
    <RecorderContainer>
      <Header>
        <CloseButton onClick={() => window.electron.closeApp()}>×</CloseButton>
      </Header>

      <AudioDriverInfo 
        audioDriverMessage={audioDriverMessage}
        isMacOS={isMacOS}
      />

      <DiagnosticInfo
        showDiagnostic={showDiagnostic}
        diagnosticResults={diagnosticResults}
        onClose={() => setShowDiagnostic(false)}
      />

      <TabContainer>
        <Tab active={activeTab === 'Meeting'} onClick={() => setActiveTab('Meeting')}>
          Meeting
        </Tab>
        <Tab active={activeTab === 'Note'} onClick={() => setActiveTab('Note')}>
          Note
        </Tab>
      </TabContainer>

      <SourceSelection
        isMacOS={isMacOS}
        desktopSources={desktopSources}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        isRecording={isRecording}
      />

      <Timer>{timer}</Timer>

      <ResponsesList
        responses={openaiResponses}
        filter={responseFilter}
        setFilter={setResponseFilter}
        onClear={clearResponses}
        onSave={saveResponsesToFile}
        containerRef={responsesContainerRef}
      />

      <AudioControls
        isRecording={isRecording}
        silenceDuration={silenceDuration}
        setSilenceDuration={setSilenceDuration}
        startRecording={startRecording}
        stopRecording={stopRecording}
        updateSessionSettings={updateSessionSettings}
      />

      <AudioTroubleshooting
        isMacOS={isMacOS}
        isRecording={isRecording}
        onOpenAudioSettings={openAudioSettings}
        onRunDiagnostic={runDiagnostic}
      />

      <Notifications
        showSaveConfirmation={showSaveConfirmation}
        savedFilePath={savedFilePath}
        showError={showError}
        errorMessage={errorMessage}
      />

      <ActionBar>
        <ActionButton>
          📝 Заметки
        </ActionButton>
        <ActionButton>
          📸 Скриншот
        </ActionButton>
        <ActionButton>
          ⚙️ Настройки
        </ActionButton>
      </ActionBar>
    </RecorderContainer>
  );
};

export default VoiceRecorder;