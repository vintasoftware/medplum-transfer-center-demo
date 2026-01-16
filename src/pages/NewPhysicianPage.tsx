import { Container, Loader } from '@mantine/core';
import { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { PHYSICIAN_ONBOARDING_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';

export function NewPhysicianPage(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    getQuestionnaireByName(medplum, PHYSICIAN_ONBOARDING_QUESTIONNAIRE_NAME)
      .then(setQuestionnaire)
      .catch((err) => {
        console.error('Failed to load questionnaire:', err);
      });
  }, [medplum]);

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

  if (!questionnaire) {
    return (
      <Container fluid>
        <Loader />
      </Container>
    );
  }

  return (
    <Container fluid>
      <QuestionnaireForm questionnaire={questionnaire} onSubmit={handleSubmit} />
    </Container>
  );
}
