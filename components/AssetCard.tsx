import React, { useState } from 'react';
import { HostedAsset } from '../types';

interface AssetCardProps {
  asset: HostedAsset;
  onUpdate: (id: string, newUrl: string) => void;
  onDelete?: (filename: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onDelete }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(asset.url);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setHasError(false);
    // Add timestamp to bust cache
    const cleanUrl = asset.url.split('?')[0];
    setImgSrc(`${cleanUrl}?t=${Date.now()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md relative group">
      
      {/* Delete Button (Now calls backend) */}
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset.name); // Pass filename to delete
          }}
          className="absolute top-2 right-2 z-50 bg-white hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-full shadow-md border border-gray-100 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="永久删除服务器文件"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Image Preview Area */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center">
        
        {!hasError ? (
            <img 
            src={imgSrc} 
            alt={asset.name} 
            className={`w-full h-full object-contain p-4 z-10 relative transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
                setIsLoading(false);
                setHasError(true);
            }}
            />
        ) : (
            // Error State
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center z-10">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-500">加载失败</span>
                
                <button 
                    onClick={handleRetry}
                    className="mt-3 flex items-center gap-1 bg-white border border-gray-300 px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer z-40 relative"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                </button>
            </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
            <div>
                <h3 className="font-bold text-gray-900 text-lg truncate max-w-[180px]" title={asset.name}>{asset.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded border max-w-[200px] truncate bg-blue-50 text-blue-600 border-blue-200">
                    服务器资源
                  </span>
                </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${asset.placeholderColor}`}></div>
        </div>
        <p className="text-gray-500 text-xs mt-2 leading-relaxed flex-1 select-all font-mono">
           {asset.url}
        </p>
      </div>
    </div>
  );
};