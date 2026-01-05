import { Button } from '@mantine/core';
import { Questionnaire } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ViewQuestionnaireButtonProps = {
  value: string;
};

export function ViewQuestionnaireButton(props: ViewQuestionnaireButtonProps): JSX.Element {
  const { value } = props;
  const navigate = useNavigate();
  const medplum = useMedplum();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>();

  useEffect(() => {
    medplum
      .searchOne('Questionnaire', `context=${value}`)
      .then((questionnaire) => {
        setQuestionnaire(questionnaire);
      })
      .catch(console.error);
  }, [medplum, value]);

  return (
    <Button onClick={() => navigate(`/Practitioner/${value}/questionnaire`)}>
      {questionnaire ? 'View' : 'Create New'} Questionnaire
    </Button>
  );
}
