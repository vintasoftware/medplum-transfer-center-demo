import { LOINC, SNOMED } from '@medplum/core';
import { CodeableConcept } from '@medplum/fhirtypes';

// SampleMed FHIR URIs
export const SAMPLE_MED_REQUISITION_SYSTEM = 'https://samplemed.com/fhir/requisition-id';

// SampleMed resource names (use these with utility functions for cloud compatibility)
export const SAMPLE_MED_ORG_NAME = 'SampleMed';
export const SAMPLE_MED_LOCATION_NAME = 'SampleMed';

// Questionnaire names (use these with getQuestionnaireByName() for cloud compatibility)
export const ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME = 'accepting-physician-intake-questionnaire';
export const CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME = 'create-location-lvl-questionnaire';
export const CREATE_LOCATION_ROOM_QUESTIONNAIRE_NAME = 'create-location-ro-questionnaire';
export const PATIENT_INTAKE_QUESTIONNAIRE_NAME = 'patient-intake-questionnaire';
export const PHYSICIAN_ONBOARDING_QUESTIONNAIRE_NAME = 'physician-onboarding-questionnaire';
export const QUESTIONNAIRE_ASSIGNMENT_QUESTIONNAIRE_NAME = 'questionnaire-assignment-questionnaire';
export const PATIENT_BED_ASSIGNMENT_QUESTIONNAIRE_NAME = 'patient-bed-assignment-questionnaire';

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
