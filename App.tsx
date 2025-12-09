import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetCard } from './components/AssetCard';
import { LogConsole } from './components/LogConsole';
import { StatusIndicator } from './components/StatusIndicator';
import { PING_INTERVAL_MS } from './constants';
import { AppStatus, HostedAsset, SystemLog } from './types';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.STOPPED);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Hidden input ref for adding new files
  const addFileRef = useRef<HTMLInputElement>(null);
  
  const [assets, setAssets] = useState<HostedAsset[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
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
      const response = await fetch('/api/assets');
      if (response.ok) {
        const files = await response.json();
        const mappedAssets: HostedAsset[] = files.map((f: any) => ({
            id: f.name,
            name: f.name,
            description: `对应文件: /${f.name}`,
            url: f.url,
            placeholderColor: 'bg-indigo-400'
        }));
        setAssets(mappedAssets);
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
      // Don't log error to console to avoid spamming
    }
  }, []);

  const pingServer = useCallback(async () => {
    try {
      const timestamp = Date.now();
      // Try to ping the first asset found, or just root
      let targetPath = '/';
      if (assets.length > 0) {
        targetPath = assets[0].url;
      }

      await fetch(`${targetPath}?keepalive=${timestamp}`, { method: 'HEAD' });
      addLog(`心跳成功：保持连接活跃中 (${targetPath})`, 'success');
    } catch (e) {
      addLog(`心跳发送：服务器已响应请求`, 'info');
    }
  }, [addLog, assets]);

  const startServer = useCallback(() => {
    setStatus(prev => {
        if (prev === AppStatus.RUNNING) return prev;
        
        setStartTime(Date.now());
        addLog('后端服务：已连接并监控中', 'info');
        
        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
        
        setTimeout(pingServer, 1000); 
        keepAliveIntervalRef.current = setInterval(pingServer, PING_INTERVAL_MS);
        
        return AppStatus.RUNNING;
    });
  }, [pingServer, addLog]);

  // Initial Load
  useEffect(() => {
    startServer();
    setCurrentUrl(window.location.origin);
    fetchAssets(); // Load initial assets from server
    addLog('系统初始化：已连接到 Node.js 文件服务器', 'success');

    return () => {
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };
  }, [startServer, addLog, fetchAssets]);

  // Handle file selection and UPLOAD to server
  const handleNewFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addLog(`正在上传: ${file.name}...`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            addLog(`上传成功: ${file.name}`, 'success');
            await fetchAssets(); // Refresh list
        } else {
            addLog(`上传失败: 服务器返回错误`, 'error');
        }
    } catch (error) {
        addLog(`上传出错: 网络连接失败`, 'error');
    } finally {
        setIsUploading(false);
        if (addFileRef.current) addFileRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (filename: string) => {
    try {
        const response = await fetch(`/api/delete/${filename}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            addLog(`已删除文件: ${filename}`, 'warning');
            fetchAssets(); // Refresh list
        } else {
            addLog(`删除失败: ${filename}`, 'error');
        }
    } catch (error) {
        addLog(`删除出错: 网络请求失败`, 'error');
    }
  };

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
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ServerGuard <span className="text-gray-400 font-normal">Backend v2.0</span></h1>
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
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start">
             <div className="text-purple-500 mt-1 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-purple-900 text-sm">已启用后端文件服务</h4>
               <ul className="mt-1 text-sm text-purple-800 leading-relaxed list-disc list-inside space-y-1">
                 <li>现在您可以直接点击下方的 <strong>“上传文件”</strong> 按钮。</li>
                 <li>图片将直接保存到服务器的 <code>/public</code> 目录，并立即生效。</li>
                 <li>
                   <strong>Zeabur 部署提示:</strong> 为了防止重启后文件丢失，建议在 Zeabur 设置中添加 Volume 挂载到 <code>/app/public</code>。
                 </li>
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
            <div className="flex gap-2">
               <button 
                  onClick={() => addFileRef.current?.click()}
                  disabled={isUploading}
                  className={`flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
               >
                 {isUploading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        上传中...
                    </>
                 ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        上传文件
                    </>
                 )}
               </button>
               {/* Hidden file input for adding new assets */}
               <input 
                  type="file" 
                  ref={addFileRef} 
                  onChange={handleNewFileSelect} 
                  className="hidden" 
                  accept="image/png,image/jpeg,image/gif,image/webp"
               />
            </div>
          </div>
          
          {assets.length === 0 ? (
             <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                 <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">暂无资源</h3>
                 <p className="text-gray-500 text-sm mt-1">服务器 public 目录为空，请点击上方按钮上传图片。</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map(asset => (
                <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    onUpdate={() => {}} // Not used in backend mode
                    onDelete={handleDeleteAsset}
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
             Node.js Powered • ServerGuard v2
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;