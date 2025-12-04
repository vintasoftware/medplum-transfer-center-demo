import { BotEvent, MedplumClient, createReference, getQuestionnaireAnswers, resolveId } from '@medplum/core';
import {
  Coding,
  Location,
  Patient,
  QuestionnaireResponse,
  QuestionnaireResponseItemAnswer,
  Reference,
  ServiceRequest,
} from '@medplum/fhirtypes';

type ParsedResults = {
  serviceRequest: ServiceRequest;
  assignedRoom: Reference<Location>;
  callDisposition: Coding;
};
type ValidLinkId = 'assignedRoom' | 'callDisposition';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<void> {
  const results = {} as ParsedResults;

  if (event.input?.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  if (!event.input.subject) {
    throw new Error('A linked Patient in subject is required');
  }
  results.serviceRequest = (await medplum.readReference(event.input.subject)) as ServiceRequest;

  const answers = getQuestionnaireAnswers(event.input);

  const parseAnswer = async (linkId: ValidLinkId, answer: QuestionnaireResponseItemAnswer): Promise<void> => {
    switch (linkId) {
      case 'callDisposition': {
        const callDisposition = answer.valueCoding;
        if (!callDisposition) {
          throw new Error('Missing callDisposition');
        }
        results.callDisposition = callDisposition;
        return;
      }
      case 'assignedRoom': {
        const assignedRoom = answer.valueReference as Reference<Location>;
        if (!assignedRoom) {
          throw new Error('Missing assignedRoom');
        }
        results.assignedRoom = assignedRoom;
        return;
      }
      default:
      // Ignore linkIds we don't recognize
    }
  };

  for (const [linkId, answer] of Object.entries(answers)) {
    await parseAnswer(linkId as ValidLinkId, answer);
  }

  if (results.callDisposition.code === 'COMPLETE' && !results.assignedRoom) {
    throw new Error('Missing required assignedRoom when callDisposition is COMPLETE');
  }

  const commReq = await medplum.searchOne(
    'CommunicationRequest',
    `based-on=ServiceRequest/${results.serviceRequest.id as string}`
  );
  if (!commReq) {
    throw new Error('Could not find CommunicationRequest that corresponds to the given ServiceRequest');
  }

  // Create a Communication to capture the result of the call
  await medplum.createResource({
    resourceType: 'Communication',
    status: 'completed',
    statusReason: { coding: [results.callDisposition], text: results.callDisposition.display },
    subject: results.serviceRequest.subject as Reference<Patient>,
    basedOn: [createReference(commReq)],
    meta: {
      tag: [results.callDisposition],
    },
  });

  // Create an encounter to track the Patient's location
  await medplum.createResource({
    resourceType: 'Encounter',
    status: 'arrived',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
    subject: results.serviceRequest.subject as Reference<Patient>,
    location: [
      {
        location: results.assignedRoom,
        status: 'active',
      },
    ],
    basedOn: [createReference(results.serviceRequest)],
  });

  // Mark room as occupied
  await medplum.patchResource('Location', resolveId(results.assignedRoom) as string, [
    {
      op: 'replace',
      path: '/operationalStatus',
      value: { system: 'http://terminology.hl7.org/CodeSystem/v2-0116', code: 'O', display: 'Occupied' },
    },
  ]);
}
