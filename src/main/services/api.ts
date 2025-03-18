import axios from 'axios';

class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.API_URL || 'https://api.example.com';
    this.apiKey = process.env.API_KEY || '';
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async uploadAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await axios.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        ...this.headers,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.id;
  }

  async getTranscription(audioId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/transcription/${audioId}`, {
      headers: this.headers
    });

    return response.data.transcript;
  }

  async generateNotes(transcriptionId: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/notes/generate`,
      { transcriptionId },
      { headers: this.headers }
    );

    return response.data.notes;
  }
}

export const apiService = new ApiService(); 