import { Patient, Reference } from '@medplum/fhirtypes';
import { createAllergy } from './createAllergy';
import { SNOMED } from '@medplum/core';

describe('createAllergy', () => {
  const patient: Reference<Patient> = { reference: 'Patient/123' };
  it('returns undefined if no allergy is defined', () => {
    const allergy = createAllergy({
      allergy: undefined,
      patient: patient,
    });

    expect(allergy).toBeUndefined();
  });

  it('returns AllergyIntolerance resource', () => {
    const allergy = createAllergy({
      allergy: {
        system: SNOMED,
        code: '256259004',
        display: 'Pollen (substance)',
      },
      patient: patient,
    });

    expect(allergy).toEqual({
      resourceType: 'AllergyIntolerance',
      clinicalStatus: {
        text: 'Active',
        coding: [
          {
            system: 'http://hl7.org/fhir/ValueSet/allergyintolerance-clinical',
            code: 'active',
            display: 'Active',
          },
        ],
      },
      verificationStatus: {
        text: 'Unconfirmed',
        coding: [
          {
            system: 'http://hl7.org/fhir/ValueSet/allergyintolerance-verification',
            code: 'unconfirmed',
            display: 'Unconfirmed',
          },
        ],
      },
      patient: patient,
      code: {
        coding: [
          {
            system: SNOMED,
            code: '256259004',
            display: 'Pollen (substance)',
          },
        ],
      },
    });
  });
});
