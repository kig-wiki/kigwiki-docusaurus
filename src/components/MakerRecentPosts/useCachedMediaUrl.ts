import { useCallback, useEffect, useRef, useState } from 'react';
import { invalidateCachedMedia, resolveCachedMediaUrl } from '../../utils/mediaCache';

export function useCachedMediaUrl(remoteUrl: string): {
  src: string;
  isResolving: boolean;
  onMediaError: () => void;
} {
  const [src, setSrc] = useState(remoteUrl);
  const [isResolving, setIsResolving] = useState(true);
  const objectUrlRef = useRef<string | null>(null);
  const hasErroredRef = useRef(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    hasErroredRef.current = false;

    if (!remoteUrl) {
      setSrc('');
      setIsResolving(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsResolving(true);
      revokeObjectUrl();

      const resolved = await resolveCachedMediaUrl(remoteUrl);
      if (cancelled) {
        if (resolved.startsWith('blob:')) {
          URL.revokeObjectURL(resolved);
        }
        return;
      }

      if (resolved.startsWith('blob:')) {
        objectUrlRef.current = resolved;
      }

      setSrc(resolved);
      setIsResolving(false);
    };

    void load();

    return () => {
      cancelled = true;
      revokeObjectUrl();
    };
  }, [remoteUrl, revokeObjectUrl]);

  const onMediaError = useCallback(() => {
    if (hasErroredRef.current) {
      return;
    }
    hasErroredRef.current = true;

    void invalidateCachedMedia(remoteUrl).then(() => {
      revokeObjectUrl();
      setSrc(remoteUrl);
      setIsResolving(false);
    });
  }, [remoteUrl, revokeObjectUrl]);

  return { src, isResolving, onMediaError };
}
