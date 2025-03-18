import { useState, useCallback } from 'react';
import { OpenAIResponse } from '../types';
import openaiService from '../services/openai';

export function useSubtitles() {
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  // Обработка сообщения от OpenAI и извлечение субтитров
  const handleMessage = useCallback((data: string) => {
    try {
      const parsedData: OpenAIResponse = openaiService.parseResponse(data);
      
      // Для сообщений типа response.done используем транскрипт как субтитры
      if (parsedData.type === 'response.done') {
        const transcript = openaiService.extractTranscript(parsedData);
        if (transcript) {
          setCurrentSubtitle(transcript);
          console.log('Отображаем субтитры из transcript:', transcript);
          return;
        }
      }
      
      // Обработка сообщений с текстовым содержимым
      if (parsedData.message?.content) {
        setCurrentSubtitle(parsedData.message.content);
        console.log('Отображаем субтитры из message.content:', parsedData.message.content);
        return;
      }
      
      // Обработка альтернативного формата сообщений
      if (parsedData.item?.content && Array.isArray(parsedData.item.content)) {
        const textContent = parsedData.item.content
          .filter((c: any) => c.type === 'text' || c.type === 'input_text')
          .map((c: any) => c.text)
          .join(' ');
        
        if (textContent) {
          setCurrentSubtitle(textContent);
          console.log('Отображаем субтитры из item.content:', textContent);
          return;
        }
      }
      
      // Обработка прямого текстового контента
      if (typeof parsedData.content === 'string') {
        setCurrentSubtitle(parsedData.content);
        console.log('Отображаем субтитры из content:', parsedData.content);
        return;
      }
      
      // Обработка ошибок - показываем сообщение об ошибке и автоматически скрываем
      if (parsedData.type === 'error' || parsedData.status === 'error') {
        const errorMessage = parsedData.error?.message || 'Ошибка соединения';
        setCurrentSubtitle(`⚠️ ${errorMessage}`);
        setTimeout(() => setCurrentSubtitle(''), 3000);
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения для субтитров:', error);
    }
  }, []);
  
  // Очистка субтитров
  const clearSubtitles = useCallback(() => {
    setCurrentSubtitle('');
  }, []);
  
  // Установка субтитров с таймером
  const setTemporarySubtitle = useCallback((text: string, duration: number = 3000) => {
    setCurrentSubtitle(text);
    setTimeout(() => setCurrentSubtitle(''), duration);
  }, []);
  
  return {
    currentSubtitle,
    handleMessage,
    clearSubtitles,
    setTemporarySubtitle
  };
} 