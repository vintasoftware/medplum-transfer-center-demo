import { createReference } from '@medplum/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import {
  CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME,
  SAMPLE_MED_LOCATION_NAME,
  SAMPLE_MED_ORG_NAME,
} from '@/constants';
import { handler } from './location-lvl-bot';

describe('Location Lvl Bot', async () => {
  let medplum: MockClient;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';
  let questionnaireId: string;
  let organizationId: string;
  let rootLocationId: string;

  beforeEach(async () => {
    medplum = new MockClient();

    // Create the organization in the mock client
    const organization = await medplum.createResource({
      resourceType: 'Organization',
      name: SAMPLE_MED_ORG_NAME,
      active: true,
    });
    organizationId = organization.id as string;

    // Create the root location in the mock client
    const rootLocation = await medplum.createResource({
      resourceType: 'Location',
      name: SAMPLE_MED_LOCATION_NAME,
      status: 'active',
      mode: 'instance',
    });
    rootLocationId = rootLocation.id as string;

    // Create the questionnaire in the mock client
    const questionnaire = await medplum.createResource({
      resourceType: 'Questionnaire',
      name: CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME,
      status: 'active',
    });
    questionnaireId = questionnaire.id as string;
  });

  it('successfully creates a level location', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${questionnaireId}`,
      item: [
        {
          id: 'id-1',
          linkId: 'name',
          text: 'Name',
          answer: [
            {
              valueString: 'Level 1',
            },
          ],
        },
        {
          id: 'id-2',
          linkId: 'telecomPhone',
          text: 'Phone',
          answer: [
            {
              valueString: '555-555-5555',
            },
          ],
        },
      ],
    };

    await handler(medplum, { bot, input, contentType, secrets: {} });

    const location = await medplum.searchOne('Location', 'name=Level 1');

    expect(location).toBeDefined();
    expect(location).toMatchObject({
      resourceType: 'Location',
      partOf: createReference({ resourceType: 'Location', id: rootLocationId }),
      managingOrganization: createReference({ resourceType: 'Organization', id: organizationId }),
      status: 'active',
      physicalType: {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'lvl', display: 'Level' },
        ],
      },
      mode: 'instance',
      name: 'Level 1',
      telecom: [{ system: 'phone', value: '555-555-5555' }],
    });
  });

  it('throws error on missing name', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${questionnaireId}`,
      item: [
        {
          id: 'id-2',
          linkId: 'telecomPhone',
          text: 'Phone',
          answer: [
            {
              valueString: '555-555-5555',
            },
          ],
        },
      ],
    };

    await expect(handler(medplum, { bot, input, contentType, secrets: {} })).rejects.toThrow('Missing name');
  });
});
