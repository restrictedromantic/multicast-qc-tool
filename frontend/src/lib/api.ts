import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
});

export interface Project {
  id: string;
  name: string;
  show_code: string;
  episode_number: string;
  created_at: string;
  script_uploaded: boolean;
  status: string;
}

export interface Artist {
  id: string;
  name: string;
  color: string;
  total_lines: number;
  found_lines: number;
  partial_lines: number;
  missing_lines: number;
}

export interface ScriptLine {
  id: string;
  line_number: number;
  text: string;
  artist_color: string;
  artist_name: string | null;
  status: 'pending' | 'found' | 'partial' | 'missing';
  confidence: number;
  matched_text: string | null;
}

export interface QCReport {
  project_id: string;
  project_name: string;
  episode: string;
  total_lines: number;
  found_lines: number;
  partial_lines: number;
  missing_lines: number;
  completion_percentage: number;
  artists: Artist[];
  lines: ScriptLine[];
}

export interface AudioFile {
  id: string;
  filename: string;
  artist_id: string;
  transcription: string | null;
  status: string;
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; show_code: string; episode_number: string }) =>
    api.post<Project>('/projects', data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getArtists: (id: string) => api.get<Artist[]>(`/projects/${id}/artists`),
};

export const scriptsApi = {
  upload: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/scripts/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLines: (projectId: string) =>
    api.get<ScriptLine[]>(`/scripts/${projectId}/lines`),
  getColors: (projectId: string) =>
    api.get<{ color: string; name: string; id: string }[]>(`/scripts/${projectId}/colors`),
  updateArtist: (projectId: string, artistId: string, name: string) =>
    api.put(`/scripts/${projectId}/artists/${artistId}`, {
      color: '',
      artist_name: name,
    }),
};

export const audioApi = {
  upload: (projectId: string, artistId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('artist_id', artistId);
    return api.post<AudioFile>(`/audio/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  transcribe: (projectId: string, audioId: string) =>
    api.post(`/audio/${projectId}/transcribe/${audioId}`),
  getFiles: (projectId: string) =>
    api.get<AudioFile[]>(`/audio/${projectId}/files`),
};

export const qcApi = {
  getReport: (projectId: string) =>
    api.get<QCReport>(`/qc/${projectId}/report`),
  getSummary: (projectId: string) =>
    api.get(`/qc/${projectId}/summary`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: { openai_api_key?: string; whisper_mode?: 'api' | 'local' }) =>
    api.put('/settings', data),
  testKey: () => api.post('/settings/test-api-key'),
};

export default api;
