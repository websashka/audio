export interface OpenAIResponse {
  type: string;
  content?: string;
  message?: {
    content: string;
    role: string;
  };
  error?: {
    message: string;
  };
  status?: string;
  details?: Record<string, any>;
  response?: {
    output: Array<{
      content: Array<{
        transcript: string;
      }>;
    }>;
  };
  output?: Array<{
    content: Array<{
      transcript: string;
    }>;
  }>;
  item?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  timestamp?: string;
}

export interface ResponseLogItem {
  content: string;
  timestamp: string;
  type: 'message' | 'error' | 'other';
  eventType?: string;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export interface DiagnosticResults {
  issues: string[];
  solutions: string[];
}

export interface AudioDriverInfo {
  hasBlackhole: boolean;
  hasSoundflower: boolean;
} 