import { Container, Loader } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { generateId, normalizeErrorString, sleep } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, ServiceRequest } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { IconCircleOff } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { SAMPLE_MED_REQUISITION_SYSTEM, PATIENT_INTAKE_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';

const MAX_SEARCH_RETRIES = 3;

export function NewPatientPage(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    getQuestionnaireByName(medplum, PATIENT_INTAKE_QUESTIONNAIRE_NAME)
      .then(setQuestionnaire)
      .catch((err) => {
        showNotification({
          color: 'red',
          icon: <IconCircleOff />,
          title: 'Error',
          message: normalizeErrorString(err),
        });
      });
  }, [medplum]);

  const handleSubmit = useCallback(
    (response: QuestionnaireResponse) => {
      const requisitionId = generateId();
      // We copy the response so it doesn't have a chance of modifying the response in place
      const responseCopy = { ...response };
      (responseCopy.item as QuestionnaireResponseItem[]).push({
        linkId: 'requisitionId',
        text: 'Requisition ID',
        answer: [{ valueString: requisitionId }],
      });
      medplum
        .createResource(responseCopy)
        .then(async () => {
          let serviceRequest: ServiceRequest | undefined;
          let retries = 0;
          let lastErr: Error | undefined;
          let sleepTime = 1000;

          while (retries <= MAX_SEARCH_RETRIES && !serviceRequest) {
            await sleep(sleepTime);
            try {
              serviceRequest = await medplum.searchOne(
                'ServiceRequest',
                {
                  requisition: `${SAMPLE_MED_REQUISITION_SYSTEM}|${requisitionId}`,
                },
                { cache: 'no-cache' }
              );
            } catch (err) {
              console.error(err);
              lastErr = err as Error;
            }
            retries++;
            sleepTime *= 2; // Should be 1000, 2000, 4000, 8000
          }
          if (!serviceRequest) {
            showNotification({
              color: 'red',
              title: 'Error',
              message: `Unable to find referral with requisition ID '${requisitionId}'`,
              autoClose: false,
            });
            console.error(`Unable to find referral with requisition ID: ${requisitionId}`);
            console.error('Last error while retrying', lastErr);
            return;
          }
          navigate(`/ServiceRequest/${serviceRequest.id as string}`);
        })
        .catch((err) => {
          showNotification({
            color: 'red',
            icon: <IconCircleOff />,
            title: 'Error',
            message: normalizeErrorString(err),
          });
        });
    },
    [medplum, navigate]
  );

  if (!questionnaire) {
    return (
      <Container fluid>
        <Loader />
      </Container>
    );
  }

  return (
    <Container fluid>
      <QuestionnaireForm questionnaire={questionnaire} onSubmit={handleSubmit} />
    </Container>
  );
}
