import { Button } from '@mantine/core';
import { Reference } from '@medplum/fhirtypes';

type EditPatientButtonProps = {
  onClick: () => void;
  patient: Reference;
};

export function EditPatientButton(props: EditPatientButtonProps): JSX.Element {
  return <Button onClick={props.onClick}>Edit</Button>;
}
