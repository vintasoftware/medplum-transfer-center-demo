import { MedplumClient } from '@medplum/core';
import { Questionnaire } from '@medplum/fhirtypes';

/**
 * Fetches a questionnaire by its canonical name.
 * This avoids hardcoding questionnaire IDs which change between environments.
 *
 * @param medplum - The Medplum client instance
 * @param name - The canonical name of the questionnaire
 * @returns The questionnaire resource
 * @throws Error if the questionnaire is not found
 */
export async function getQuestionnaireByName(medplum: MedplumClient, name: string): Promise<Questionnaire> {
  const questionnaire = await medplum.searchOne('Questionnaire', { name });

  if (!questionnaire) {
    throw new Error(`Questionnaire with name "${name}" not found`);
  }

  return questionnaire;
}
