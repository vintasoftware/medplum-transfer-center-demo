import { Title } from '@mantine/core';
import { Logo, SignInForm } from '@medplum/react';
import { useNavigate } from 'react-router-dom';
import { MEDPLUM_GOOGLE_CLIENT_ID, MEDPLUM_PROJECT_ID } from '../config';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <SignInForm
      projectId={MEDPLUM_PROJECT_ID}
      googleClientId={MEDPLUM_GOOGLE_CLIENT_ID}
      onSuccess={() => navigate('/')}
    >
      <Logo size={32} />
      <Title>Sign in to SampleMed Regional Portal </Title>
    </SignInForm>
  );
}
