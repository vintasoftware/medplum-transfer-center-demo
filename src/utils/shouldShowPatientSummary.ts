import { parseReference } from '@medplum/core';
import { Encounter } from '@medplum/fhirtypes';

export function shouldShowPatientSummary(encounter: Encounter): boolean {
  if (!encounter.subject) {
    return false;
  }

  if (parseReference(encounter.subject)[0] === 'Patient') {
    return true;
  }

  return false;
}
