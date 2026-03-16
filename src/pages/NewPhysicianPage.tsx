import { PHYSICIAN_ONBOARDING_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';
import { Alert, Container, Loader } from '@mantine/core';
import { normalizeErrorString } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';

export function NewPhysicianPage(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getQuestionnaireByName(medplum, PHYSICIAN_ONBOARDING_QUESTIONNAIRE_NAME)
      .then(setQuestionnaire)
      .catch((err) => {
        setError(normalizeErrorString(err));
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

  if (error) {
    return (
      <Container fluid>
        <Alert color="red" title="Error loading questionnaire">
          {error}
        </Alert>
      </Container>
    );
  }

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
