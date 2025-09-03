import { useRef, useEffect, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<number>();
  const lastArgs = useRef<any[]>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useCallback((...args: any[]) => {
    lastArgs.current = args;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      callbackRef.current(...(lastArgs.current ?? []));
      lastArgs.current = undefined;
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      if (lastArgs.current) {
        callbackRef.current(...lastArgs.current);
        lastArgs.current = undefined;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      lastArgs.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  return { debounced, flush, cancel };
}
