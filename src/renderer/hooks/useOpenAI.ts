import { useState, useRef, useCallback } from 'react';
import { ResponseLogItem, OpenAIResponse } from '../types';
import openaiService, { WebRTCConnectResult } from '../services/openai';
import { useSubtitles } from './useSubtitles';

export function useOpenAI() {
  const [isRecording, setIsRecording] = useState(false);
  const [silenceDuration, setSilenceDuration] = useState(600);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [openaiResponses, setOpenaiResponses] = useState<ResponseLogItem[]>([]);
  const [responseFilter, setResponseFilter] = useState<'all' | 'message' | 'error' | 'other'>('all');
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const responsesContainerRef = useRef<HTMLDivElement>(null);
  
  const { handleMessage, clearSubtitles } = useSubtitles();
  
  // Начало записи и подключение к OpenAI
  const startRecording = useCallback(async (selectedSource: string) => {
    try {
      // Очищаем предыдущее соединение, если оно есть
      if (peerConnection.current) {
        openaiService.closeConnection(
          peerConnection.current, 
          dataChannel.current as RTCDataChannel, 
          audioElement.current as HTMLAudioElement
        );
      }
      
      // Настраиваем WebRTC соединение
      const connection: WebRTCConnectResult = await openaiService.setupWebRTCConnection(selectedSource);
      
      peerConnection.current = connection.peerConnection;
      dataChannel.current = connection.dataChannel;
      audioElement.current = connection.audioElement;
      
      // Настраиваем обработчик аудио треков
      peerConnection.current.ontrack = (e) => {
        console.log('Получен аудиотрек от OpenAI:', e.streams[0]);
        // Не воспроизводим аудио, вместо этого подключаем к невидимому элементу
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
          audioElement.current.play().catch(err => {
            console.error('Ошибка инициализации аудио:', err);
          });
        }
      };
      
      // Настраиваем обработчики data channel
      dataChannel.current.onopen = () => {
        console.log('DataChannel открыт, соединение установлено');
        if (dataChannel.current && dataChannel.current.readyState === 'open') {
          openaiService.initializeSession(dataChannel.current, silenceDuration);
        }
      };
      
      dataChannel.current.onclose = () => console.log('DataChannel закрыт');
      dataChannel.current.onerror = (error) => console.error('DataChannel ошибка:', error);
      
      // Обработка входящих сообщений 
      dataChannel.current.addEventListener("message", (e) => {
        try {
          console.log('Получено сырое сообщение от OpenAI:', e.data);
          
          // Обрабатываем сообщение для субтитров
          handleMessage(e.data);
          
          // Разбираем JSON данные
          const data: OpenAIResponse = JSON.parse(e.data);
          
          // Добавляем временную метку, если её нет
          if (!data.timestamp) {
            data.timestamp = new Date().toLocaleTimeString();
          }
          
          console.log('Разобранное сообщение от OpenAI:', data);
          
          let responseContent: string | null = null;
          let responseType: 'message' | 'error' | 'other' = 'other';
          let eventType: string | undefined = data.type;
          
          // Обработка различных типов сообщений
          if (data.type === 'response.done') {
            const transcript = openaiService.extractTranscript(data);
            if (transcript) {
              responseContent = `Получен ответ: ${transcript}`;
              responseType = 'message';
            } else {
              responseContent = `Получен ответ без транскрипта: ${JSON.stringify(data, null, 2)}`;
              responseType = 'other';
            }
          } else if (data.type === 'message' && data.message?.content) {
            responseContent = data.message.content;
            responseType = 'message';
          } else if (data.type === 'conversation.updated' && data.message?.content) {
            responseContent = data.message.content;
            responseType = 'message';
          } else if (data.type === 'conversation.item.appended' && data.message?.content) {
            responseContent = `Новое сообщение: ${data.message.content}`;
            responseType = 'message';
          } else if (data.type === 'conversation.item.completed' && data.message?.content) {
            responseContent = `Получен ответ: ${data.message.content}`;
            responseType = 'message';
          } else if (data.type === 'error' || data.status === 'error') {
            responseContent = `Ошибка: ${data.error?.message || 'Неизвестная ошибка'}`;
            responseType = 'error';
            setErrorMessage(data.error?.message || 'Ошибка соединения');
            setShowError(true);
            setTimeout(() => setShowError(false), 3500);
          } else if (typeof data.content === 'string') {
            responseContent = data.content;
            responseType = 'message';
          } else if (data.type === 'session.created' || data.type === 'session.updated') {
            responseContent = `Сессия ${data.type === 'session.created' ? 'создана' : 'обновлена'}: ${JSON.stringify(data, null, 2)}`;
            responseType = 'other';
          } else if (data.item?.content && Array.isArray(data.item.content)) {
            // Обработка формата с массивом content
            const textContent = data.item.content
              .filter((c: any) => c.type === 'text' || c.type === 'input_text')
              .map((c: any) => c.text)
              .join(' ');
            
            if (textContent) {
              responseContent = textContent;
              responseType = 'message';
            } else {
              responseContent = `Получены данные: ${JSON.stringify(data)}`;
              responseType = 'other';
            }
          } else {
            responseContent = `Получены данные: ${JSON.stringify(data)}`;
            responseType = 'other';
          }
          
          if (responseContent) {
            const now = new Date();
            const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            setOpenaiResponses((prev) => [...prev, {
              content: responseContent as string,
              timestamp,
              type: responseType,
              eventType
            }]);
          }
        } catch (error) {
          console.error('Ошибка при обработке сообщения от OpenAI:', error, 'Сырые данные:', e.data);
          
          const now = new Date();
          const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          setOpenaiResponses((prev) => [...prev, {
            content: `Ошибка обработки данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            timestamp,
            type: 'error',
            eventType: 'parse_error'
          }]);
        }
      });
      
      // Создаем SDP оффер
      await openaiService.createOffer(peerConnection.current);
      
      // Получаем токен и подключаемся к API
      const tokenData = await openaiService.getEphemeralToken();
      await openaiService.connectToOpenAI(peerConnection.current, tokenData.client_secret.value);
      
      // Устанавливаем состояние записи
      setIsRecording(true);
      window.electron.startRecording();
    } catch (error) {
      console.error('Ошибка при запуске записи:', error);
      setErrorMessage(`Ошибка записи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
      
      // Очищаем ресурсы при ошибке
      if (peerConnection.current && dataChannel.current && audioElement.current) {
        openaiService.closeConnection(
          peerConnection.current, 
          dataChannel.current, 
          audioElement.current
        );
      }
    }
  }, [silenceDuration, handleMessage]);
  
  // Остановка записи
  const stopRecording = useCallback(async () => {
    try {
      if (peerConnection.current && dataChannel.current && audioElement.current) {
        openaiService.closeConnection(
          peerConnection.current, 
          dataChannel.current, 
          audioElement.current
        );
        
        peerConnection.current = null;
        dataChannel.current = null;
        audioElement.current = null;
      }
      
      // Очищаем субтитры при остановке записи
      clearSubtitles();
      setIsRecording(false);
    } catch (error) {
      console.error('Ошибка при остановке записи:', error);
    }
  }, [clearSubtitles]);
  
  // Обновление настроек сессии
  const updateSessionSettings = useCallback(() => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      setErrorMessage('Нет соединения с OpenAI. Сначала начните запись.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
      return;
    }
    
    openaiService.updateSessionSettings(dataChannel.current, silenceDuration);
  }, [silenceDuration]);
  
  // Отправка текстового сообщения
  const sendTextMessage = useCallback((text: string) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      setErrorMessage('Нет соединения с OpenAI. Сначала начните запись.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3500);
      return;
    }
    
    openaiService.sendTextMessage(dataChannel.current, text);
  }, []);
  
  // Очистка списка ответов
  const clearResponses = useCallback(() => {
    setOpenaiResponses([]);
  }, []);
  
  // Сохранение ответов в файл
  const saveResponsesToFile = useCallback(() => {
    if (openaiResponses.length === 0) return;
    
    const content = openaiResponses.map(response => 
      `[${response.timestamp}] ${response.type.toUpperCase()}${response.eventType ? ` (${response.eventType})` : ''}: ${response.content}`
    ).join('\n\n');
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `openai_responses_${timestamp}.txt`;
    
    window.electron.saveTextToFile(content, filename)
      .then((savedPath: string | null) => {
        if (savedPath) {
          setSavedFilePath(savedPath);
          setShowSaveConfirmation(true);
          setTimeout(() => setShowSaveConfirmation(false), 3500);
        }
      })
      .catch((error: Error) => {
        setErrorMessage(`Ошибка при сохранении ответов: ${error.message}`);
        setShowError(true);
        setTimeout(() => setShowError(false), 3500);
      });
  }, [openaiResponses]);
  
  // Скроллим к последнему сообщению при обновлении списка
  const scrollToLatestResponse = useCallback(() => {
    if (responsesContainerRef.current && openaiResponses.length > 0) {
      responsesContainerRef.current.scrollTop = responsesContainerRef.current.scrollHeight;
    }
  }, [openaiResponses.length]);
  
  return {
    isRecording,
    silenceDuration,
    setSilenceDuration,
    errorMessage,
    showError,
    setShowError,
    openaiResponses,
    responseFilter,
    setResponseFilter,
    savedFilePath,
    showSaveConfirmation,
    responsesContainerRef,
    startRecording,
    stopRecording,
    updateSessionSettings,
    sendTextMessage,
    clearResponses,
    saveResponsesToFile,
    scrollToLatestResponse
  };
} 