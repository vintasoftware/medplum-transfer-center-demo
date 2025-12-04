import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { Button, Container, Title } from '@mantine/core';
import { PropertyType } from '@medplum/core';
import { Location, Reference } from '@medplum/fhirtypes';
import { ReferenceDisplay, ResourcePropertyDisplay, useMedplumNavigate } from '@medplum/react';
import { useMemo } from 'react';

const serviceReqQuery = `{
  ResourceList: ServiceRequestList(code: "http://snomed.info/sct|19712007", authored: "gt1970-01-01", _sort: "-authored", _count: 13) {
    id,
    authoredOn,
    subject {
      display,
      reference
    },
    requester {
      display,
      reference,
      resource {
        ... on Practitioner {
          PractitionerRoleList(_reference: practitioner) {
            organization {
              display,
              reference
            }
          }
        }
      }
    }
    performer {
      display
    }
    CommunicationRequestList(_reference: based_on) {
      id,
      CommunicationList(_reference: based_on) {
        statusReason {
          text
        }
      }
    }
    EncounterList(_reference: based_on) {
      location {
        location {
          reference,
          display,
        }
      }
    }
  }
}`;

export function TransferPage(): JSX.Element {
  const navigate = useMedplumNavigate();

  const fields: FhirPathTableField[] = useMemo(
    () => [
      {
        name: 'Patient Name',
        fhirPath: 'subject.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Transferring Facility',
        fhirPath: 'requester.resource.PractitionerRoleList[0].organization.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Transferring Physician',
        fhirPath: 'requester.display',
        propertyType: PropertyType.string,
      },
      {
        name: 'Primary Accepting Physician',
        fhirPath: 'performer.display',
        propertyType: PropertyType.string,
        render: ({ resource, value }) =>
          value ? (
            <ResourcePropertyDisplay value={value} propertyType={PropertyType.string} />
          ) : (
            <Button onClick={() => navigate(`/ServiceRequest/${resource.id}/accepting-physician`)}>Complete</Button>
          ),
      },
      {
        name: 'Location',
        fhirPath: 'EncounterList[0].location[0].location',
        propertyType: PropertyType.Reference,
        render: ({ value }) => <ReferenceDisplay value={value as Reference<Location>} link />,
      },
      {
        name: '',
        fhirPath: 'id',
        propertyType: PropertyType.id,
        render: ({ value }) => <Button onClick={() => navigate(`/ServiceRequest/${value}`)}>View</Button>,
      },
    ],
    [navigate]
  );

  return (
    <Container fluid>
      <Title>Transfers</Title>
      <Button my={15} onClick={() => navigate('/transfers/new')}>
        New
      </Button>
      <FhirPathTable resourceType="ServiceRequest" query={serviceReqQuery} fields={fields} />
    </Container>
  );
}
