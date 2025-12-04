import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  createReference,
  getQuestionnaireAnswers,
  MedplumClient,
  normalizeErrorString,
  PatchOperation,
} from '@medplum/core';
import { Annotation, Questionnaire, QuestionnaireResponse, ServiceRequest } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumProfile } from '@medplum/react';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';

interface AddServiceRequestNoteModalProps {
  readonly serviceRequest: ServiceRequest;
  readonly onChange: (updatedServiceRequest: ServiceRequest) => void;
}

export function AddServiceRequestNoteModal(props: AddServiceRequestNoteModalProps): JSX.Element {
  const { serviceRequest, onChange } = props;
  const medplum = useMedplum();
  const author = useMedplumProfile();
  const [opened, { toggle, close }] = useDisclosure(false);

  async function handleAddNote(
    note: Annotation,
    serviceRequest: ServiceRequest,
    medplum: MedplumClient,
    onChange: (serviceRequest: ServiceRequest) => void
  ): Promise<void> {
    // We use a patch operation here to avoid race conditions. This ensures that if multiple users try to add a note simultaneously, only one will be successful.
    const ops: PatchOperation[] = [{ op: 'test', path: '/meta/versionId', value: serviceRequest.meta?.versionId }];

    const notes = serviceRequest?.note || [];
    notes.push(note);

    const op: PatchOperation['op'] = serviceRequest.note ? 'replace' : 'add';

    ops.push({ op, path: '/note', value: notes });

    try {
      const result = await medplum.patchResource('ServiceRequest', serviceRequest.id as string, ops);
      notifications.show({
        icon: <IconCircleCheck />,
        title: 'Success',
        message: 'Note added.',
      });
      onChange(result);
    } catch (error) {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(error),
      });
    }
  }

  async function onQuestionnaireSubmit(formData: QuestionnaireResponse): Promise<void> {
    const answer = getQuestionnaireAnswers(formData)['new-note'].valueString;
    if (answer) {
      const newNote: Annotation = {
        text: answer,
        authorReference: author && createReference(author),
        time: new Date().toISOString(),
      };
      // Add the note to the service request
      await handleAddNote(newNote, serviceRequest, medplum, onChange).catch((error) => console.error(error));
    }

    close();
  }

  return (
    <div>
      <Button fullWidth onClick={toggle}>
        Add a Note
      </Button>
      <Modal opened={opened} onClose={close}>
        <QuestionnaireForm questionnaire={noteQuestionnaire} onSubmit={onQuestionnaireSubmit} />
      </Modal>
    </div>
  );
}

const noteQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'active',
  id: 'add-note',
  title: 'Add a note',
  item: [
    {
      linkId: 'new-note',
      text: 'Note',
      type: 'string',
    },
  ],
};
