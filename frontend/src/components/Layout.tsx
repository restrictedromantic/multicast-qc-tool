import { Link, useLocation } from 'react-router-dom';
import { Mic2, Settings, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Mic2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Multicast QC</h1>
                  <p className="text-xs text-gray-500">Pocket FM</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                  location.pathname === '/'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/settings"
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                  location.pathname === '/settings'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
