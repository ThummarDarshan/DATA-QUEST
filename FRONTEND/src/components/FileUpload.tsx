import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../hooks/useApi';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface FileUploadProps {
  sessionId?: string;
  onUploadComplete?: (file: any) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  sessionId,
  onUploadComplete,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, error } = useFileUpload();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        setUploading(true);
        const result = await uploadFile(file, sessionId);
        
        if (result) {
          setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          onUploadComplete?.(result);
          
          // Clear status after 3 seconds
          setTimeout(() => {
            setUploadStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[fileId];
              return newStatus;
            });
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 3000);
        } else {
          setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        }
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      } finally {
        setUploading(false);
      }
    }
  }, [uploadFile, sessionId, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadStatusEntries = Object.entries(uploadStatus);

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Support for images, documents, and other files
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Choose Files
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4">
          <ErrorMessage
            error={error}
            variant="inline"
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatusEntries.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadStatusEntries.map(([fileId, status]) => {
            const progress = uploadProgress[fileId] || 0;
            const fileName = fileId.split('-').slice(0, -1).join('-');
            
            return (
              <div
                key={fileId}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {fileName}
                  </p>
                  
                  {status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {progress}% uploaded
                      </p>
                    </div>
                  )}
                  
                  {status === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Upload successful
                    </p>
                  )}
                  
                  {status === 'error' && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Upload failed
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FileUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  onUploadComplete?: (file: any) => void;
}> = ({ isOpen, onClose, sessionId, onUploadComplete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Files
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-4">
            <FileUpload
              sessionId={sessionId}
              onUploadComplete={onUploadComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
