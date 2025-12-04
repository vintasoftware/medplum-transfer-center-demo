import { Reference, Patient, CodeableConcept, Observation, ObservationComponent } from '@medplum/fhirtypes';

/**
 * Creates an Observation resource.
 * @param patient The patient reference.
 * @param effectiveDateTime The effective date/time of the Observation.
 * @param category The category of the Observation.
 * @param code The code of the Observation.
 * @param valueQuantity The valueQuantity of the Observation.
 * @param valueCodeableConcept The valueCodeableConcept of the Observation.
 * @param component The component of the Observation.
 * @param hasMember The hasMember of the Observation.
 * @param note The note of the Observation.
 * @param derivedFrom The derivedFrom of the Observation.
 * @returns The Observation resource, or undefined if no value nor component nor note is defined.
 */
export function createObservation({
  patient,
  effectiveDateTime,
  category,
  code,
  valueQuantity,
  valueCodeableConcept,
  component,
  hasMember,
  note,
  derivedFrom,
}: {
  patient: Reference<Patient>;
  effectiveDateTime: string;
  category?: CodeableConcept;
  code: CodeableConcept;
  valueQuantity?: Observation['valueQuantity'];
  valueCodeableConcept?: Observation['valueCodeableConcept'];
  component?: ObservationComponent[];
  note?: string;
  hasMember?: Observation['hasMember'];
  derivedFrom?: Observation['derivedFrom'];
}): Observation | undefined {
  if (!valueQuantity && !valueCodeableConcept && !component && !note) return undefined;

  const observation: Observation = {
    resourceType: 'Observation',
    status: 'final',
    subject: patient,
    effectiveDateTime,
    code,
    category: category ? [category] : undefined,
    component,
    note: note ? [{ text: note, time: effectiveDateTime }] : undefined,
    hasMember,
    derivedFrom,
  };

  if (valueQuantity) {
    observation.valueQuantity = valueQuantity;
  } else if (valueCodeableConcept) {
    observation.valueCodeableConcept = valueCodeableConcept;
  }

  return observation;
}
