export interface SystemLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface HostedAsset {
  id: string;
  name: string;         // The display name (Chinese)
  originalName: string; // The actual filename on disk
  description: string;
  url: string; 
  size?: number;        // File size in bytes
  placeholderColor: string;
  isCustom?: boolean; 
}

export enum AppStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}