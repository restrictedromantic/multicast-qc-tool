import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Trash2, ExternalLink } from 'lucide-react';
import { projectsApi, Project } from '../lib/api';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    show_code: '',
    episode_number: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const response = await projectsApi.create(newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', show_code: '', episode_number: '' });
      navigate(`/project/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsApi.delete(id);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const copyShareLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/project/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-pfm-text">Projects</h1>
          <p className="text-gray-500 dark:text-pfm-text-muted">Manage your multicast QC projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-pfm-accent text-white rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 dark:border-pfm-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border">
          <Folder className="w-12 h-12 text-gray-300 dark:text-pfm-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-pfm-text mb-2">No projects yet</h3>
          <p className="text-gray-500 dark:text-pfm-text-muted mb-4">Create your first QC project to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 dark:bg-pfm-accent text-white rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="bg-white dark:bg-pfm-surface rounded-xl border border-gray-200 dark:border-pfm-border p-5 hover:shadow-lg hover:border-purple-300 dark:hover:border-pfm-accent transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-pfm-text group-hover:text-purple-600 dark:group-hover:text-pfm-accent transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-pfm-text-muted">
                    {project.show_code} - {project.episode_number}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => copyShareLink(project.id, e)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-pfm-accent dark:hover:bg-pfm-surface-hover rounded-lg"
                    title="Copy share link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => deleteProject(project.id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-pfm-error dark:hover:bg-pfm-error/10 rounded-lg"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    project.script_uploaded
                      ? 'bg-green-100 text-green-700 dark:bg-pfm-success/20 dark:text-pfm-success'
                      : 'bg-gray-100 text-gray-600 dark:bg-pfm-surface-hover dark:text-pfm-text-muted'
                  )}
                >
                  {project.script_uploaded ? 'Script uploaded' : 'No script'}
                </span>
                <span className="text-xs text-gray-400 dark:text-pfm-text-muted">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-pfm-surface rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-pfm-border">
            <h2 className="text-xl font-bold text-gray-900 dark:text-pfm-text mb-4">New QC Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-pfm-text-muted mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g., Mystery Show Episode 45"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-pfm-border dark:bg-pfm-bg dark:text-pfm-text rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-pfm-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-pfm-text-muted mb-1">
                  Show Code
                </label>
                <input
                  type="text"
                  value={newProject.show_code}
                  onChange={(e) => setNewProject({ ...newProject, show_code: e.target.value })}
                  placeholder="e.g., MYS"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-pfm-border dark:bg-pfm-bg dark:text-pfm-text rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-pfm-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-pfm-text-muted mb-1">
                  Episode Number
                </label>
                <input
                  type="text"
                  value={newProject.episode_number}
                  onChange={(e) => setNewProject({ ...newProject, episode_number: e.target.value })}
                  placeholder="e.g., E045"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-pfm-border dark:bg-pfm-bg dark:text-pfm-text rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-pfm-accent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-pfm-text-muted dark:hover:bg-pfm-surface-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProject.name || !newProject.show_code || !newProject.episode_number}
                className="px-4 py-2 bg-purple-600 dark:bg-pfm-accent text-white rounded-lg hover:bg-purple-700 dark:hover:bg-pfm-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
