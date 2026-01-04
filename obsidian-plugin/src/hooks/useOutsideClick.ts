import { useEffect } from 'react';

export function useOutsideClick(
  targets: Array<React.RefObject<HTMLElement | null>>,
  onOutside: () => void,
  options?: { ignore?: Array<React.RefObject<HTMLElement | null>>; enabled?: boolean },
) {
  const { ignore = [], enabled = true } = options || {};

  useEffect(() => {
    if (!enabled) return undefined;

    const handle = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const isInTarget = targets.some((ref) => ref.current && ref.current.contains(target));
      if (isInTarget) return;

      const isInIgnore = ignore.some((ref) => ref.current && ref.current.contains(target));
      if (isInIgnore) return;

      onOutside();
    };

    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [targets, ignore, onOutside, enabled]);
}
