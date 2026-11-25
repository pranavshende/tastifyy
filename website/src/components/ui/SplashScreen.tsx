import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  const [phase, setPhase] = useState<'entering' | 'exiting' | 'hidden'>('entering');

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setPhase('exiting'), 600);
    const removeTimer = window.setTimeout(() => setPhase('hidden'), 960);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div className={`site-splash${phase === 'exiting' ? ' site-splash--exiting' : ''}`} aria-hidden="true">
      <div className="site-splash__content">
        <div className="site-splash__logo-frame">
          <img src="/favicon.svg" alt="" />
        </div>
        <span className="site-splash__accent" />
      </div>
    </div>
  );
}
