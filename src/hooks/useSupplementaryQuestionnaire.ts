import { resolveId } from '@medplum/core';
import { Practitioner, Questionnaire, Reference, ServiceRequest } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useCallback } from 'react';
import { ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME } from '@/constants';

/**
 * Custom hook for handling supplementary questionnaires.
 *
 * @param serviceRequest - The ServiceRequest object.
 * @param type - The type of questionnaire to fetch.
 */
export function useSupplementaryQuestionnaire(
  serviceRequest: ServiceRequest,
  type: 'acceptingPhysician' | 'physician'
): {
  fetchQuestionnaire: () => Promise<Questionnaire | undefined>;
  isAcceptingResponse: () => Promise<boolean>;
  getDisplay: () => string | undefined;
} {
  const medplum = useMedplum();

  /**
   * Get the display name of the questionnaire.
   *
   * @returns The display name of the questionnaire or undefined.
   */
  const getDisplay = useCallback((): string | undefined => {
    if (type === 'physician' && serviceRequest.performer?.length) {
      return 'Physician Supplementary Intake Questionnaire';
    } else if (type === 'acceptingPhysician') {
      return 'Accepting Physician Supplementary Intake Questionnaire';
    }
    return undefined;
  }, [serviceRequest, type]);

  /**
   * Fetch the questionnaire based on the type and service request.
   *
   * @returns The fetched questionnaire or undefined.
   */
  const fetchQuestionnaire = useCallback(async (): Promise<Questionnaire | undefined> => {
    try {
      let query: string | undefined;
      if (type === 'physician' && serviceRequest.performer?.length) {
        query = `context=${resolveId(serviceRequest.performer[0] as Reference<Practitioner>)}`;
      } else if (type === 'acceptingPhysician') {
        query = `name=${ACCEPTING_PHYSICIAN_INTAKE_QUESTIONNAIRE_NAME}`;
      }
      // Return undefined, otherwise the searchOne will retrieve a questionnaire
      if (!query) {
        return undefined;
      }

      const fetchedQuestionnaire = await medplum.searchOne('Questionnaire', query);
      return fetchedQuestionnaire;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }, [medplum, serviceRequest, type]);

  /**
   * Check if the questionnaire is accepting responses.
   *
   * @returns True if the questionnaire is accepting a response, otherwise false.
   */
  const isAcceptingResponse = useCallback(async () => {
    const questionnaire = await fetchQuestionnaire();

    if (!serviceRequest || !questionnaire) {
      return false;
    }

    if (questionnaire) {
      return !serviceRequest?.supportingInfo?.some((info) => info?.display === getDisplay());
    }

    return false;
  }, [fetchQuestionnaire, getDisplay, serviceRequest]);

  return { fetchQuestionnaire, isAcceptingResponse, getDisplay };
}
