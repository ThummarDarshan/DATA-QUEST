import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'toast';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'default',
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Error
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/50 rounded-md hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const ErrorToast: React.FC<{
  error: string;
  onDismiss: () => void;
  onRetry?: () => void;
}> = ({ error, onDismiss, onRetry }) => {
  return (
    <ErrorMessage
      error={error}
      onDismiss={onDismiss}
      onRetry={onRetry}
      variant="toast"
    />
  );
};
