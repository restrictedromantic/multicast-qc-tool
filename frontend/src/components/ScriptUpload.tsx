import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { scriptsApi } from '../lib/api';
import { cn } from '../lib/utils';

interface ScriptUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

export default function ScriptUpload({ projectId, onUploadComplete }: ScriptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [projectId]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [projectId]
  );

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setUploadStatus('error');
      setMessage('Please upload a .docx file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const response = await scriptsApi.upload(projectId, file);
      setUploadStatus('success');
      setMessage(
        `Uploaded! Found ${response.data.total_lines} lines across ${response.data.artists_created} artists`
      );
      onUploadComplete();
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(error.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50',
          isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
          id="script-upload"
          disabled={isUploading}
        />
        <label htmlFor="script-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading & parsing...' : 'Drop your script here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports .docx files with color-coded text
              </p>
            </div>
          </div>
        </label>
      </div>

      {uploadStatus !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            uploadStatus === 'success' && 'bg-green-50 text-green-700',
            uploadStatus === 'error' && 'bg-red-50 text-red-700'
          )}
        >
          {uploadStatus === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message}
        </div>
      )}
    </div>
  );
}
