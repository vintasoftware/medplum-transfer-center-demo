import { Modal } from '@mantine/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum } from '@medplum/react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_ID } from '@/constants';

interface AssignToRoomModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function AssignToRoomModal(props: AssignToRoomModalProps): JSX.Element {
  const { opened, onClose } = props;
  const { id } = useParams();
  const medplum = useMedplum();

  const handleSubmit = useCallback(
    (response: QuestionnaireResponse) => {
      medplum
        .createResource(response)
        .then(() => {
          onClose();
        })
        .catch(console.error);
    },
    [medplum, onClose]
  );

  return (
    <Modal size="lg" opened={opened} onClose={onClose}>
      <QuestionnaireForm
        questionnaire={{ reference: `Questionnaire/${PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_ID}` }}
        subject={{ reference: `ServiceRequest/${id}` }}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
