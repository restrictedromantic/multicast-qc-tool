import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Music, BarChart3, RefreshCw, ExternalLink } from 'lucide-react';
import { projectsApi, qcApi, Project, Artist, QCReport as QCReportType } from '../lib/api';
import ScriptUpload from '../components/ScriptUpload';
import AudioUpload from '../components/AudioUpload';
import ArtistPanel from '../components/ArtistPanel';
import QCReport from '../components/QCReport';
import { cn } from '../lib/utils';

type Tab = 'script' | 'audio' | 'report';

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [report, setReport] = useState<QCReportType | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('script');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const [projectRes, artistsRes] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.getArtists(projectId),
      ]);
      setProject(projectRes.data);
      setArtists(artistsRes.data);

      if (projectRes.data.script_uploaded) {
        const reportRes = await qcApi.getReport(projectId);
        setReport(reportRes.data);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReport = async () => {
    if (!projectId) return;
    try {
      const [artistsRes, reportRes] = await Promise.all([
        projectsApi.getArtists(projectId),
        qcApi.getReport(projectId),
      ]);
      setArtists(artistsRes.data);
      setReport(reportRes.data);
    } catch (error) {
      console.error('Failed to refresh report:', error);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 dark:border-pfm-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-pfm-text mb-2">Project not found</h2>
        <Link to="/" className="text-purple-600 dark:text-pfm-accent hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-pfm-text-muted dark:hover:text-pfm-text dark:hover:bg-pfm-surface-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-pfm-text">{project.name}</h1>
            <p className="text-gray-500 dark:text-pfm-text-muted">
              {project.show_code} - {project.episode_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshReport}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-pfm-text-muted dark:hover:bg-pfm-surface-hover rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={copyShareLink}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 dark:bg-pfm-accent/20 dark:text-pfm-accent rounded-lg hover:bg-purple-200 dark:hover:bg-pfm-accent/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-pfm-border pb-2">
        {[
          { id: 'script' as Tab, label: 'Script', icon: FileText },
          { id: 'audio' as Tab, label: 'Audio', icon: Music },
          { id: 'report' as Tab, label: 'QC Report', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-purple-100 text-purple-700 dark:bg-pfm-accent/20 dark:text-pfm-accent'
                : 'text-gray-600 hover:bg-gray-100 dark:text-pfm-text-muted dark:hover:bg-pfm-surface-hover'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'script' && (
            <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-pfm-text mb-4">Upload Script</h2>
              <ScriptUpload projectId={project.id} onUploadComplete={loadProject} />
              
              {project.script_uploaded && report && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-pfm-border">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-pfm-text-muted mb-3">Script Preview</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {report.lines.slice(0, 20).map((line) => (
                      <div
                        key={line.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-gray-400 dark:text-pfm-text-muted w-8 text-right">{line.line_number}.</span>
                        <span
                          className="px-1 rounded dark:text-pfm-text"
                          style={{ backgroundColor: `${line.artist_color}20` }}
                        >
                          {line.text}
                        </span>
                      </div>
                    ))}
                    {report.lines.length > 20 && (
                      <p className="text-sm text-gray-500 dark:text-pfm-text-muted pl-10">
                        ... and {report.lines.length - 20} more lines
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-pfm-text mb-4">Upload Audio</h2>
              {artists.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-pfm-text-muted space-y-3">
                  <Music className="w-12 h-12 mx-auto text-gray-300 dark:text-pfm-text-muted" />
                  <p className="font-medium">Upload a script first</p>
                  <p className="text-sm">Go to the <strong>Script</strong> tab, upload your color-coded .docx script, then come back here to upload each artist’s audio.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('script')}
                    className="mt-2 px-4 py-2 bg-purple-600 dark:bg-pfm-accent text-white rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover text-sm"
                  >
                    Go to Script tab
                  </button>
                </div>
              ) : (
                <AudioUpload
                  projectId={project.id}
                  artists={artists}
                  onUploadComplete={refreshReport}
                />
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-6">
              {report ? (
                <QCReport report={report} />
              ) : (
                <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-8 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-pfm-text-muted" />
                  <p className="text-gray-500 dark:text-pfm-text-muted">Upload a script and audio to generate QC report</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {artists.length > 0 && (
            <div className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-4 shadow-sm">
              <ArtistPanel
                projectId={project.id}
                artists={artists}
                onUpdate={refreshReport}
              />
            </div>
          )}

          {report && (
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-pfm-accent dark:to-pfm-accent-muted rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-80">Completion</span>
                  <span className="font-bold">{report.completion_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Total Lines</span>
                  <span className="font-bold">{report.total_lines}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Artists</span>
                  <span className="font-bold">{report.artists.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
