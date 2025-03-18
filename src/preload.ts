import { contextBridge, ipcRenderer } from 'electron';

declare global {
  interface Window {
    electron: {
      startRecording: () => void;
      stopRecording: () => void;
      sendRecordingData: (buffer: Uint8Array) => void;
      onTranscription: (callback: (transcript: string) => void) => void;
      onNotes: (callback: (notes: string) => void) => void;
      closeApp: () => void;
      getDesktopSources: () => Promise<Array<{ id: string, name: string, thumbnail: string }>>;
      isMacOS: () => Promise<boolean>;
      onRecordingSaved: (callback: (filePath: string) => void) => void;
      onRecordingError: (callback: (error: string) => void) => void;
      openAudioSettings: () => Promise<boolean>;
      checkAudioDrivers: () => Promise<{ hasBlackhole: boolean, hasSoundflower: boolean }>;
      onAudioDriverInfo: (callback: (info: string) => void) => void;
      diagnoseAudioIssues: () => Promise<{ issues: string[], solutions: string[] }>;
      getEphemeralToken: ()=> Promise<any>;
      saveTextToFile: (content: string, filename: string) => Promise<string | null>;
      updateSubtitle: (text: string) => void;
      onSubtitleText: (callback: (text: string) => void) => void;
    };
    require: (module: string) => any;
  }
}
interface IPCSources {
  id: string;
  name: string;
  thumbnail: HTMLCanvasElement;
}

export type venmicListObject =
    | { ok: true; targets: string[]; hasPipewirePulse: boolean }
    | { ok: false; isGlibCxxOutdated: boolean };

contextBridge.exposeInMainWorld('electron', {
  getSources: (
      callback: (event: Electron.IpcRendererEvent, sources: IPCSources[], ...args: unknown[]) => void,
  ) => {
    ipcRenderer.on("getSources", callback);
  },
  isOSX: () => process.platform === 'darwin',
  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.send('stop-recording'),
  sendRecordingData: (buffer: Uint8Array) => {
    ipcRenderer.send('recording-data', buffer);
  },
  onTranscription: (callback: (transcript: string) => void) => {
    ipcRenderer.on('transcription', (_, transcript) => callback(transcript));
  },
  onNotes: (callback: (notes: string) => void) => {
    ipcRenderer.on('notes', (_, notes) => callback(notes));
  },
  closeApp: () => {
    ipcRenderer.send('app-close');
  },
  getDesktopSources: async () => {
    return await ipcRenderer.invoke('get-desktop-sources');
  },
  isMacOS: async () => {
    return await ipcRenderer.invoke('is-macos');
  },
  onRecordingSaved: (callback: (filePath: string) => void) => {
    ipcRenderer.on('recording-saved', (_, filePath) => callback(filePath));
  },
  onRecordingError: (callback: (error: string) => void) => {
    ipcRenderer.on('recording-error', (_, error) => callback(error));
  },
  openAudioSettings: async () => {
    return await ipcRenderer.invoke('open-audio-settings');
  },
  checkAudioDrivers: async () => {
    return await ipcRenderer.invoke('check-audio-drivers');
  },
  onAudioDriverInfo: (callback: (info: string) => void) => {
    ipcRenderer.on('audio-driver-info', (_, info) => callback(info));
  },
  diagnoseAudioIssues: async () => {
    return await ipcRenderer.invoke('diagnose-audio-issues');
  },
  getEphemeralToken: async () => {
    return await ipcRenderer.invoke('get-ephemeral-token');
  },
  saveTextToFile: async (content: string, filename: string) => {
    return await ipcRenderer.invoke('save-text-to-file', content, filename);
  },
  updateSubtitle: (text: string) => {
    ipcRenderer.send('update-subtitle', text);
  },
  onSubtitleText: (callback: (text: string) => void) => {
    ipcRenderer.on('subtitle-text', (_, text) => callback(text));
  }
});

contextBridge.exposeInMainWorld('require', (module: string) => {
  return require(module);
}); 