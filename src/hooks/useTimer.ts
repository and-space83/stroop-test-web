import { useRef, useCallback } from 'react';

export function useTimer() {
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback((): number => {
    if (startTimeRef.current === null) return 0;
    return performance.now() - startTimeRef.current;
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = null;
  }, []);

  const getElapsed = useCallback((): number => {
    if (startTimeRef.current === null) return 0;
    return performance.now() - startTimeRef.current;
  }, []);

  return { start, stop, reset, getElapsed };
}
