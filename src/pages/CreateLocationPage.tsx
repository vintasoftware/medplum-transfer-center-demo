import { Container } from '@mantine/core';
import { createReference } from '@medplum/core';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, Reference } from '@medplum/fhirtypes';
import { QuestionnaireForm, useMedplum, useMedplumNavigate } from '@medplum/react';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID, CREATE_LOCATION_LVL_QUESTIONNAIRE_ID } from '@/constants';

export function CreateLocationPage(): JSX.Element {
  const navigate = useMedplumNavigate();
  const { id } = useParams();
  const medplum = useMedplum();

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

  const questionnaire: Reference<Questionnaire> = useMemo(
    () => ({
      reference: id
        ? `Questionnaire/${CREATE_LOCATION_ROOM_QUESTIONNAIRE_ID}`
        : `Questionnaire/${CREATE_LOCATION_LVL_QUESTIONNAIRE_ID}`,
    }),
    [id]
  );

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
