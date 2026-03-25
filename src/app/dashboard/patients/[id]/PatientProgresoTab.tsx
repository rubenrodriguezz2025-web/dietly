'use client';

import type { PatientProgress } from '@/types/dietly';

import { ProgressTab } from './progress-tab';

export type PatientProgresoTabProps = {
  progress: PatientProgress[];
  patientId: string;
  patientName: string;
};

export function PatientProgresoTab({ progress, patientId, patientName }: PatientProgresoTabProps) {
  return (
    <ProgressTab
      progress={progress}
      patientId={patientId}
      patientName={patientName}
    />
  );
}
