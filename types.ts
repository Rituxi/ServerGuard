export interface SystemLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface HostedAsset {
  id: string;
  name: string;
  description: string;
  url: string; 
  placeholderColor: string;
  isCustom?: boolean; // Kept for UI logic, though backend treats all same
}

export enum AppStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}