import { Modal } from '@mantine/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum } from '@medplum/react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_ID } from '@/constants';

interface AssignQuestionnaireModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function AssignQuestionnaireModal(props: AssignQuestionnaireModalProps): JSX.Element {
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();

  // const defaultResource = { resourceType } as Resource;
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
      <QuestionnaireForm
        questionnaire={{ reference: `Questionnaire/${QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_ID}` }}
        subject={{ reference: `Practitioner/${id}` }}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
