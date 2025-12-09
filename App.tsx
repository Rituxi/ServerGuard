import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetCard } from './components/AssetCard';
import { LogConsole } from './components/LogConsole';
import { StatusIndicator } from './components/StatusIndicator';
import { PING_INTERVAL_MS } from './constants';
import { AppStatus, HostedAsset, SystemLog } from './types';

// Configuration for mapping filenames to Chinese display names
const FILENAME_MAPPING: Record<string, string> = {
    'cover-card.png': '应用封面',
    'donate-qrcode1.png': '赞赏码',
    'avatar.png': '用户头像',
    'banner.png': '横幅广告'
};

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.STOPPED);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const [assets, setAssets] = useState<HostedAsset[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // Refs for intervals
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [...prev.slice(-49), newLog]); 
  }, []);

  // API: Fetch assets from server
  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets?t=' + Date.now());
      
      // Strict check: If server returns HTML, it means we are in Static Mode (Nginx serving index.html for 404s)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
          console.warn("Received HTML instead of JSON. Static mode detected.");
          return; // Fail silently or handle strictly
      }

      if (response.ok) {
        const files = await response.json();
        const mappedAssets: HostedAsset[] = files.map((f: any) => {
            // Check if we have a Chinese name mapping for this file
            const displayName = FILENAME_MAPPING[f.name] || f.name;
            
            return {
                id: f.name,
                name: displayName,       // Display Name (Chinese if mapped)
                originalName: f.name,    // Actual filename
                description: `对应文件: /${f.name}`,
                url: f.url,
                size: f.size,            // File size from server
                placeholderColor: 'bg-indigo-400'
            };
        });
        setAssets(mappedAssets);
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
    }
  }, []);

  const pingServer = useCallback(async () => {
    try {
      // Use explicit Health Check endpoint to verify Node.js is handling traffic
      // Add timestamp to prevent caching
      const response = await fetch('/api/health?t=' + Date.now());
      
      if (response.ok) {
         // Verify it's actually JSON and not a 200 OK static HTML file
         const contentType = response.headers.get("content-type");
         if (contentType && contentType.indexOf("application/json") !== -1) {
             const data = await response.json();
             if (data.status === 'ok') {
                 // Success - we are talking to Node.js
                 return; 
             }
         }
      }
      throw new Error("Invalid response");

    } catch (e) {
      addLog(`连接警告：后端服务未响应。请检查 Zeabur 设置。`, 'warning');
    }
  }, [addLog]);

  const startServer = useCallback(() => {
    setStatus(prev => {
        if (prev === AppStatus.RUNNING) return prev;
        
        setStartTime(Date.now());
        // Initial health check
        fetch('/api/health?init=' + Date.now())
            .then(res => {
                const contentType = res.headers.get("content-type");
                if (!res.ok || !contentType?.includes("application/json")) {
                    throw new Error("Not a JSON response");
                }
                return res.json();
            })
            .then(() => {
                 addLog('后端服务：连接成功 (Node.js)', 'success');
            })
            .catch(() => {
                 addLog('环境检测：API 不可用。Zeabur 可能正在以静态模式运行。', 'error');
            });
        
        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
        
        keepAliveIntervalRef.current = setInterval(pingServer, PING_INTERVAL_MS);
        
        return AppStatus.RUNNING;
    });
  }, [pingServer, addLog]);

  // Initial Load
  useEffect(() => {
    startServer();
    setCurrentUrl(window.location.origin);
    fetchAssets(); // Load initial assets from server
    addLog('系统初始化：正在尝试连接后端...', 'info');

    return () => {
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };
  }, [startServer, addLog, fetchAssets]);

  const reloadAllImages = () => {
     fetchAssets();
     addLog('已刷新资源列表', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ServerGuard <span className="text-gray-400 font-normal">GitHub 同步版</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={reloadAllImages} className="text-gray-500 hover:text-gray-900" title="刷新列表">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
             </button>
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Node.js 运行中
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start">
             <div className="text-blue-500 mt-1 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-blue-900 text-sm">Git 托管模式已开启</h4>
               <ul className="mt-1 text-sm text-blue-800 leading-relaxed list-disc list-inside space-y-1">
                 <li>当前为<strong>只读模式</strong>。请将图片直接放入本地代码的 <code>/public</code> 文件夹。</li>
                 <li>执行 <code>git push</code> 推送代码后，Zeabur 会自动部署并更新此页面。</li>
                 <li>在此页面复制的图片链接是永久有效的。</li>
               </ul>
             </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatusIndicator status={status} startTime={startTime} />
          </div>
          <div className="h-48 lg:h-auto">
             <LogConsole logs={logs} />
          </div>
        </div>

        {/* Assets Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              服务器资源 ({assets.length})
            </h2>
          </div>
          
          {assets.length === 0 ? (
             <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                 <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">暂无资源</h3>
                 <p className="text-gray-500 text-sm mt-1">请将图片添加到 GitHub 仓库的 public 文件夹中并推送。</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map(asset => (
                <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    onRename={async () => false}
                />
                ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer with URL info */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>后端接口运行于: </span>
            <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700 select-all">
              {currentUrl || '获取中...'}
            </code>
          </div>
          <div className="text-xs text-gray-400">
             Node.js Powered • ServerGuard v2.4 (Git Mode)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;