import { useState, useEffect } from 'react';
import { Key, Cpu, Check, AlertCircle, Loader2 } from 'lucide-react';
import { settingsApi } from '../lib/api';
import { cn } from '../lib/utils';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [whisperMode, setWhisperMode] = useState<'api' | 'local'>('api');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get();
      setWhisperMode(response.data.whisper_mode);
      setApiKeyConfigured(response.data.api_key_configured);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await settingsApi.update({
        openai_api_key: apiKey || undefined,
        whisper_mode: whisperMode,
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      if (apiKey) {
        setApiKeyConfigured(true);
        setApiKey('');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const testApiKey = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const response = await settingsApi.testKey();
      if (response.data.valid) {
        setMessage({ type: 'success', text: 'API key is valid!' });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to test API key' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-pfm-text">Settings</h1>
        <p className="text-gray-500 dark:text-pfm-text-muted">Configure your Multicast QC Tool</p>
      </div>

      {/* Whisper Mode */}
      <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-pfm-text mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-600 dark:text-pfm-accent" />
          Transcription Mode
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setWhisperMode('api')}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              whisperMode === 'api'
                ? 'border-purple-500 bg-purple-50 dark:border-pfm-accent dark:bg-pfm-accent/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-pfm-border dark:hover:border-pfm-text-muted'
            )}
          >
            <h3 className="font-medium text-gray-900 dark:text-pfm-text">OpenAI API</h3>
            <p className="text-sm text-gray-500 dark:text-pfm-text-muted mt-1">
              Fast & accurate. ~$0.006/min
            </p>
          </button>
          <button
            onClick={() => setWhisperMode('local')}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              whisperMode === 'local'
                ? 'border-purple-500 bg-purple-50 dark:border-pfm-accent dark:bg-pfm-accent/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-pfm-border dark:hover:border-pfm-text-muted'
            )}
          >
            <h3 className="font-medium text-gray-900 dark:text-pfm-text">Local Whisper</h3>
            <p className="text-sm text-gray-500 dark:text-pfm-text-muted mt-1">
              Free but slower. Not available on all servers.
            </p>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-pfm-text-muted mt-3">
          Recommended: use OpenAI API and add your key below so transcription works everywhere.
        </p>
      </div>

      {/* API Key */}
      <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-pfm-text mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600 dark:text-pfm-accent" />
          OpenAI API Key
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600 dark:text-pfm-text-muted">Status:</span>
              {apiKeyConfigured ? (
                <span className="flex items-center gap-1 text-sm text-green-600 dark:text-pfm-success">
                  <Check className="w-4 h-4" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-pfm-warning">
                  <AlertCircle className="w-4 h-4" />
                  Not configured
                </span>
              )}
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeyConfigured ? '••••••••••••••••' : 'sk-...'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-pfm-border dark:bg-pfm-bg dark:text-pfm-text rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-pfm-accent"
            />
            <p className="text-xs text-gray-500 dark:text-pfm-text-muted mt-1">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-pfm-accent hover:underline"
              >
                OpenAI Dashboard
              </a>
            </p>
          </div>

          {apiKeyConfigured && (
            <button
              onClick={testApiKey}
              disabled={isTesting}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:text-pfm-accent dark:hover:bg-pfm-surface-hover rounded-lg transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </span>
              ) : (
                'Test API Key'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'flex items-center gap-2 p-4 rounded-lg',
            message.type === 'success' && 'bg-green-50 text-green-700 dark:bg-pfm-success/20 dark:text-pfm-success',
            message.type === 'error' && 'bg-red-50 text-red-700 dark:bg-pfm-error/20 dark:text-pfm-error'
          )}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={isSaving}
        className="w-full py-3 bg-purple-600 dark:bg-pfm-accent text-white rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover transition-colors disabled:opacity-50 font-medium"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </span>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  );
}
