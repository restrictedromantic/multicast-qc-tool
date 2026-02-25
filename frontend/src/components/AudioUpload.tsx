import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Music, Check, AlertCircle, Loader2, Settings } from 'lucide-react';
import { audioApi, Artist } from '../lib/api';
import { cn, getContrastColor } from '../lib/utils';

const API_KEY_ERROR = 'OpenAI API key not configured';
const LOCAL_WHISPER_ERROR = 'Local Whisper is not installed';

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
      onUploadComplete(); // refresh list so uploaded file appears even if transcribe fails

      setIsUploading(false);
      setIsTranscribing(true);
      setMessage('Transcribing with Whisper...');

      await audioApi.transcribe(projectId, uploadResponse.data.id);

      setStatus('success');
      setMessage('Audio transcribed and matched against script!');
      onUploadComplete();
    } catch (error: any) {
      const detail = error.response?.data?.detail ?? '';
      const isApiKeyError = typeof detail === 'string' && detail.includes(API_KEY_ERROR);
      const isLocalWhisperError = typeof detail === 'string' && (detail.includes(LOCAL_WHISPER_ERROR) || detail.includes('Local Whisper not installed'));
      setStatus('error');
      if (isApiKeyError) {
        setMessage('Audio uploaded. To transcribe, add an OpenAI API key in Settings or switch to Local Whisper mode.');
      } else if (isLocalWhisperError) {
        setMessage('Audio uploaded. Local Whisper isn\'t available on this server. Go to Settings → switch to OpenAI API and add your API key to transcribe.');
      } else {
        setMessage(detail || 'Upload or transcription failed');
      }
    } finally {
      setIsUploading(false);
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-pfm-text-muted mb-2">
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
                  ? 'border-purple-500 ring-2 ring-purple-200 dark:border-pfm-accent dark:ring-pfm-accent/40'
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
        onDragOver={selectedArtist ? handleDragOver : undefined}
        onDragLeave={selectedArtist ? handleDragLeave : undefined}
        onDrop={selectedArtist ? handleDrop : undefined}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all',
          selectedArtist && 'cursor-pointer',
          isDragging
            ? 'border-purple-500 bg-purple-50 dark:border-pfm-accent dark:bg-pfm-accent/20'
            : 'border-gray-300 dark:border-pfm-border',
          selectedArtist && !isDragging && 'hover:border-purple-400 hover:bg-gray-50 dark:hover:border-pfm-accent dark:hover:bg-pfm-surface-hover',
          (isUploading || isTranscribing) && 'opacity-50 pointer-events-none',
          !selectedArtist && 'opacity-75'
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
        <label htmlFor={selectedArtist ? 'audio-upload' : undefined} className={selectedArtist ? 'cursor-pointer block' : 'block'}>
          <div className="flex flex-col items-center gap-3">
            {isUploading || isTranscribing ? (
              <Loader2 className="w-12 h-12 text-purple-500 dark:text-pfm-accent animate-spin" />
            ) : (
              <div className="w-12 h-12 bg-indigo-100 dark:bg-pfm-accent/20 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-indigo-600 dark:text-pfm-accent" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-pfm-text">
                {!selectedArtist
                  ? 'Select an artist above, then drop or click to upload'
                  : isUploading
                  ? 'Uploading...'
                  : isTranscribing
                  ? 'Transcribing...'
                  : 'Drop audio here or click to choose file'}
              </p>
              <p className="text-xs text-gray-500 dark:text-pfm-text-muted mt-1">
                WAV, MP3, M4A, OGG, FLAC
              </p>
            </div>
            {selectedArtist && !isUploading && !isTranscribing && (
              <span className="inline-block mt-2 px-3 py-1.5 bg-purple-600 dark:bg-pfm-accent text-white text-sm rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover">
                Choose file
              </span>
            )}
          </div>
        </label>
      </div>

      {(status !== 'idle' || message) && (
        <div
          className={cn(
            'flex flex-col gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-green-50 text-green-700 dark:bg-pfm-success/20 dark:text-pfm-success',
            status === 'error' && 'bg-red-50 text-red-700 dark:bg-pfm-error/20 dark:text-pfm-error',
            status === 'idle' && message && 'bg-blue-50 text-blue-700 dark:bg-pfm-accent/20 dark:text-pfm-accent'
          )}
        >
          <div className="flex items-center gap-2">
            {status === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : status === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            )}
            <span>{message}</span>
          </div>
          {status === 'error' && (message.includes('add an OpenAI API key') || message.includes('Go to Settings')) && (
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-pfm-bg/80 hover:bg-white dark:hover:bg-pfm-surface font-medium w-fit"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
