import { Container, Loader } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { QuestionnaireResponseViewer } from '@/components/QuestionnaireResponseViewer';

export function QuestionnaireResponsePage(): JSX.Element {
  const { id } = useParams();

  if (!id) {
    return <Loader />;
  }

  return (
    <Container fluid>
      <QuestionnaireResponseViewer response={{ reference: `QuestionnaireResponse/${id}` }} />
    </Container>
  );
}
