import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

const CRISP_WEBSITE_ID = '8fab9831-32f1-4479-a7ac-a2ba55eddee0';

export function CrispChat() {
  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Load Crisp script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.onerror = () => {
      console.warn('Crisp chat failed to load');
    };
    document.head.appendChild(script);

    // Configure Crisp after it loads
    const configInterval = setInterval(() => {
      if (window.$crisp && window.$crisp.push) {
        // Black theme
        window.$crisp.push(['config', 'color:theme', ['black']]);

        // Show preview message after 10 seconds (once per session)
        window.$crisp.push(['on', 'session:loaded', () => {
          if (!sessionStorage.getItem('crisp_preview_shown')) {
            setTimeout(() => {
              window.$crisp.push(['do', 'message:show', ['text', 'Need help with skills? Chat with us!']]);
              sessionStorage.setItem('crisp_preview_shown', 'true');
            }, 10000);
          }
        }]);

        clearInterval(configInterval);
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(configInterval);
    };
  }, []);

  // Suppress Crisp errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Invalid data') || event.filename?.includes('crisp')) {
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}
