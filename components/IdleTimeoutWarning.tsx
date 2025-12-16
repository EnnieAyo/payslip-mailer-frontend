'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface IdleTimeoutWarningProps {
  isOpen: boolean;
  countdown: number;
  onContinue: () => void;
}

export function IdleTimeoutWarning({ isOpen, countdown, onContinue }: IdleTimeoutWarningProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        />
        <div className="relative bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-dark-900 dark:text-gray-100 mb-2">
              Session Timeout Warning
            </h2>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              You've been inactive for a while. You will be logged out in:
            </p>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-6xl font-bold text-primary-500 dark:text-primary-400">
                {countdown}
              </div>
              <div className="ml-2 text-xl text-gray-600 dark:text-gray-400">
                seconds
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={onContinue}
                variant="primary"
                className="px-8"
              >
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
