import { Container, Loader } from '@mantine/core';
import { createReference } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CREATE_LOCATION_ROOM_QUESTIONNAIRE_NAME, CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME } from '@/constants';
import { getQuestionnaireByName } from '@/utils';

export function CreateLocationPage(): JSX.Element {
  const navigate = useMedplumNavigate();
  const { id } = useParams();
  const medplum = useMedplum();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    const questionnaireName = id
      ? CREATE_LOCATION_ROOM_QUESTIONNAIRE_NAME
      : CREATE_LOCATION_LVL_QUESTIONNAIRE_NAME;

    getQuestionnaireByName(medplum, questionnaireName)
      .then(setQuestionnaire)
      .catch((err) => {
        console.error('Failed to load questionnaire:', err);
      });
  }, [id, medplum]);

  const handleSubmit = useCallback(
    (response: QuestionnaireResponse) => {
      const responseCopy = { ...response };
      if (id) {
        (responseCopy.item as QuestionnaireResponseItem[]).push({
          linkId: 'partOf',
          text: 'Part Of',
          answer: [{ valueReference: createReference({ resourceType: 'Location', id }) }],
        });
      }
      medplum
        .createResource(responseCopy)
        .then(() => {
          medplum.invalidateSearches('Location');
          navigate(id ? `/Location/${id}/rooms` : '/Location');
        })
        .catch(console.error);
    },
    [id, medplum, navigate]
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
      <QuestionnaireForm
        subject={id ? { reference: `Location/${id}` } : undefined}
        questionnaire={questionnaire}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
