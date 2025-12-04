import { Loader, Modal } from '@mantine/core';
import { createReference, getDisplayString } from '@medplum/core';
import { Practitioner, Questionnaire, Resource } from '@medplum/fhirtypes';
import { QuestionnaireBuilder, useMedplum, useResource } from '@medplum/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ViewQuestionnaireModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function ViewQuestionnaireModal(props: ViewQuestionnaireModalProps): JSX.Element {
  const { id } = useParams();
  const medplum = useMedplum();
  const navigate = useNavigate();
  const practitioner = useResource<Practitioner>({ reference: `Practitioner/${id}` });
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  const questionnaireRef = useMemo(() => (questionnaire ? createReference(questionnaire) : undefined), [questionnaire]);

  useEffect(() => {
    if (!practitioner) {
      return;
    }

    medplum
      .searchOne('Questionnaire', `context=${id}`)
      .then((questionnaire) => {
        if (!questionnaire) {
          medplum
            .createResource({
              resourceType: 'Questionnaire',
              name: `${getDisplayString(practitioner).toLowerCase().split(' ').join('-')}-intake-questionnaire`,
              title: `${getDisplayString(practitioner)} Supplementary Intake Questionnaire`,
              status: 'active',
              useContext: [
                {
                  code: {
                    system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                    code: 'user',
                    display: 'user',
                  },
                  valueCodeableConcept: {
                    coding: [
                      {
                        system: 'https://samplemed.com/fhir/CodeSystem/practitioner-id',
                        code: id,
                        display: getDisplayString(practitioner),
                      },
                    ],
                  },
                },
              ],
            })
            .then((questionnaire) => {
              setQuestionnaire(questionnaire);
            })
            .catch(console.error);
          return;
        }

        setQuestionnaire(questionnaire);
      })
      .catch(console.error);
  }, [medplum, id, practitioner]);

  function handleSubmit(resource: Resource): void {
    medplum
      .updateResource(resource)
      .then(() => navigate('/physicians'))
      .catch(console.error);
  }

  return (
    <Modal size="lg" opened={props.opened} onClose={props.onClose}>
      {questionnaire && questionnaireRef ? (
        <QuestionnaireBuilder
          questionnaire={questionnaireRef}
          key={questionnaire?.id ?? ('unknown' as string)}
          onSubmit={handleSubmit}
        />
      ) : (
        <Loader />
      )}
    </Modal>
  );
}
