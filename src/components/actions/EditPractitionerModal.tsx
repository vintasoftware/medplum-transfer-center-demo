import { Modal } from '@mantine/core';
import { Resource } from '@medplum/fhirtypes';
import { ResourceForm, useMedplum } from '@medplum/react';
import { useNavigate, useParams } from 'react-router-dom';

interface EditPractitionerModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function EditPractitionerModal(props: EditPractitionerModalProps): JSX.Element {
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();

  function handleSubmit(resource: Resource): void {
    medplum
      .updateResource(resource)
      .then(() => navigate('/physicians'))
      .catch(console.error);
  }

  return (
    <Modal size="lg" opened={props.opened} onClose={props.onClose}>
      <ResourceForm defaultValue={{ reference: `Practitioner/${id}` }} onSubmit={handleSubmit} />
    </Modal>
  );
}
