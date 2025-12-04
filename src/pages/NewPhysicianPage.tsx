import { Container } from '@mantine/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { useCallback } from 'react';
import { PHYSICIAN_ONBOARDING_QUESTIONNAIRE_ID } from '@/constants';

export function NewPhysicianPage(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();

  const handleSubmit = useCallback(
    (response: QuestionnaireResponse) => {
      medplum
        .createResource(response)
        .then(() => {
          navigate('/physicians');
        })
        .catch(console.error);
    },
    [medplum, navigate]
  );

  return (
    <Container fluid>
      <QuestionnaireForm
        questionnaire={{ reference: `Questionnaire/${PHYSICIAN_ONBOARDING_QUESTIONNAIRE_ID}` }}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
