import { HostedAsset } from './types';

export const INITIAL_ASSETS: HostedAsset[] = [
  {
    id: 'cover-image',
    name: '应用封面',
    description: '对应文件: /cover-card.png (请确保文件在 public 目录下)',
    url: '/cover-card.png', 
    placeholderColor: 'bg-emerald-500',
  },
  {
    id: 'donate-qr',
    name: '赞赏码',
    description: '对应文件: /donate-qrcode1.png (请确保文件在 public 目录下)',
    url: '/donate-qrcode1.png', 
    placeholderColor: 'bg-amber-400',
  }
];

export const PING_INTERVAL_MS = 30000; // 30 seconds (More aggressive for Zeabur)