import { useIdleTimer } from 'react-idle-timer';

interface UseIdleTimeoutOptions {
  timeout?: number;
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeout = 15 * 60 * 1000,
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const idleTimer = useIdleTimer({
    timeout,
    onIdle,
    disabled: !enabled,
    debounce: 500,
    eventsThrottle: 200,
  });

  return {
    getRemainingTime: idleTimer.getRemainingTime,
    getElapsedTime: idleTimer.getElapsedTime,
    isIdle: idleTimer.isIdle,
    reset: idleTimer.reset,
  };
}
