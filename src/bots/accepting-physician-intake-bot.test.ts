import { createReference, getReferenceString, resolveId } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse, ServiceRequest, Task } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME } from '@/constants';
import { handler } from './accepting-physician-intake-bot';

describe('Accepting Physician Intake Bot', async () => {
  let medplum: MockClient;
  let questionnaire: Questionnaire;
  let serviceRequest: ServiceRequest;
  let task: Task;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';
  const patient = { reference: 'Patient/123' };
  const physician = { reference: 'Practitioner/456' };

  beforeEach(async () => {
    medplum = new MockClient();
    questionnaire = await medplum.createResource({
      resourceType: 'Questionnaire',
      title: 'Accepting Physician Form',
      name: ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME,
      status: 'active',
      item: [
        {
          linkId: 'acceptingSpecialty',
          type: 'choice',
          text: 'Accepting Specialty',
          answerValueSet: 'https://samplemed.com/fhir/ValueSet/accepting-specialties',
        },
        {
          linkId: 'startingLocation',
          type: 'choice',
          text: 'Starting Location',
          answerValueSet: 'https://samplemed.com/fhir/ValueSet/starting-locations',
        },
        {
          linkId: 'primaryAcceptingPhysician',
          type: 'reference',
          text: 'Primary Accepting Physician',
          extension: [
            {
              url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-referenceResource',
              valueCode: 'Practitioner',
            },
          ],
          required: true,
        },
      ],
    });
    serviceRequest = await medplum.createResource({
      resourceType: 'ServiceRequest',
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '19712007', display: 'Patient transfer (procedure)' }],
        text: 'Patient transfer',
      },
      status: 'active',
      intent: 'proposal',
      subject: patient,
    });
    task = await medplum.createResource({
      resourceType: 'Task',
      status: 'ready',
      priority: 'asap',
      intent: 'plan',
      code: { coding: [{ system: 'http://hl7.org/fhir/CodeSystem/task-code', code: 'fulfill' }] },
      basedOn: [createReference(serviceRequest)],
    });
  });

  it('successfully updates resources', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: getReferenceString(questionnaire),
      subject: createReference(serviceRequest),
      item: [
        {
          linkId: 'acceptingSpecialty',
          text: 'Accepting Specialty',
          answer: [
            {
              valueCoding: {
                system: 'http://snomed.info/sct',
                code: '394579002',
                display: 'Cardiology',
              },
            },
          ],
        },
        {
          linkId: 'startingLocation',
          text: 'Starting Location',
          answer: [
            {
              valueCoding: {
                system: 'http://snomed.info/sct',
                code: '225728007',
                display: 'ED',
              },
            },
          ],
        },
        {
          linkId: 'primaryAcceptingPhysician',
          text: 'Primary Accepting Physician',
          answer: [
            {
              valueReference: physician,
            },
          ],
        },
      ],
    };

    await handler(medplum, { bot, input, contentType, secrets: {} });

    // Update the patient transfer service request
    const serviceRequestId = resolveId(serviceRequest) as string;
    const updatedServiceRequest = await medplum.readResource('ServiceRequest', serviceRequestId);
    expect(updatedServiceRequest.performer).toHaveLength(1);
    expect(updatedServiceRequest.performer?.[0]).toEqual(physician);

    // Update the phone call task
    const updatedTask = await medplum.readResource('Task', resolveId(task) as string);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.owner).toEqual(physician);
  });

  it('throws error on missing questionnaire', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
    };

    await expect(async () => {
      await handler(medplum, { bot, input, contentType, secrets: {} });
    }).rejects.toThrow('Questionnaire is required');
  });

  it('throws error on invalid questionnaire', async () => {
    const otherQuestionnaire = await medplum.createResource({
      resourceType: 'Questionnaire',
      title: 'Other Questionnaire',
      status: 'active',
    });
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: getReferenceString(otherQuestionnaire),
    };

    await expect(async () => {
      await handler(medplum, { bot, input, contentType, secrets: {} });
    }).rejects.toThrow('Invalid questionnaire');
  });

  it('throws error on missing service request', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: getReferenceString(questionnaire),
    };

    await expect(async () => {
      await handler(medplum, { bot, input, contentType, secrets: {} });
    }).rejects.toThrow('Service request is required');
  });

  it('throws error on missing primary accepting physician', async () => {
    const input: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: getReferenceString(questionnaire),
      subject: createReference(serviceRequest),
      item: [
        {
          linkId: 'acceptingSpecialty',
          text: 'Accepting Specialty',
          answer: [
            {
              valueCoding: {
                system: 'http://snomed.info/sct',
                code: '394579002',
                display: 'Cardiology',
              },
            },
          ],
        },
        {
          linkId: 'startingLocation',
          text: 'Starting Location',
          answer: [
            {
              valueCoding: {
                system: 'http://snomed.info/sct',
                code: '225728007',
                display: 'ED',
              },
            },
          ],
        },
      ],
    };

    await expect(async () => {
      await handler(medplum, { bot, input, contentType, secrets: {} });
    }).rejects.toThrow('Primary accepting physician is required');
  });
});
