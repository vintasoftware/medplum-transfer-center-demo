import { Container } from '@mantine/core';
import { createReference } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse, ServiceRequest } from '@medplum/fhirtypes';
import { Loading, QuestionnaireForm, useMedplum, useMedplumNavigate, useResource } from '@medplum/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSupplementaryQuestionnaire } from '@/hooks/useSupplementaryQuestionnaire';

export function SupplementaryQuestionnairePage(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();
  const { id } = useParams();
  const { pathname } = useLocation();

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | undefined>(undefined);
  const [isQuestionnaireAcceptingResponse, setIsQuestionnaireAcceptingResponse] = useState<boolean | undefined>(
    undefined
  );

  const serviceRequest = useResource<ServiceRequest>({ reference: `ServiceRequest/${id}` });

  const questionnaireType = useMemo(() => {
    if (pathname.endsWith('/accepting-physician')) {
      return 'acceptingPhysician';
    } else if (pathname.endsWith('/physician-supplement')) {
      return 'physician';
    }
    return undefined;
  }, [pathname]);
  const { fetchQuestionnaire, isAcceptingResponse, getDisplay } = useSupplementaryQuestionnaire(
    serviceRequest as ServiceRequest,
    questionnaireType as 'acceptingPhysician' | 'physician'
  );

  useEffect(() => {
    if (!serviceRequest) {
      return;
    }

    async function loadQuestionnaire() {
      setQuestionnaire(await fetchQuestionnaire());
    }

    async function loadIsAcceptingResponse() {
      setIsQuestionnaireAcceptingResponse(await isAcceptingResponse());
    }

    loadQuestionnaire();
    loadIsAcceptingResponse();

    // If the questionnaire is not accepting a response, redirect to ServiceRequest page
    if (serviceRequest && isQuestionnaireAcceptingResponse === false) {
      navigate(`/ServiceRequest/${serviceRequest.id}`);
    }
  }, [fetchQuestionnaire, isAcceptingResponse, isQuestionnaireAcceptingResponse, navigate, serviceRequest]);

  const handleSubmit = useCallback(
    async (response: QuestionnaireResponse) => {
      if (!serviceRequest || !questionnaire) {
        return;
      }

      try {
        const completedResponse = await medplum.createResource({ ...response });
        const questionnaireDisplay = getDisplay();
        await medplum.patchResource('ServiceRequest', serviceRequest.id as string, [
          {
            op: 'add',
            path: '/supportingInfo/-',
            value: { ...createReference(completedResponse), display: questionnaireDisplay },
          },
        ]);
        navigate(`/ServiceRequest/${serviceRequest.id}`);
      } catch (error) {
        console.error(error);
      }
    },
    [getDisplay, medplum, navigate, questionnaire, serviceRequest]
  );

  return (
    <Container fluid>
      {serviceRequest && questionnaire ? (
        <QuestionnaireForm
          subject={createReference(serviceRequest)}
          questionnaire={questionnaire}
          onSubmit={handleSubmit}
        />
      ) : (
        <Loading />
      )}
    </Container>
  );
}
