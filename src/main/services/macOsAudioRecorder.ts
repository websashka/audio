import { desktopCapturer, systemPreferences } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as child_process from 'child_process';

/**
 * Сервис для записи системного звука на macOS
 * 
 * macOS имеет специфические особенности для записи системного звука:
 * 1. Начиная с macOS Catalina (10.15) требуется специальное разрешение для записи экрана и звука
 * 2. Для записи системного звука используется loopback-интерфейс
 * 3. Некоторые приложения могут требовать дополнительных разрешений
 */
export class MacOsAudioRecorder {
  /**
   * Получает список доступных источников звука
   */
  async getAudioSources() {
    try {
      // В macOS источники звука доступны через desktopCapturer
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        fetchWindowIcons: true
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('Ошибка при получении источников звука:', error);
      throw error;
    }
  }

  /**
   * Проверяет, есть ли у приложения необходимые разрешения на macOS
   */
  checkPermissions() {
    // В Electron нет прямого способа проверить разрешения на запись экрана в macOS
    // Эти разрешения запрашиваются системой при первой попытке записи
    // и не могут быть запрошены программно
    
    // Проверяем доступ к микрофону
    const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
    
    // Можно проверить, существует ли файл с разрешениями в системе
    const tccDbPath = path.join(
      os.homedir(),
      'Library/Application Support/com.apple.TCC/TCC.db'
    );
    
    return { 
      tccDbExists: fs.existsSync(tccDbPath),
      microphoneAccess: microphoneStatus === 'granted'
    };
  }

  /**
   * Проверяет, установлен ли виртуальный аудио-драйвер для захвата системного звука
   */
  checkAudioDriver() {
    try {
      // Проверяем наличие популярных аудио-драйверов
      const blackholeExists = fs.existsSync('/Library/Audio/Plug-Ins/HAL/BlackHole.driver');
      const soundflowerExists = fs.existsSync('/Library/Audio/Plug-Ins/HAL/Soundflower.kext');
      const hasBackgroundMusic = fs.existsSync('/Library/Audio/Plug-Ins/HAL/Background Music Device.driver');
      
      return {
        hasBlackhole: blackholeExists,
        hasSoundflower: soundflowerExists,
        hasBackgroundMusic
      };
    } catch (error) {
      console.error('Ошибка при проверке аудио-драйверов:', error);
      return {
        hasBlackhole: false,
        hasSoundflower: false,
        hasBackgroundMusic: false
      };
    }
  }

  /**
   * Запускает системную утилиту для настройки звука
   */
  openAudioSettings() {
    try {
      // Открываем системные настройки звука
      child_process.exec('open /System/Library/PreferencePanes/Sound.prefPane');
      return true;
    } catch (error) {
      console.error('Ошибка при открытии настроек звука:', error);
      return false;
    }
  }

  /**
   * Сохраняет аудио в файл
   */
  saveAudioToFile(buffer: Uint8Array, filePath: string): string {
    try {
      // Если путь к файлу не указан, создаем временный файл
      if (!filePath) {
        const tempDir = os.tmpdir();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        filePath = path.join(tempDir, `recording-${timestamp}.webm`);
      }
      
      // Создаем каталоги, если их нет
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return filePath;
    } catch (error) {
      console.error('Ошибка при сохранении аудио:', error);
      throw error;
    }
  }

  /**
   * Диагностирует проблемы с системным звуком на macOS
   */
  async diagnoseAudioIssues(): Promise<{ issues: string[], solutions: string[] }> {
    try {
      const issues: string[] = [];
      const solutions: string[] = [];
      
      // Проверяем, доступен ли микрофон
      const micStatus = systemPreferences.getMediaAccessStatus('microphone');
      if (micStatus !== 'granted') {
        issues.push('Отсутствует доступ к микрофону');
        solutions.push('Разрешите доступ к микрофону в Системные настройки > Защита и безопасность > Конфиденциальность > Микрофон');
      }
      
      // Проверяем наличие драйверов
      const { hasBlackhole, hasSoundflower } = this.checkAudioDriver();
      if (!hasBlackhole && !hasSoundflower) {
        issues.push('Не обнаружены виртуальные аудио-драйверы');
        solutions.push('Установите BlackHole или Soundflower для захвата системного звука');
      }
      
      // Проверяем, запущен ли процесс coreaudiod
      try {
        const { stdout } = await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
          child_process.exec('ps -ax | grep coreaudiod | grep -v grep', (error, stdout, stderr) => {
            if (error && error.code !== 1) {
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          });
        });
        
        if (!stdout.trim()) {
          issues.push('Процесс Core Audio не запущен');
          solutions.push('Перезагрузите компьютер для перезапуска аудио-системы');
        }
      } catch (error) {
        console.error('Ошибка при проверке процесса coreaudiod:', error);
      }
      
      // Если проблем не обнаружено, но пользователь все равно не может записать звук
      if (issues.length === 0) {
        issues.push('Нет известных проблем, но запись все равно не работает');
        solutions.push('Попробуйте перезапустить приложение');
        solutions.push('Проверьте, что в настройках системы звука выбрано правильное устройство вывода');
        solutions.push('Установите и настройте BlackHole или другой виртуальный аудио драйвер');
      }
      
      return { issues, solutions };
    } catch (error) {
      console.error('Ошибка при диагностике аудио:', error);
      return { 
        issues: ['Неизвестная ошибка при диагностике аудио'],
        solutions: ['Перезагрузите компьютер и попробуйте снова']
      };
    }
  }
}

export const macOsAudioRecorder = new MacOsAudioRecorder(); 