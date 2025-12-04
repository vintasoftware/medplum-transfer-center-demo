import { MedplumClient, BotEvent, getQuestionnaireAnswers, resolveId } from '@medplum/core';
import { QuestionnaireResponse } from '@medplum/fhirtypes';
import { ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME } from '@/constants';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<void> {
  const { input } = event;

  if (input.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  if (!input.questionnaire) {
    throw new Error('Questionnaire is required');
  }

  const questionnaire = await medplum.readResource(
    'Questionnaire',
    resolveId({ reference: input.questionnaire }) as string
  );

  if (questionnaire.name !== ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME) {
    throw new Error('Invalid questionnaire');
  }

  const serviceRequestReference = input.subject;
  if (!serviceRequestReference) {
    throw new Error('Service request is required');
  }

  const answers = getQuestionnaireAnswers(input);

  const primaryAcceptingPhysician = answers['primaryAcceptingPhysician']?.valueReference;
  if (!primaryAcceptingPhysician) {
    throw new Error('Primary accepting physician is required');
  }

  const serviceRequestId = resolveId(serviceRequestReference) as string;

  // TODO: Add secondary accepting and extension to each physician to indicate primary vs secondary
  // Add the primary accepting physician to the ServiceRequest.performer
  await medplum.patchResource('ServiceRequest', serviceRequestId, [
    {
      op: 'add',
      path: '/performer',
      value: [primaryAcceptingPhysician],
    },
  ]);

  // Add the primary accepting physician to the Task.performer
  const task = await medplum.searchOne('Task', `based-on=ServiceRequest/${serviceRequestId}`);
  if (task) {
    await medplum.patchResource('Task', resolveId(task) as string, [
      {
        op: 'add',
        path: '/owner',
        value: primaryAcceptingPhysician,
      },
    ]);
  }

  // TODO: Handle acceptingSpecialty and startingLocation fields
}
