import { MedplumClient, BotEvent, getQuestionnaireAnswers, createReference } from '@medplum/core';
import { Location, QuestionnaireResponse } from '@medplum/fhirtypes';
import { CREATE_LOCATION_LVL_QUESTIONNAIRE_ID, SAMPLE_MED_LOCATION_ID, SAMPLE_MED_ORG_ID } from '@/constants';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<void> {
  const { input } = event;

  if (input.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  if (input.questionnaire !== `Questionnaire/${CREATE_LOCATION_LVL_QUESTIONNAIRE_ID}`) {
    throw new Error('Invalid questionnaire');
  }

  const answers = getQuestionnaireAnswers(input);

  const name = answers['name']?.valueString;
  if (!name) {
    throw new Error('Missing name');
  }

  const telecomPhone = answers['telecomPhone']?.valueString;

  const location: Location = {
    resourceType: 'Location',
    managingOrganization: createReference({ resourceType: 'Organization', id: SAMPLE_MED_ORG_ID }),
    partOf: createReference({ resourceType: 'Location', id: SAMPLE_MED_LOCATION_ID }),
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
