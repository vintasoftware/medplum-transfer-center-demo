import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { ViewQuestionnaireButton } from '@/components/ViewQuestionnaireButton/ViewQuestionnaireButton';
import { SAMPLE_MED_ORG_NAME } from '@/constants';
import { Alert, Button, Container, Loader, Title } from '@mantine/core';
import { normalizeErrorString, PropertyType } from '@medplum/core';
import { Organization } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export function PhysiciansPage(): JSX.Element {
  const navigate = useNavigate();
  const medplum = useMedplum();
  const [organization, setOrganization] = useState<Organization>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    medplum
      .searchOne('Organization', { name: SAMPLE_MED_ORG_NAME })
      .then((org) => {
        if (!org) {
          throw new Error(`Organization "${SAMPLE_MED_ORG_NAME}" not found`);
        }
        setOrganization(org);
      })
      .catch((err) => {
        setError(normalizeErrorString(err));
      });
  }, [medplum]);

  const query = useMemo(() => {
    if (!organization?.id) return '';
    return `{
  ResourceList: PractitionerList(_filter: "_has:PractitionerRole:practitioner:organization re 'Organization/${organization.id}'") {
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
  }, [organization]);
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

  if (error) {
    return (
      <Container fluid>
        <Alert color="red" title="Error loading organization">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!organization) {
    return (
      <Container fluid>
        <Loader />
      </Container>
    );
  }

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
