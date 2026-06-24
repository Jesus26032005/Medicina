import { useEffect } from 'react';

const SPACE_INTERACTIVE_SELECTOR =
  'input, textarea, select, button, [contenteditable="true"], [role="button"]';

export default function usePreventSpaceScroll() {
  useEffect(() => {
    function preventSpaceScroll(event) {
      const isSpaceKey = event.code === 'Space' || event.key === ' ';

      if (!isSpaceKey || event.defaultPrevented) {
        return;
      }

      const target = event.target;
      const isInteractive =
        target instanceof Element && target.closest(SPACE_INTERACTIVE_SELECTOR);

      if (!isInteractive) {
        event.preventDefault();
      }
    }

    window.addEventListener('keydown', preventSpaceScroll, { passive: false });

    return () => window.removeEventListener('keydown', preventSpaceScroll);
  }, []);
}
