import { createReference } from '@medplum/core';
import { Location, QuestionnaireResponse } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import {
  CREATE_LOCATION_ROOM_QUESTIONNAIRE_NAME,
  SAMPLE_MED_LOCATION_NAME,
  SAMPLE_MED_ORG_NAME,
} from '@/constants';
import { handler } from './location-room-bot';

describe('Location Room Bot', async () => {
  let medplum: MockClient;
  let lvlLocation: Location;
  let questionnaireId: string;
  let organizationId: string;
  let rootLocationId: string;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';

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
      name: CREATE_LOCATION_ROOM_QUESTIONNAIRE_NAME,
      status: 'active',
    });
    questionnaireId = questionnaire.id as string;

    lvlLocation = await medplum.createResource({
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
      name: 'PCU',
      telecom: [{ system: 'phone', value: '555-555-5555' }],
    });
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
      questionnaire: `Questionnaire/${questionnaireId}`,
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
