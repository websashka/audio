import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const RecorderContainer = styled.div`
  background: white;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  -webkit-app-region: drag;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  -webkit-app-region: no-drag;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 0 16px 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${(props: { active: boolean }) => props.active ? '#fff' : '#f5f5f5'};
  border-radius: 20px;
  cursor: pointer;
  font-weight: ${(props: { active: boolean }) => props.active ? '600' : '400'};
`;

const DeviceInfo = styled.div`
  background: #f5f7ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SourceSelector = styled.select`
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 16px 20px;
  width: calc(100% - 32px);
`;

const Timer = styled.div`
  text-align: center;
  font-size: 48px;
  font-weight: 500;
  margin: 40px 0;
  color: #333;
`;

const RecordButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  width: calc(100% - 32px);
  margin: 0 16px;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #3b78e7;
  }
`;

const StopButton = styled(RecordButton)`
  background: #ff4b4b;

  &:hover {
    background: #e03c3c;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  margin-top: auto;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #e9e9e9;
  }
`;

const SaveConfirmation = styled.div`
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: #4caf50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s, fadeOut 0.3s 3s forwards;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;

const ErrorMessage = styled.div`
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: #f44336;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s, fadeOut 0.3s 3s forwards;
`;

const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [activeTab, setActiveTab] = useState<'Meeting' | 'Note'>('Meeting');
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMacOS, setIsMacOS] = useState(false);
  const [desktopSources, setDesktopSources] = useState<MediaDeviceInfo[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [audioDriverMessage, setAudioDriverMessage] = useState<string | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<{ issues: string[], solutions: string[] } | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const updateTimer = () => {
    const currentTime = Math.floor((Date.now() - startTime.current) / 1000);
    setTimer(formatTime(currentTime));
  };

  useEffect(() => {
    // Проверяем, является ли ОС macOS
    window.electron.isMacOS().then(result => {
      setIsMacOS(result);
    });

    // Получаем доступные источники рабочего стола
    loadDesktopSources();
  }, []);

  const loadDesktopSources = async () => {
    try {
      const sources = await navigator.mediaDevices.enumerateDevices();
      const filteredDesktopSources = sources.filter((item) => item.kind === "audioinput");
      setDesktopSources(filteredDesktopSources);
      if (filteredDesktopSources.length > 0) {
        const entireScreen = filteredDesktopSources.find(source => source.label === "Background Music (Virtual)");
        if (entireScreen) {
          setSelectedSource(entireScreen.deviceId);
        } else {
          setSelectedSource(sources[0].deviceId);
        }
      }
    } catch (error) {
      console.error('Ошибка при получении источников рабочего стола:', error);
    }
  };

  useEffect(() => {
    if (isRecording) {
      startTime.current = Date.now();
      timerInterval.current = setInterval(updateTimer, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      chunks.current = [];
      
      if (!selectedSource && desktopSources.length > 0) {
        setSelectedSource(desktopSources[0].deviceId);
      }

      const  stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedSource },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
      
      // Проверяем, есть ли аудио треки
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        // Если аудио треков нет, останавливаем видео треки и выдаем ошибку
        stream.getVideoTracks().forEach(track => track.stop());
        
        setErrorMessage('Не удалось получить доступ к аудио. Проверьте настройки системы и разрешения браузера.');
        setShowError(true);
        setTimeout(() => setShowError(false), 3500);
        
        return;
      }
      
      console.log('Аудио треки:', audioTracks.map(track => track.label));
      
      // Создаем отдельный поток только для аудио
      const audioStream = new MediaStream(audioTracks);
      
      // Останавливаем видео треки, так как они нам не нужны
      stream.getVideoTracks().forEach(track => {
        console.log('Остановка видео трека:', track.label);
        track.stop();
      });
      
      // Настраиваем MediaRecorder для записи только аудио
      // Пробуем разные кодеки, в зависимости от поддержки браузера
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      const recorderOptions = { 
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Устанавливаем битрейт для лучшего качества
      };
      
      mediaRecorder.current = new MediaRecorder(audioStream, recorderOptions);
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      
      // Запускаем запись с интервалом в 1 секунду
      mediaRecorder.current.start(1000);
      setIsRecording(true);
      startTime.current = Date.now();
      
      mediaRecorder.current.onstop = async () => {
        // Останавливаем все оставшиеся треки
        audioStream.getTracks().forEach(track => track.stop());
        
        try {
          if (chunks.current.length === 0) {
            console.error('Нет данных для сохранения');
            return;
          }
          
          const blob = new Blob(chunks.current, { type: mimeType });
          const arrayBuffer = await blob.arrayBuffer();
          
          window.electron.sendRecordingData(new Uint8Array(arrayBuffer));
          chunks.current = [];
          
          window.electron.stopRecording();
          
          setShowSaveConfirmation(true);
          setTimeout(() => {
            setShowSaveConfirmation(false);
          }, 3500);
        } catch (error) {
          console.error('Ошибка при сохранении аудио:', error);
          setErrorMessage('Ошибка при сохранении аудио');
          setShowError(true);
          setTimeout(() => setShowError(false), 3500);
        }
      };
      
      window.electron.startRecording();
    } catch (error) {
      console.error('Ошибка при запуске записи:', error);
      setErrorMessage('Ошибка при запуске записи. Убедитесь, что вы предоставили необходимые разрешения');
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    window.electron.onTranscription((transcript) => {
      console.log('Получена транскрипция:', transcript);
    });

    window.electron.onNotes((notes) => {
      console.log('Получены заметки:', notes);
    });

    window.electron.onRecordingSaved((filePath) => {
      console.log('Запись сохранена:', filePath);
      setSavedFilePath(filePath);
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3500);
    });

    window.electron.onRecordingError((error) => {
      console.error('Ошибка записи:', error);
      setErrorMessage(error);
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
    });
    
    window.electron.onAudioDriverInfo((info) => {
      console.log('Информация о драйверах:', info);
      setAudioDriverMessage(info);
      setTimeout(() => setAudioDriverMessage(null), 10000);
    });

    // Проверяем наличие аудио-драйверов для macOS
    if (isMacOS) {
      window.electron.checkAudioDrivers().then(drivers => {
        if (!drivers.hasBlackhole && !drivers.hasSoundflower) {
          setAudioDriverMessage('Для лучшей записи системного звука в macOS рекомендуется установить BlackHole или Soundflower');
        }
      });
    }

    return () => {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
    };
  }, [isMacOS]);

  const runDiagnostic = async () => {
    try {
      setShowDiagnostic(true);
      const results = await window.electron.diagnoseAudioIssues();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Ошибка при диагностике:', error);
      setErrorMessage('Ошибка при запуске диагностики');
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
    }
  };

  return (
    <RecorderContainer>
      <Header>
        <CloseButton onClick={() => window.electron.closeApp()}>×</CloseButton>
      </Header>

      {audioDriverMessage && (
        <div style={{
          background: '#fef8e0',
          margin: '0 16px 15px',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#856404'
        }}>
          {audioDriverMessage}
          {isMacOS && (
            <div style={{ marginTop: '5px' }}>
              Рекомендуемые драйверы:
              <ul style={{ margin: '5px 0' }}>
                <li>
                  <a
                      href="#"
                      style={{ color: '#4285f4' }}
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('https://github.com/kyleneideck/BackgroundMusic', '_blank');
                      }}
                  >
                    Background Music
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    style={{ color: '#4285f4' }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://github.com/ExistentialAudio/BlackHole', '_blank');
                    }}
                  >
                    BlackHole
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {showDiagnostic && diagnosticResults && (
        <div style={{
          background: '#e3f2fd',
          margin: '0 16px 15px',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#0d47a1'
        }}>
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
          
          <div 
            style={{ 
              textAlign: 'center', 
              marginTop: '5px', 
              color: '#4285f4',
              cursor: 'pointer'
            }}
            onClick={() => setShowDiagnostic(false)}
          >
            Закрыть
          </div>
        </div>
      )}

      <TabContainer>
        <Tab active={activeTab === 'Meeting'} onClick={() => setActiveTab('Meeting')}>
          Meeting
        </Tab>
        <Tab active={activeTab === 'Note'} onClick={() => setActiveTab('Note')}>
          Note
        </Tab>
      </TabContainer>

      {isMacOS && desktopSources.length > 0 && !isRecording && (
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
      )}

      <DeviceInfo>
        <span>🔊</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>Системный звук</span>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {isMacOS ? 'Запись системного звука macOS' : 'Захват звука системы'}
          </span>
        </div>
        <span style={{ marginLeft: 'auto', color: '#4285f4', fontWeight: 500 }}>On</span>
      </DeviceInfo>

      <Timer>{timer}</Timer>

      {isRecording ? (
        <StopButton onClick={stopRecording}>
          Остановить запись
        </StopButton>
      ) : (
        <>
          <RecordButton onClick={startRecording}>
            Начать запись
          </RecordButton>
          {isMacOS && (
            <div style={{ 
              textAlign: 'center', 
              margin: '10px 16px', 
              fontSize: '13px', 
              color: '#666',
              cursor: 'pointer' 
            }}
            onClick={() => window.electron.openAudioSettings()}
            >
              Проблемы с захватом звука? Откройте <span style={{ color: '#4285f4' }}>настройки звука</span>
              <div style={{ marginTop: '5px' }}>
                или <span 
                  style={{ color: '#4285f4', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    runDiagnostic();
                  }}
                >
                  запустите диагностику
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {showSaveConfirmation && (
        <SaveConfirmation>
          Запись сохранена в {savedFilePath}
        </SaveConfirmation>
      )}

      {showError && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}

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