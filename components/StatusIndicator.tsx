import React, { useEffect, useState } from 'react';
import { AppStatus } from '../types';

interface StatusIndicatorProps {
  status: AppStatus;
  startTime: number | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, startTime }) => {
  const [now, setNow] = useState(Date.now());

  // Force re-render every second to update the counter
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getUptimeSeconds = () => {
    if (status !== AppStatus.RUNNING || !startTime) return 0;
    // Calculate difference between NOW and START time
    const diff = Math.max(0, Math.floor((now - startTime) / 1000));
    return diff;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}小时 ${m}分 ${s}秒`;
  };

  const getStatusColor = () => {
    switch (status) {
      case AppStatus.RUNNING: return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
      case AppStatus.STOPPED: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={`w-4 h-4 rounded-full transition-all duration-500 ${getStatusColor()}`}></div>
          {status === AppStatus.RUNNING && (
            <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75"></div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">系统状态</h2>
          <p className="text-sm text-gray-500 font-medium">
            {status === AppStatus.RUNNING ? '运行中 • 防休眠模式已开启' : '待机模式'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">本次运行时长</p>
          <p className="text-2xl font-mono font-medium text-gray-800 tabular-nums">
            {formatUptime(getUptimeSeconds())}
          </p>
        </div>
      </div>
    </div>
  );
};