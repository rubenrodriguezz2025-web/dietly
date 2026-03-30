'use client';

import { useEffect, useState } from 'react';

import { Analytics } from '@vercel/analytics/react';

export function ConsentAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    function check() {
      setHasConsent(localStorage.getItem('dietly_cookie_consent') === 'all');
    }
    check();
    window.addEventListener('dietly:cookie-consent', check);
    return () => window.removeEventListener('dietly:cookie-consent', check);
  }, []);

  if (!hasConsent) return null;
  return <Analytics />;
}
