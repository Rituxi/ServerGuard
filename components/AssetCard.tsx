import React, { useState } from 'react';
import { HostedAsset } from '../types';

interface AssetCardProps {
  asset: HostedAsset;
  onRename: (oldName: string, newName: string) => Promise<boolean>;
  onDelete?: (filename: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onRename, onDelete }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(asset.url);
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Renaming State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(asset.originalName);
  const [isRenaming, setIsRenaming] = useState(false);

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

  const handleSaveRename = async () => {
    if (!editName || editName === asset.originalName) {
        setIsEditing(false);
        setEditName(asset.originalName);
        return;
    }
    
    setIsRenaming(true);
    const success = await onRename(asset.originalName, editName);
    setIsRenaming(false);
    if (success) {
        setIsEditing(false);
    }
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
      
      <div className="absolute top-2 right-2 z-50 flex gap-2">
         {/* Delete Button */}
        {onDelete && !isEditing && (
            <button 
            onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.originalName);
            }}
            className="bg-white hover:bg-red-500 hover:text-white text-gray-400 hover:border-red-500 p-2 rounded-full shadow-sm border border-gray-200 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title="永久删除"
            >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            </button>
        )}
      </div>

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
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-sm border border-blue-400 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="输入新文件名..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') {
                                    setIsEditing(false);
                                    setEditName(asset.originalName);
                                }
                            }}
                        />
                        <button onClick={handleSaveRename} disabled={isRenaming} className="text-green-600 hover:bg-green-50 p-1 rounded">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditName(asset.originalName); }} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group/title">
                        <h3 className="font-bold text-gray-900 text-lg truncate" title={asset.originalName}>
                            {asset.name}
                        </h3>
                        {/* Edit Icon */}
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-500 opacity-0 group-hover/title:opacity-100 transition-opacity"
                            title="重命名文件"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                )}
                
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
        {asset.name !== asset.originalName && !isEditing && (
            <div className="mt-2 pt-2 border-t border-gray-100">
                 <p className="text-[10px] text-gray-400 truncate">文件名: {asset.originalName}</p>
            </div>
        )}
      </div>
    </div>
  );
};