import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Artist, scriptsApi } from '../lib/api';
import { formatPercentage } from '../lib/utils';

interface ArtistPanelProps {
  projectId: string;
  artists: Artist[];
  onUpdate: () => void;
}

export default function ArtistPanel({ projectId, artists, onUpdate }: ArtistPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (artist: Artist) => {
    setEditingId(artist.id);
    setEditName(artist.name);
  };

  const saveEdit = async (artistId: string) => {
    try {
      await scriptsApi.updateArtist(projectId, artistId, editName);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update artist name:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Artists & Colors</h3>
      <div className="grid gap-3">
        {artists.map((artist) => {
          const total = artist.total_lines;
          const found = artist.found_lines;
          const partial = artist.partial_lines;
          const completion = total > 0 ? ((found + partial * 0.5) / total) * 100 : 0;

          return (
            <div
              key={artist.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: artist.color }}
                  />
                  {editingId === artist.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(artist.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{artist.name}</span>
                      <button
                        onClick={() => startEdit(artist)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {total} lines
                </span>
              </div>

              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <div className="flex gap-3">
                    <span className="text-green-600">
                      {found} found
                    </span>
                    <span className="text-yellow-600">
                      {partial} partial
                    </span>
                    <span className="text-red-600">
                      {artist.missing_lines} missing
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">
                    {formatPercentage(completion)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
