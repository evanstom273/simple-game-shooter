import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const updateInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setInstalled(standalone);
    };
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };

    updateInstalled();
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install(): Promise<void> {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === 'accepted') setPromptEvent(null);
  }

  return { canInstall: Boolean(promptEvent) && !installed, installed, install };
}
