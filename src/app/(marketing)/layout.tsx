import { PropsWithChildren } from 'react';

import { CookieBanner } from './_components/cookie-banner';

const GLOW_CSS = `
  html, body {
    background-color: #050a05;
    background-image:
      radial-gradient(ellipse 80vw 60vh at 50% -10%, rgba(26,122,69,.14) 0%, transparent 70%);
    background-attachment: fixed;
    background-repeat: no-repeat;
  }
`;

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOW_CSS }} />
      {children}
      <CookieBanner />
    </>
  );
}
