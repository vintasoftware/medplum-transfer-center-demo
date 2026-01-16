import { Loader, Modal } from '@mantine/core';
import { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';

interface AssignToRoomModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function AssignToRoomModal(props: AssignToRoomModalProps): JSX.Element {
  const { opened, onClose } = props;
  const { id } = useParams();
  const medplum = useMedplum();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    getQuestionnaireByName(medplum, PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_NAME)
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
          onClose();
        })
        .catch(console.error);
    },
    [medplum, onClose]
  );

  return (
    <Modal size="lg" opened={opened} onClose={onClose}>
      {!questionnaire ? (
        <Loader />
      ) : (
        <QuestionnaireForm
          questionnaire={questionnaire}
          subject={{ reference: `ServiceRequest/${id}` }}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
