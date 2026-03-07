import Link from 'next/link';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2'>
      <LeafIcon />
      <span className='font-alt text-xl text-white'>Dietly</span>
    </Link>
  );
}

function LeafIcon() {
  return (
    <svg
      width='36'
      height='36'
      viewBox='0 0 40 40'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden
    >
      <rect width='40' height='40' rx='10' fill='#1a7a45' />
      <path
        fill='white'
        d='M20 31 C11 29 7 22 9 14 C11 8 16 6 20 6 C24 6 31 10 31 19 C31 26 26 31 20 31 Z'
      />
      <path
        stroke='#1a7a45'
        strokeWidth='2'
        strokeLinecap='round'
        d='M20 30 L20 13'
      />
      <path
        stroke='#1a7a45'
        strokeWidth='1.3'
        strokeLinecap='round'
        d='M20 23 L25 18'
      />
      <path
        stroke='#1a7a45'
        strokeWidth='1.3'
        strokeLinecap='round'
        d='M20 19 L15 15'
      />
    </svg>
  );
}
