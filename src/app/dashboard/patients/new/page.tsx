import { NewPatientForm } from './new-patient-form';

export default function NewPatientPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold text-zinc-100'>Nuevo paciente</h1>
        <p className='mt-1 text-sm text-zinc-500'>
          Introduce los datos del paciente para crear su ficha clínica.
        </p>
      </div>
      <NewPatientForm />
    </div>
  );
}
