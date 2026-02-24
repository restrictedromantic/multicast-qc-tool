import { useState, useCallback } from 'react';
import { Music, Check, AlertCircle, Loader2 } from 'lucide-react';
import { audioApi, Artist } from '../lib/api';
import { cn, getContrastColor } from '../lib/utils';

interface AudioUploadProps {
  projectId: string;
  artists: Artist[];
  onUploadComplete: () => void;
}

export default function AudioUpload({ projectId, artists, onUploadComplete }: AudioUploadProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
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

      if (!selectedArtist) {
        setStatus('error');
        setMessage('Please select an artist first');
        return;
      }

      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadAndTranscribe(file);
      }
    },
    [selectedArtist, projectId]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedArtist) {
        setStatus('error');
        setMessage('Please select an artist first');
        return;
      }

      const file = e.target.files?.[0];
      if (file) {
        await uploadAndTranscribe(file);
      }
    },
    [selectedArtist, projectId]
  );

  const uploadAndTranscribe = async (file: File) => {
    setIsUploading(true);
    setStatus('idle');

    try {
      setMessage('Uploading audio...');
      const uploadResponse = await audioApi.upload(projectId, selectedArtist, file);
      
      setIsUploading(false);
      setIsTranscribing(true);
      setMessage('Transcribing with Whisper...');
      
      await audioApi.transcribe(projectId, uploadResponse.data.id);
      
      setStatus('success');
      setMessage('Audio transcribed and matched against script!');
      onUploadComplete();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Upload/transcription failed');
    } finally {
      setIsUploading(false);
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Artist
        </label>
        <div className="flex flex-wrap gap-2">
          {artists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => setSelectedArtist(artist.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                selectedArtist === artist.id
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-transparent'
              )}
              style={{
                backgroundColor: artist.color,
                color: getContrastColor(artist.color),
              }}
            >
              {artist.name}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50',
          (isUploading || isTranscribing) && 'opacity-50 pointer-events-none',
          !selectedArtist && 'opacity-50'
        )}
      >
        <input
          type="file"
          accept=".wav,.mp3,.m4a,.ogg,.flac"
          onChange={handleFileSelect}
          className="hidden"
          id="audio-upload"
          disabled={isUploading || isTranscribing || !selectedArtist}
        />
        <label htmlFor="audio-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            {isUploading || isTranscribing ? (
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            ) : (
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-indigo-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading
                  ? 'Uploading...'
                  : isTranscribing
                  ? 'Transcribing...'
                  : 'Drop audio file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports WAV, MP3, M4A, OGG, FLAC
              </p>
            </div>
          </div>
        </label>
      </div>

      {(status !== 'idle' || message) && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-green-50 text-green-700',
            status === 'error' && 'bg-red-50 text-red-700',
            status === 'idle' && message && 'bg-blue-50 text-blue-700'
          )}
        >
          {status === 'success' ? (
            <Check className="w-4 h-4" />
          ) : status === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {message}
        </div>
      )}
    </div>
  );
}
