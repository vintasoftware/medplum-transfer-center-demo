import { Loader, Modal } from '@mantine/core';
import { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';

interface AssignQuestionnaireModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function AssignQuestionnaireModal(props: AssignQuestionnaireModalProps): JSX.Element {
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    getQuestionnaireByName(medplum, QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_NAME)
      .then(setQuestionnaire)
      .catch((err) => {
        console.error('Failed to load questionnaire:', err);
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
      {!questionnaire ? (
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
