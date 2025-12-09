import React, { useState } from 'react';
import { HostedAsset } from '../types';

interface AssetCardProps {
  asset: HostedAsset;
  onRename: (oldName: string, newName: string) => Promise<boolean>;
  onDelete?: (filename: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(asset.url);
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Copy State
  const [isCopied, setIsCopied] = useState(false);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setHasError(false);
    // Add timestamp to bust cache
    const cleanUrl = asset.url.split('?')[0];
    setImgSrc(`${cleanUrl}?t=${Date.now()}`);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      const img = e.currentTarget;
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${asset.url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const formatFileSize = (bytes?: number) => {
      if (!bytes) return '未知大小';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md relative group">
      
      {/* Image Preview Area */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
        
        {!hasError ? (
            <img 
            src={imgSrc} 
            alt={asset.name} 
            className={`w-full h-full object-contain p-4 z-10 relative transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
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
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 group/title">
                    <h3 className="font-bold text-gray-900 text-lg truncate" title={asset.originalName}>
                        {asset.name}
                    </h3>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">
                    {dimensions ? `${dimensions.width} x ${dimensions.height}` : '...'}
                  </span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200">
                    {formatFileSize(asset.size)}
                  </span>
                </div>
            </div>
            
        </div>
        
        {/* URL Display & Copy */}
        <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5 border border-gray-100 group-hover:border-gray-200 transition-colors">
            <p className="text-gray-500 text-xs flex-1 truncate font-mono select-all">
               {asset.url}
            </p>
            <button 
                onClick={handleCopyUrl}
                className={`p-1 rounded transition-all ${isCopied ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
                title="复制链接"
            >
                {isCopied ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                )}
            </button>
        </div>

        {/* Show original filename if it's different from display name */}
        {asset.name !== asset.originalName && (
            <div className="mt-2 pt-2 border-t border-gray-100">
                 <p className="text-[10px] text-gray-400 truncate">文件名: {asset.originalName}</p>
            </div>
        )}
      </div>
    </div>
  );
};