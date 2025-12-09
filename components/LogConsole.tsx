import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface LogConsoleProps {
  logs: SystemLog[];
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg flex flex-col h-full border border-gray-800">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-gray-200 font-mono text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          服务器活动日志
        </h3>
        <span className="text-xs text-gray-500">{logs.length} 条记录</span>
      </div>
      <div className="p-4 overflow-y-auto h-64 font-mono text-xs space-y-1 scrollbar-hide">
        {logs.length === 0 ? (
            <div className="text-gray-600 text-center py-10 italic">等待活动...</div>
        ) : (
            logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-gray-300 border-l-2 border-transparent hover:bg-white/5 pl-2 py-0.5 rounded-r">
                <span className="text-gray-500 whitespace-nowrap">
                [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span className={`
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'warning' ? 'text-amber-400' : ''}
                ${log.type === 'info' ? 'text-blue-300' : ''}
                `}>
                {log.message}
                </span>
            </div>
            ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};