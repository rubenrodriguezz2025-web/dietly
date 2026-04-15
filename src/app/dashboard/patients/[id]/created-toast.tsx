'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';

export function CreatedToast({ id }: { id: string }) {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    toast({ title: 'Paciente creado correctamente' });
    router.replace(`/dashboard/patients/${id}`);
  }, [id, router, toast]);

  return null;
}
