import { OpenAIResponse } from '../types';

export interface WebRTCConnectResult {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  audioElement: HTMLAudioElement;
}

export class OpenAIService {
  private static instance: OpenAIService;
  
  private constructor() {}
  
  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }
  
  async getEphemeralToken(): Promise<any> {
    return window.electron.getEphemeralToken();
  }
  
  async setupWebRTCConnection(selectedSource: string): Promise<WebRTCConnectResult> {
    // Создаем WebRTC соединение с STUN серверами
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    console.log('Инициализация WebRTC соединения...');
    
    // Создаем аудио элемент для воспроизведения ответа (невидимый и беззвучный)
    const invisibleAudio = document.createElement("audio");
    invisibleAudio.autoplay = true;
    invisibleAudio.muted = true;
    document.body.appendChild(invisibleAudio);
    
    // Настраиваем обработчики событий для отладки
    pc.onicecandidate = event => console.log('ICE candidate', event.candidate);
    pc.onicecandidateerror = event => console.error('ICE candidate error', event);
    pc.oniceconnectionstatechange = () => console.log('ICE connection state', pc.iceConnectionState);
    pc.onicegatheringstatechange = () => console.log('ICE gathering state', pc.iceGatheringState);
    pc.onsignalingstatechange = () => console.log('Signaling state', pc.signalingState);
    pc.onconnectionstatechange = () => {
      console.log('Connection state', pc.connectionState);
    };
    
    // Получаем доступ к микрофону
    console.log('Запрашиваем доступ к микрофону...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: selectedSource },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });
    
    console.log('Получен доступ к микрофону:', stream.getAudioTracks()[0].label);
    
    // Добавляем аудио трек
    pc.addTrack(stream.getAudioTracks()[0], stream);
    
    // Создаем data channel
    console.log('Создаем data channel...');
    const dc = pc.createDataChannel("oai-events", {
      ordered: true
    });
    
    return {
      peerConnection: pc,
      dataChannel: dc,
      audioElement: invisibleAudio
    };
  }
  
  async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    console.log('Создаем SDP оффер...');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }
  
  async connectToOpenAI(pc: RTCPeerConnection, token: string): Promise<void> {
    // Отправляем запрос на OpenAI Realtime API
    console.log('Отправляем запрос на API...');
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: pc.localDescription?.sdp,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp"
      },
    });
    
    if (!sdpResponse.ok) {
      throw new Error(`HTTP ошибка при получении ответа от API: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    
    // Получаем и устанавливаем SDP ответ
    const answerSdp = await sdpResponse.text();
    console.log('Получен SDP ответ');
    
    const answer = {
      type: "answer" as RTCSdpType,
      sdp: answerSdp,
    };
    
    await pc.setRemoteDescription(answer);
    console.log('Remote description установлен, соединение должно быть установлено');
  }
  
  sendClientEvent(dataChannel: RTCDataChannel, message: any): boolean {
    try {
      console.log('Отправляем сообщение в dataChannel:', message);
      
      // Добавляем идентификатор события, если его нет
      if (!message.event_id) {
        message.event_id = crypto.randomUUID();
      }
      
      // Отправляем сообщение
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      return false;
    }
  }
  
  initializeSession(dataChannel: RTCDataChannel, silenceDuration: number): void {
    setTimeout(() => {
      this.sendClientEvent(dataChannel, {
        type: 'session.update',
        session: {
          voice: 'alloy',
          model: "gpt-4o-realtime-preview-2024-12-17",
          instructions: 'Ты полезный помощник. Отвечай на вопросы кратко и по делу. Говори на русском языке.',
          temperature: 0.7,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.3,
            silence_duration_ms: silenceDuration,
            prefix_padding_ms: 500,
            interrupt_response: false,
            create_response: true
          },
        }
      });
      console.log('Отправлено session.update для инициализации с настройками turn_detection');
    }, 500);
  }
  
  updateSessionSettings(dataChannel: RTCDataChannel, silenceDuration: number): void {
    const sessionUpdateMessage = {
      type: 'session.update',
      session: {
        voice: 'alloy',
        instructions: 'Ты полезный помощник. Отвечай на вопросы кратко и по делу. Говори на русском языке.',
        temperature: 0.7,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.3,
          silence_duration_ms: silenceDuration,
          prefix_padding_ms: 500,
          interrupt_response: false,
          create_response: true
        },
      }
    };
    
    this.sendClientEvent(dataChannel, sessionUpdateMessage);
  }
  
  sendTextMessage(dataChannel: RTCDataChannel, textMessage: string): void {
    if (!textMessage.trim()) {
      textMessage = "Привет! Как ты можешь мне помочь?";
    }
    
    // Шаг 1: Создаем сообщение пользователя
    const createMessageEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: textMessage
        }]
      }
    };
    
    // Отправляем сообщение пользователя
    if (this.sendClientEvent(dataChannel, createMessageEvent)) {
      // Шаг 2: Запрашиваем ответ от модели
      setTimeout(() => {
        this.sendClientEvent(dataChannel, { 
          type: "response.create"
        });
      }, 500);
    }
  }
  
  closeConnection(peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel, audioElement: HTMLAudioElement): void {
    try {
      // Отключаем все треки
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      
      // Закрываем data channel
      dataChannel.close();
      
      // Закрываем WebRTC соединение
      peerConnection.close();
      console.log('WebRTC соединение закрыто');
      
      // Удаляем аудио элемент
      if (audioElement && audioElement.parentNode) {
        audioElement.pause();
        audioElement.srcObject = null;
        audioElement.parentNode.removeChild(audioElement);
        console.log('Аудио элемент удален');
      }
    } catch (error) {
      console.error('Ошибка при закрытии соединения:', error);
    }
  }
  
  parseResponse(data: string): OpenAIResponse {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка при парсинге ответа:', error);
      throw error;
    }
  }
  
  extractTranscript(response: OpenAIResponse): string | null {
    // Извлекаем transcript из response.done ответа
    if (response.type === 'response.done' && response.response?.output) {
      const output = response.response.output;
      if (Array.isArray(output) && output.length > 0 && output[0].content) {
        if (Array.isArray(output[0].content) && output[0].content.length > 0) {
          return output[0].content[0].transcript || null;
        }
      }
    }
    
    // Или из output напрямую
    if (response.type === 'response.done' && response.output) {
      const output = response.output;
      if (Array.isArray(output) && output.length > 0 && output[0].content) {
        if (Array.isArray(output[0].content) && output[0].content.length > 0) {
          return output[0].content[0].transcript || null;
        }
      }
    }
    
    return null;
  }
}

export default OpenAIService.getInstance(); 