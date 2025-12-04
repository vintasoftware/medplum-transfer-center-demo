import { createReference } from '@medplum/core';
import { Location, QuestionnaireResponse } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID, SAMPLE_MED_LOCATION_ID, SAMPLE_MED_ORG_ID } from '@/constants';
import { handler } from './location-room-bot';

describe('Location Room Bot', async () => {
  let medplum: MockClient;
  let lvlLocation: Location;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';

  beforeEach(async () => {
    medplum = new MockClient();
    lvlLocation = await medplum.createResource({
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
      name: 'PCU',
      telecom: [{ system: 'phone', value: '555-555-5555' }],
    });
  });

  it('successfully creates a level location', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID}`,
      item: [
        {
          id: 'id-1',
          linkId: 'name',
          text: 'Name',
          answer: [
            {
              valueString: '123',
            },
          ],
        },
        {
          id: 'id-2',
          linkId: 'operationalStatus',
          text: 'Operational Status',
          answer: [
            {
              valueCoding: {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
                code: 'O',
                display: 'Occupied',
              },
            },
          ],
        },
        {
          id: 'id-3',
          linkId: 'partOf',
          text: 'Part Of',
          answer: [
            {
              valueReference: createReference(lvlLocation),
            },
          ],
        },
      ],
    };

    await handler(medplum, { bot, input, contentType, secrets: {} });

    const location = await medplum.searchOne('Location', 'name=123');

    expect(location).toBeDefined();
    expect(location).toMatchObject({
      resourceType: 'Location',
      partOf: createReference(lvlLocation),
      managingOrganization: lvlLocation.managingOrganization,
      status: 'active',
      physicalType: {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'ro', display: 'Room' },
        ],
      },
      mode: 'instance',
      name: 'PCU 123',
      alias: ['123'],
      description: 'Room 123 on PCU',
      telecom: lvlLocation.telecom,
    });
  });

  it('throws error on missing partOf', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID}`,
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
          linkId: 'operationalStatus',
          text: 'Operational Status',
          answer: [
            {
              valueCoding: {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
                code: 'O',
                display: 'Occupied',
              },
            },
          ],
        },
      ],
    };

    await expect(handler(medplum, { bot, input, contentType, secrets: {} })).rejects.toThrow('Missing partOf');
  });

  it('throws error on missing name', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID}`,
      item: [
        {
          id: 'id-2',
          linkId: 'operationalStatus',
          text: 'Operational Status',
          answer: [
            {
              valueCoding: {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
                code: 'O',
                display: 'Occupied',
              },
            },
          ],
        },
        {
          id: 'id-3',
          linkId: 'partOf',
          text: 'Part Of',
          answer: [
            {
              valueReference: createReference(lvlLocation),
            },
          ],
        },
      ],
    };

    await expect(handler(medplum, { bot, input, contentType, secrets: {} })).rejects.toThrow('Missing name');
  });

  it('throws error on missing operationalStatus', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID}`,
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
          id: 'id-3',
          linkId: 'partOf',
          text: 'Part Of',
          answer: [
            {
              valueReference: createReference(lvlLocation),
            },
          ],
        },
      ],
    };

    await expect(handler(medplum, { bot, input, contentType, secrets: {} })).rejects.toThrow(
      'Missing operationalStatus'
    );
  });
});
