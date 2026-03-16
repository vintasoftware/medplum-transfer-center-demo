import { QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';
import { Alert, Loader, Modal } from '@mantine/core';
import { normalizeErrorString } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface AssignQuestionnaireModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function AssignQuestionnaireModal(props: AssignQuestionnaireModalProps): JSX.Element {
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getQuestionnaireByName(medplum, QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_NAME)
      .then(setQuestionnaire)
      .catch((err) => {
        setError(normalizeErrorString(err));
      });
  }, [medplum]);

  const handleSubmit = useCallback(
    (response: QuestionnaireResponse) => {
      medplum
        .createResource(response)
        .then(() => navigate('/physicians'))
        .catch(console.error);
    },
    [medplum, navigate]
  );

  return (
    <Modal size="lg" opened={props.opened} onClose={props.onClose}>
      {error ? (
        <Alert color="red" title="Error loading questionnaire">
          {error}
        </Alert>
      ) : !questionnaire ? (
        <Loader />
      ) : (
        <QuestionnaireForm
          questionnaire={questionnaire}
          subject={{ reference: `Practitioner/${id}` }}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
