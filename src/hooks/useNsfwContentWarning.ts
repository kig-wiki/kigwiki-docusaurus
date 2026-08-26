import { useCallback, useRef, useState } from 'react';
import { hasNsfwConsent, setNsfwConsent } from '../utils/nsfwConsent';

export function useNsfwContentWarning(makerName: string, enabled: boolean) {
  const [open, setOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const request = useCallback(
    (action: () => void) => {
      if (!enabled || hasNsfwConsent(makerName)) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setOpen(true);
    },
    [enabled, makerName]
  );

  const confirm = useCallback(() => {
    setNsfwConsent(makerName);
    setOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, [makerName]);

  const cancel = useCallback(() => {
    pendingActionRef.current = null;
    setOpen(false);
  }, []);

  return { open, request, confirm, cancel };
}
