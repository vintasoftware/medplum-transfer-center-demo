import { LOINC, UCUM } from '@medplum/core';
import { ObservationComponent } from '@medplum/fhirtypes';

/**
 * Creates a ObservationComponent array for blood pressure.
 * @param diastolic The diastolic blood pressure value.
 * @param systolic The systolic blood pressure value.
 * @returns The ObservationComponent array.
 */
export function createBloodPressureObservationComponent({
  diastolic,
  systolic,
}: {
  diastolic?: number;
  systolic?: number;
}): ObservationComponent[] | undefined {
  if (diastolic === undefined && systolic === undefined) {
    return undefined;
  }

  const components: ObservationComponent[] = [];

  if (diastolic) {
    components.push({
      code: {
        coding: [
          {
            system: LOINC,
            code: '8462-4',
            display: 'Diastolic blood pressure',
          },
        ],
        text: 'Diastolic blood pressure',
      },
      valueQuantity: {
        value: diastolic,
        unit: 'mmHg',
        system: UCUM,
        code: 'mm[Hg]',
      },
    });
  }

  if (systolic) {
    components.push({
      code: {
        coding: [
          {
            system: LOINC,
            code: '8480-6',
            display: 'Systolic blood pressure',
          },
        ],
        text: 'Systolic blood pressure',
      },
      valueQuantity: {
        value: systolic,
        unit: 'mmHg',
        system: UCUM,
        code: 'mm[Hg]',
      },
    });
  }

  return components;
}
