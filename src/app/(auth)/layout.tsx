import { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen bg-[#050a05]'>
      {children}
    </div>
  );
}
