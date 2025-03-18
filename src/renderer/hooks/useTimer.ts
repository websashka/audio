import { useState, useRef, useEffect } from 'react';

export function useTimer() {
  const [timer, setTimer] = useState('00:00');
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  // Форматирование времени в формат "MM:SS"
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Обновление таймера
  const updateTimer = () => {
    const currentTime = Math.floor((Date.now() - startTime.current) / 1000);
    setTimer(formatTime(currentTime));
  };

  // Запуск таймера
  const startTimer = () => {
    startTime.current = Date.now();
    timerInterval.current = setInterval(updateTimer, 1000);
  };

  // Остановка таймера
  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setTimer('00:00');
  };

  // Очистка интервала при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return { timer, startTimer, stopTimer };
} 