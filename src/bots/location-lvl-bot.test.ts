import { createReference } from '@medplum/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { CREATE_LOCATION_LVL_QUESTIONNAIRE_ID, SAMPLE_MED_LOCATION_ID, SAMPLE_MED_ORG_ID } from '@/constants';
import { handler } from './location-lvl-bot';

describe('Location Lvl Bot', async () => {
  let medplum: MockClient;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';

  beforeEach(async () => {
    medplum = new MockClient();
  });

  it('successfully creates a level location', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${CREATE_LOCATION_LVL_QUESTIONNAIRE_ID}`,
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
      partOf: createReference({ resourceType: 'Location', id: SAMPLE_MED_LOCATION_ID }),
      managingOrganization: createReference({ resourceType: 'Organization', id: SAMPLE_MED_ORG_ID }),
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
      questionnaire: `Questionnaire/${CREATE_LOCATION_LVL_QUESTIONNAIRE_ID}`,
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
