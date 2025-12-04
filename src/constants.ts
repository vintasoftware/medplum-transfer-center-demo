import { LOINC, SNOMED } from '@medplum/core';
import { CodeableConcept } from '@medplum/fhirtypes';

// SampleMed IDs
export const SAMPLE_MED_ORG_ID = '6cd37206-891f-4783-8b31-e6fed9f70ebd';
export const SAMPLE_MED_LOCATION_ID = 'ba836894-122f-42d0-874b-83ea9557e4f3';

// SampleMed FHIR URIs
export const SAMPLE_MED_REQUISITION_SYSTEM = 'https://samplemed.com/fhir/requisition-id';

// Resources identifiers
// FIXME: https://github.com/SampleMed/samplemed-regional-portal/issues/18
export const ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME = 'accepting-physician-intake-questionnaire';
export const CREATE_LOCATION_LVL_QUESTIONNAIRE_ID = 'cd78cab0-d3b4-4b33-9df2-60289ac3ca8b';
export const CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID = 'e82a8b16-27fa-4f34-a8cd-daacaac6fc81';
export const PATIENT_INTAKE_QUESTIONNAIRE_NAME = 'patient-intake-questionnaire';
export const PATIENT_INTAKE_QUESTIONNAIRE_ID = '4469a0a6-10e3-4712-b735-a32b121d45e1';
export const PHYSICIAN_ONBOARDING_QUESTIONNAIRE_ID = 'd617f4a4-2d38-478f-99dc-d27167f7d03d';
export const QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_ID = '92bad4dc-24ca-41f7-9fdb-80b5bfb57100';
export const PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_ID = '989e50a6-55a4-4e96-90f4-f9a231b29769';

// Observation
export const VITAL_SIGNS_CATEGORY: CodeableConcept = {
  coding: [
    {
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
      code: 'vital-signs',
      display: 'Vital Signs',
    },
  ],
  text: 'Vital Signs',
};

export const OBSERVATIONS_CODE_MAP: Record<
  | 'bloodPressure'
  | 'bodyHeight'
  | 'bodyTemperature'
  | 'bodyWeight'
  | 'chiefComplaint'
  | 'heartRate'
  | 'oxygenSaturation'
  | 'respiratoryRate'
  | 'timeSensitiveDiagnosis'
  | 'vitalSignsPanel',
  CodeableConcept
> = {
  bloodPressure: { coding: [{ system: LOINC, code: '85354-9', display: 'Blood Pressure' }] },
  bodyHeight: { coding: [{ system: LOINC, code: '8302-2', display: 'Body height' }] },
  bodyTemperature: { coding: [{ system: LOINC, code: '8310-5', display: 'Body temperature' }] },
  bodyWeight: { coding: [{ system: LOINC, code: '29463-7', display: 'Body weight' }] },
  chiefComplaint: {
    coding: [
      { system: LOINC, code: '46239-0', display: 'Chief complaint' },
      { system: SNOMED, code: '1269489004', display: 'Chief complaint' },
    ],
  },
  heartRate: { coding: [{ system: LOINC, code: '8867-4', display: 'Heart rate' }] },
  oxygenSaturation: {
    coding: [
      {
        system: LOINC,
        code: '2708-6',
        display: 'Oxygen saturation in Arterial blood',
      },
      {
        system: LOINC,
        code: '59408-5',
        display: 'Oxygen saturation in Arterial blood by Pulse oximetry',
      },
    ],
    text: 'Oxygen saturation',
  },
  respiratoryRate: { coding: [{ system: LOINC, code: '9279-1', display: 'Respiratory rate' }] },
  timeSensitiveDiagnosis: { coding: [{ system: LOINC, code: '78026-2', display: 'Time sensitive diagnosis' }] }, // Diagnosis present on admission
  vitalSignsPanel: { coding: [{ system: LOINC, code: '85353-1', display: 'Vital signs panel' }] },
};
