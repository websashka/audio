import { app, BrowserWindow, ipcMain, Tray, dialog, desktopCapturer, session, systemPreferences } from 'electron';
import * as path from 'path';
import * as fs from "node:fs";
import { macOsAudioRecorder } from './services/macOsAudioRecorder';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let subtitlesWindow: BrowserWindow | null = null;

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
    console.log('Microphone access status:', systemPreferences.getMediaAccessStatus('microphone'));
    
    // Проверяем, есть ли доступ к файлу TCC.db, который может указывать на наличие разрешений
    const hasPermissions = macOsAudioRecorder.checkPermissions();
    console.log('Presumed screen recording permissions:', hasPermissions);
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

function createSubtitlesWindow() {
  if (subtitlesWindow) {
    return;
  }
  
  // Получаем размеры основного экрана
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  
  subtitlesWindow = new BrowserWindow({
    width: 600,
    x: Math.floor((width - 800) / 2), // По центру экрана
    y: height - 180, // В нижней части экрана
    transparent: true, // Прозрачный фон
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  subtitlesWindow.loadFile('dist/subtitles.html');

  subtitlesWindow.setIgnoreMouseEvents(true);
  
  subtitlesWindow.on('closed', () => {
    subtitlesWindow = null;
  });
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
      console.error('Error getting screen sources:', error);
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
      issues: ['Function is available only on macOS'], 
      solutions: ['Ensure your browser has access to audio'] 
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
    // Создаем окно с субтитрами при начале записи
    createSubtitlesWindow();
    
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Recording started');
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Error starting recording');
    }
  }
});

ipcMain.handle('get-ephemeral-token', async () => {
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "verse",
    }),
  });
  const data = await r.json();

  return data;
});

ipcMain.on('stop-recording', async () => {
  try {
    // Закрываем окно с субтитрами при остановке записи
    if (subtitlesWindow) {
      subtitlesWindow.close();
      subtitlesWindow = null;
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Recording stopped');
      mainWindow.webContents.send('notes', 'Recording saved');
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    if (mainWindow) {
      mainWindow.webContents.send('transcription', 'Error stopping recording');
    }
  }
});

ipcMain.on('recording-data', async (event, buffer: ArrayBuffer) => {
  try {
    console.log("Received recording data, size:", buffer.byteLength);
    
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
      mainWindow.webContents.send('recording-error', 'Error saving recording');
    }
  }
});

ipcMain.handle('save-text-to-file', async (event, content: string, filename: string) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const downloadsPath = app.getPath('downloads');
    const filePath = path.join(downloadsPath, filename);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Answers file saved:', filePath);
    
    return filePath;
  } catch (error) {
    console.error('Error saving answers file:', error);
    return null;
  }
});

// Добавляем новый обработчик для обновления субтитров
ipcMain.on('update-subtitle', (event, text) => {
  if (subtitlesWindow && !subtitlesWindow.isDestroyed()) {
    subtitlesWindow.webContents.send('subtitle-text', text);
  }
});