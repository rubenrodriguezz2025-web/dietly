import { PropsWithChildren } from 'react';

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen bg-[#050a05] text-white'>
      {children}
    </div>
  );
}
