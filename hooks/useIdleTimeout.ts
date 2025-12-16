import { useState, useCallback, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';

interface UseIdleTimeoutOptions {
  idleTime?: number; // Time in ms before showing warning (default: 2 minutes)
  warningTime?: number; // Time in ms for warning countdown (default: 30 seconds)
  onTimeout: () => void; // Called when timeout expires
  enabled?: boolean;
}

export function useIdleTimeout({
  idleTime = 2 * 60 * 1000, // 2 minutes
  warningTime = 30 * 1000, // 30 seconds
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningTime / 1000);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const handleIdle = useCallback(() => {
    if (!isTimedOut) {
      setShowWarning(true);
      setCountdown(warningTime / 1000);
    }
  }, [warningTime, isTimedOut]);

  const idleTimer = useIdleTimer({
    timeout: idleTime,
    onIdle: handleIdle,
    disabled: !enabled || isTimedOut,
    debounce: 500,
    eventsThrottle: 200,
  });

  const reset = useCallback(() => {
    setShowWarning(false);
    setCountdown(warningTime / 1000);
    setIsTimedOut(false);
    idleTimer.reset();
  }, [idleTimer, warningTime]);

  // Countdown timer for warning
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimedOut(true);
          setShowWarning(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, onTimeout]);

  return {
    showWarning,
    countdown,
    reset,
    getRemainingTime: idleTimer.getRemainingTime,
    getElapsedTime: idleTimer.getElapsedTime,
    isIdle: idleTimer.isIdle,
  };
}
