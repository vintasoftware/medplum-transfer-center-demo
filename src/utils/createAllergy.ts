import { Coding, Reference, Patient, AllergyIntolerance } from '@medplum/fhirtypes';

/**
 * Creates an AllergyIntolerance resource.
 * @param allergy The allergy coding.
 * @param patient The patient reference.
 * @returns The AllergyIntolerance resource, or undefined if no allergy is defined.
 */
export function createAllergy({
  allergy,
  patient,
}: {
  allergy: Coding | undefined;
  patient: Reference<Patient>;
}): AllergyIntolerance | undefined {
  if (!allergy) return undefined;

  const allergyResource: AllergyIntolerance = {
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
    code: { coding: [allergy] },
  };

  return allergyResource;
}
