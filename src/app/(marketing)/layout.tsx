import { PropsWithChildren } from 'react';

import { CookieBanner } from './_components/cookie-banner';

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
