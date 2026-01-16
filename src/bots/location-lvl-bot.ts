import { MedplumClient, BotEvent, getQuestionnaireAnswers, createReference } from '@medplum/core';
import { Location, Organization, Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes';
import {
  CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME,
  SAMPLE_MED_LOCATION_NAME,
  SAMPLE_MED_ORG_NAME,
} from '@/constants';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<void> {
  const { input } = event;

  if (input.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  // Validate questionnaire by fetching it and checking the name
  const questionnaireRef = input.questionnaire;
  if (!questionnaireRef) {
    throw new Error('Missing questionnaire reference');
  }

  const questionnaire = await medplum.readReference<Questionnaire>({ reference: questionnaireRef });
  if (questionnaire.name !== CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME) {
    throw new Error('Invalid questionnaire');
  }

  const answers = getQuestionnaireAnswers(input);

  const name = answers['name']?.valueString;
  if (!name) {
    throw new Error('Missing name');
  }

  const telecomPhone = answers['telecomPhone']?.valueString;

  // Fetch organization and parent location by name
  const [organization, parentLocation] = await Promise.all([
    medplum.searchOne('Organization', { name: SAMPLE_MED_ORG_NAME }),
    medplum.searchOne('Location', { name: SAMPLE_MED_LOCATION_NAME }),
  ]);

  if (!organization) {
    throw new Error(`Organization "${SAMPLE_MED_ORG_NAME}" not found`);
  }

  if (!parentLocation) {
    throw new Error(`Location "${SAMPLE_MED_LOCATION_NAME}" not found`);
  }

  const location: Location = {
    resourceType: 'Location',
    managingOrganization: createReference(organization as Organization),
    partOf: createReference(parentLocation as Location),
    status: 'active',
    physicalType: {
      coding: [
        { system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'lvl', display: 'Level' },
      ],
    },
    mode: 'instance',
    name,
    telecom: telecomPhone ? [{ system: 'phone', value: telecomPhone }] : undefined,
  };
  await medplum.createResource(location);
}
