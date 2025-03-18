import { app, BrowserWindow, ipcMain, Tray, dialog, desktopCapturer, session, systemPreferences } from 'electron';
import * as path from 'path';
import * as fs from "node:fs";
import { macOsAudioRecorder } from './services/macOsAudioRecorder';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Проверка доступа к микрофону и записи экрана для macOS
async function checkMacOSPermissions() {
  if (process.platform === 'darwin') {
    // Проверяем разрешение на доступ к микрофону
    const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
    if (microphoneStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
    
    // На macOS запрос на запись экрана не может быть сделан программно
    // и будет запрошен системой при первой попытке записи
    console.log('Статус доступа к микрофону:', systemPreferences.getMediaAccessStatus('microphone'));
    
    // Проверяем, есть ли доступ к файлу TCC.db, который может указывать на наличие разрешений
    const hasPermissions = macOsAudioRecorder.checkPermissions();
    console.log('Предположительное наличие разрешений на запись экрана:', hasPermissions);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    width: 400,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('dist/index.html');
  
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await checkMacOSPermissions();
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    });
  });
  
  createWindow();

  ipcMain.handle('get-desktop-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({ 
        types: ['screen', 'window'],
        fetchWindowIcons: true
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('Ошибка при получении источников экрана:', error);
      return [];
    }
  });

  // Проверка, является ли ОС macOS
  ipcMain.handle('is-macos', () => {
    return process.platform === 'darwin';
  });

  // Временно отключаем создание иконки в трее
  // tray = new Tray(path.join(__dirname, '../../assets/tray-icon.png'));
  // tray.setToolTip('Voice Recorder App');
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Проверяем наличие виртуальных аудио-драйверов
  ipcMain.handle('check-audio-drivers', () => {
    if (process.platform === 'darwin') {
      return macOsAudioRecorder.checkAudioDriver();
    }
    return { hasBlackhole: false, hasSoundflower: false };
  });
  
  // Диагностика проблем с аудио на macOS
  ipcMain.handle('diagnose-audio-issues', async () => {
    if (process.platform === 'darwin') {
      return await macOsAudioRecorder.diagnoseAudioIssues();
    }
    return { 
      issues: ['Функция диагностики доступна только на macOS'], 
      solutions: ['Убедитесь, что ваш браузер имеет доступ к аудио'] 
    };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('app-close', () => {
  app.quit();
});


ipcMain.on('start-recording', async () => {
  try {
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Запись начата');
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Ошибка при начале записи');
    }
  }
});

ipcMain.on('stop-recording', async () => {
  try {
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Запись остановлена');
      mainWindow.webContents.send('notes', 'Запись сохранена');
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Ошибка при остановке записи');
    }
  }
});

ipcMain.on('recording-data', async (event, buffer: ArrayBuffer) => {
  try {
    console.log("Получены данные записи, размер:", buffer.byteLength);
    
    let filePath: string;
    
    // Используем специальный сервис для macOS, если это macOS
    if (process.platform === 'darwin') {
      // Генерируем путь для сохранения файла в папке пользователя
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const userDownloadsFolder = path.join(app.getPath('downloads'), `recording-${timestamp}.webm`);
      
      filePath = macOsAudioRecorder.saveAudioToFile(new Uint8Array(buffer), userDownloadsFolder);
    } else {
      // Для других платформ сохраняем как обычно
      filePath = "record.webm";
      fs.writeFileSync(filePath, Buffer.from(buffer));
      filePath = path.resolve(filePath);
    }
    
    // Отправляем сообщение об успешном сохранении с путем к файлу
    if (mainWindow) {
      mainWindow.webContents.send('recording-saved', filePath);
    }
  } catch (error) {
    console.error('Error saving recording:', error);
    if (mainWindow) {
      mainWindow.webContents.send('recording-error', 'Ошибка при сохранении записи');
    }
  }
});