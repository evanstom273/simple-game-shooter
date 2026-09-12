import { useCallback, useEffect, useState } from 'react';

interface ViewportWithSegments extends Window {
  viewport?: { segments?: DOMRectReadOnly[] };
}

interface OrientationState {
  isFoldableOrLargeTouch: boolean;
  isSmallTouchscreen: boolean;
  isPortrait: boolean;
}

interface LockableOrientation extends ScreenOrientation {
  lock: (orientation: 'landscape') => Promise<void>;
}

function readOrientationState(): OrientationState {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const minimumScreenSide = Math.min(window.screen.width, window.screen.height);
  const segments = (window as ViewportWithSegments).viewport?.segments;
  const hasSplitViewport = (segments?.length ?? 0) > 1
    || window.matchMedia('(horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)').matches;
  const largeTouchDisplay = coarsePointer && minimumScreenSide >= 600;

  return {
    isFoldableOrLargeTouch: hasSplitViewport || largeTouchDisplay,
    isSmallTouchscreen: coarsePointer && minimumScreenSide < 600,
    isPortrait: window.innerHeight > window.innerWidth,
  };
}

export function useGameOrientation() {
  const [state, setState] = useState<OrientationState>(() => readOrientationState());

  useEffect(() => {
    const update = () => setState(readOrientationState());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    window.screen.orientation?.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.screen.orientation?.removeEventListener('change', update);
      window.screen.orientation?.unlock();
    };
  }, []);

  useEffect(() => {
    if (state.isFoldableOrLargeTouch) window.screen.orientation?.unlock();
  }, [state.isFoldableOrLargeTouch]);

  const requestGameOrientation = useCallback(async (): Promise<boolean> => {
    if (!state.isSmallTouchscreen || state.isFoldableOrLargeTouch) return true;
    const screenOrientation = window.screen.orientation as LockableOrientation | undefined;
    if (!screenOrientation?.lock) return false;
    try {
      await screenOrientation.lock('landscape');
      return true;
    } catch {
      return false;
    }
  }, [state.isFoldableOrLargeTouch, state.isSmallTouchscreen]);

  return { ...state, requestGameOrientation };
}
