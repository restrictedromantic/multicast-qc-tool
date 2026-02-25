import { useState } from 'react';
import { CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { QCReport as QCReportType } from '../lib/api';
import { cn, getContrastColor, formatPercentage } from '../lib/utils';

interface QCReportProps {
  report: QCReportType;
}

export default function QCReport({ report }: QCReportProps) {
  const [filter, setFilter] = useState<'all' | 'found' | 'partial' | 'missing'>('all');
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  const filteredLines = report.lines.filter((line) => {
    if (filter === 'all') return true;
    if (filter === 'missing') return line.status === 'missing' || line.status === 'pending';
    return line.status === filter;
  });

  const toggleExpand = (lineId: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'found':
        return 'bg-green-50 border-green-200 dark:bg-pfm-success/20 dark:border-pfm-success/40';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 dark:bg-pfm-warning/20 dark:border-pfm-warning/40';
      default:
        return 'bg-red-50 border-red-200 dark:bg-pfm-error/20 dark:border-pfm-error/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-pfm-surface rounded-xl p-4 border border-gray-200 dark:border-pfm-border shadow-sm">
          <p className="text-sm text-gray-500 dark:text-pfm-text-muted">Total Lines</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-pfm-text">{report.total_lines}</p>
        </div>
        <div className="bg-green-50 dark:bg-pfm-success/20 rounded-xl p-4 border border-green-200 dark:border-pfm-success/40">
          <p className="text-sm text-green-600 dark:text-pfm-success">Found</p>
          <p className="text-2xl font-bold text-green-700 dark:text-pfm-success">{report.found_lines}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-pfm-warning/20 rounded-xl p-4 border border-yellow-200 dark:border-pfm-warning/40">
          <p className="text-sm text-yellow-600 dark:text-pfm-warning">Partial</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-pfm-warning">{report.partial_lines}</p>
        </div>
        <div className="bg-red-50 dark:bg-pfm-error/20 rounded-xl p-4 border border-red-200 dark:border-pfm-error/40">
          <p className="text-sm text-red-600 dark:text-pfm-error">Missing</p>
          <p className="text-2xl font-bold text-red-700 dark:text-pfm-error">{report.missing_lines}</p>
        </div>
      </div>

      {/* Completion Bar */}
      <div className="bg-white dark:bg-pfm-surface rounded-xl p-4 border border-gray-200 dark:border-pfm-border shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-pfm-text-muted">Overall Completion</span>
          <span className="text-lg font-bold text-purple-600 dark:text-pfm-accent">
            {formatPercentage(report.completion_percentage)}
          </span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-pfm-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-pfm-accent dark:to-pfm-accent-muted transition-all duration-500"
            style={{ width: `${report.completion_percentage}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'found', 'partial', 'missing'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f
                ? 'bg-purple-100 text-purple-700 dark:bg-pfm-accent/20 dark:text-pfm-accent'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-pfm-surface dark:text-pfm-text-muted dark:hover:bg-pfm-surface-hover dark:border-pfm-border'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-2 text-xs">
                ({f === 'found' ? report.found_lines : f === 'partial' ? report.partial_lines : report.missing_lines})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lines List */}
      <div className="space-y-2">
        {filteredLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'rounded-lg border transition-all',
              getStatusBg(line.status)
            )}
          >
            <div
              className="p-3 flex items-start gap-3 cursor-pointer"
              onClick={() => toggleExpand(line.id)}
            >
              {getStatusIcon(line.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-pfm-text-muted">
                    Line {line.line_number}
                  </span>
                  {line.artist_name && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: line.artist_color,
                        color: getContrastColor(line.artist_color),
                      }}
                    >
                      {line.artist_name}
                    </span>
                  )}
                  {line.confidence > 0 && (
                    <span className="text-xs text-gray-500 dark:text-pfm-text-muted">
                      {formatPercentage(line.confidence * 100)} match
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900 dark:text-pfm-text">{line.text}</p>
              </div>
              {expandedLines.has(line.id) ? (
                <ChevronUp className="w-4 h-4 text-gray-400 dark:text-pfm-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-pfm-text-muted" />
              )}
            </div>
            
            {expandedLines.has(line.id) && line.matched_text && (
              <div className="px-3 pb-3 pt-0 ml-7">
                <p className="text-xs text-gray-500 dark:text-pfm-text-muted mb-1">Matched in transcription:</p>
                <p className="text-sm text-gray-700 dark:text-pfm-text bg-white/50 dark:bg-pfm-bg p-2 rounded border border-gray-200 dark:border-pfm-border">
                  "{line.matched_text}"
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredLines.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-pfm-text-muted">
            No lines match this filter
          </div>
        )}
      </div>
    </div>
  );
}
