import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { ViewQuestionnaireButton } from '@/components/ViewQuestionnaireButton/ViewQuestionnaireButton';
import { Button, Container, Title } from '@mantine/core';
import { PropertyType } from '@medplum/core';
import { useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SAMPLE_MED_ORG_ID } from '@/constants';

const query = `{
  ResourceList: PractitionerList(_filter: "_has:PractitionerRole:practitioner:organization re 'Organization/${SAMPLE_MED_ORG_ID}'") {
    id,
    name {
      prefix,
      given,
      family,
      suffix,
      use,
    },
    PractitionerRoleList(_reference: practitioner) {
      specialty {
        coding {
          display
        }
      }
    }
  }
}`;

export function PhysiciansPage(): JSX.Element {
  const navigate = useNavigate();
  const fields = useMemo<FhirPathTableField[]>(
    () => [
      {
        name: 'Name',
        fhirPath: 'name',
        propertyType: PropertyType.HumanName,
      },
      {
        name: 'Specialty',
        fhirPath: 'PractitionerRoleList[0].specialty.coding.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Questionnaire',
        fhirPath: 'id',
        propertyType: PropertyType.id,
        render: ({ value }) => <ViewQuestionnaireButton value={value as string} />,
      },
      {
        name: '',
        fhirPath: 'id',
        propertyType: PropertyType.id,
        render: ({ value }) => <Button onClick={() => navigate(`Practitioner/${value}/edit`)}>Edit</Button>,
      },
    ],
    [navigate]
  );

  return (
    <Container fluid>
      <Title>Physicians</Title>
      <Button my={15} onClick={() => navigate('/physicians/new')}>
        New
      </Button>
      <FhirPathTable searchType="graphql" resourceType="Practitioner" query={query} fields={fields} />
      <Outlet />
    </Container>
  );
}
