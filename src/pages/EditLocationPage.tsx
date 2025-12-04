import { Container } from '@mantine/core';
import { resolveId } from '@medplum/core';
import { Resource } from '@medplum/fhirtypes';
import { ResourceForm, useMedplum } from '@medplum/react';
import { useNavigate, useParams } from 'react-router-dom';

export function EditLocationPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const medplum = useMedplum();

  const location = medplum.readResource('Location', id as string).read();
  const physicalType = location?.physicalType?.coding?.[0]?.code;
  const partOfId = resolveId(location?.partOf);

  function handleSubmit(resource: Resource): void {
    medplum
      .updateResource(resource)
      .then(() => {
        medplum.invalidateSearches('Location');
        navigate(physicalType === 'ro' && partOfId ? `/Location/${partOfId}/rooms` : '/Location');
      })
      .catch(console.error);
  }

  return (
    <Container fluid>
      <ResourceForm defaultValue={{ reference: `Location/${id}` }} onSubmit={handleSubmit} />
    </Container>
  );
}
