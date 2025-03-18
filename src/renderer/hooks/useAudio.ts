import { useState, useEffect } from 'react';
import { AudioDevice } from '../types';

export function useAudio() {
  const [isMacOS, setIsMacOS] = useState(false);
  const [desktopSources, setDesktopSources] = useState<AudioDevice[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [audioDriverMessage, setAudioDriverMessage] = useState<string | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<{ issues: string[], solutions: string[] } | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Загрузка доступных источников звука
  const loadDesktopSources = async () => {
    try {
      const sources = await navigator.mediaDevices.enumerateDevices();
      const filteredDesktopSources = sources.filter((item) => item.kind === "audioinput");
      setDesktopSources(filteredDesktopSources as AudioDevice[]);
      
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

  // Диагностика проблем с аудио
  const runDiagnostic = async () => {
    try {
      setShowDiagnostic(true);
      const results = await window.electron.diagnoseAudioIssues();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Ошибка при диагностике:', error);
    }
  };

  useEffect(() => {
    // Проверяем, является ли ОС macOS
    window.electron.isMacOS().then(result => {
      setIsMacOS(result);
    });

    // Получаем доступные источники рабочего стола
    loadDesktopSources();

    // Слушаем сообщения о драйверах аудио
    window.electron.onAudioDriverInfo((info) => {
      console.log('Информация о драйверах:', info);
      setAudioDriverMessage(info);
      setTimeout(() => setAudioDriverMessage(null), 10000);
    });

    // Проверяем наличие аудио-драйверов для macOS
    setTimeout(() => {
      if (isMacOS) {
        window.electron.checkAudioDrivers().then(drivers => {
          if (!drivers.hasBlackhole && !drivers.hasSoundflower) {
            setAudioDriverMessage('Для лучшей записи системного звука в macOS рекомендуется установить BlackHole или Soundflower');
          }
        });
      }
    }, 1000);
  }, [isMacOS]);

  return { 
    isMacOS, 
    desktopSources, 
    selectedSource, 
    setSelectedSource, 
    audioDriverMessage, 
    runDiagnostic,
    diagnosticResults,
    showDiagnostic,
    setShowDiagnostic
  };
} 