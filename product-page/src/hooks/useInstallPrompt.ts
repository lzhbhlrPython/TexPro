import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** 监听浏览器的安装事件；只有真的可以装的时候按钮才出现。 */
export function useInstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (raw: Event) => {
      raw.preventDefault();
      setEvent(raw as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === 'accepted') setEvent(null);
  };

  return { canInstall: Boolean(event), install };
}
