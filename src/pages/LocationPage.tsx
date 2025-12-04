import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Group, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { PropertyType } from '@medplum/core';
import { useMedplum } from '@medplum/react';
import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { SAMPLE_MED_LOCATION_ID } from '@/constants';

export function LocationsPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  // This is used to force a refresh of the FhirPathTable component
  const [refresh, setRefresh] = useState(false);
  const medplum = useMedplum();

  const openDeleteConfirmationModal = useCallback(
    (locationId: string): void => {
      modals.openConfirmModal({
        title: 'Confirm Deletion',
        children: (
          <Text size="sm">
            Are you sure you want to delete this location? This action cannot be undone. Please confirm to proceed or
            cancel to abort.
          </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        confirmProps: { variant: 'light', color: 'red' },
        onConfirm: async () => {
          await medplum.deleteResource('Location', locationId);
          medplum.invalidateSearches('Location');
          setRefresh((count) => !count);
        },
      });
    },
    [medplum]
  );

  const location = id ? medplum.readResource('Location', id).read() : undefined;

  const pageTitle = id && location ? `${location.name}'s Rooms` : 'Locations';

  const fields = useMemo<FhirPathTableField[]>(() => {
    if (id) {
      return [
        {
          name: 'Name',
          fhirPath: 'name',
          propertyType: PropertyType.string,
        },
        {
          name: 'Description',
          fhirPath: 'description',
          propertyType: PropertyType.string,
        },
        {
          name: 'Operational Status',
          fhirPath: 'operationalStatus',
          propertyType: PropertyType.Coding,
        },
        {
          name: '',
          fhirPath: 'id',
          propertyType: PropertyType.id,
          render: ({ value }) => (
            <Group>
              <Button onClick={() => navigate(`/Location/${value}/edit`)}>Edit</Button>
              <Button variant="light" color="red" onClick={() => openDeleteConfirmationModal(value as string)}>
                Delete
              </Button>
            </Group>
          ),
        },
      ];
    }
    return [
      {
        name: 'Name',
        fhirPath: 'name',
        propertyType: PropertyType.string,
      },
      {
        name: 'Telecom',
        fhirPath: 'telecom[0]',
        propertyType: PropertyType.ContactPoint,
      },
      {
        name: '',
        fhirPath: 'id',
        propertyType: PropertyType.id,
        render: ({ value }) => <Button onClick={() => navigate(`/Location/${value}/rooms`)}>View Rooms</Button>,
      },
    ];
  }, [id, navigate, openDeleteConfirmationModal]);

  const query = useMemo(() => {
    if (id) {
      return `{
        ResourceList: LocationList(partof: "Location/${id}", physical_type: "ro", _sort: "name", _count: 40) {
          id
          name
          description
          operationalStatus {
            code
            display
          }
        }
      }`;
    }
    return `{
      ResourceList: LocationList(partof: "Location/${SAMPLE_MED_LOCATION_ID}", physical_type: "lvl", _sort: "name", _count: 40) {
        id
        name
        telecom(system: "phone") {
          system,
          value
        }
      }
    }`;
  }, [id]);

  function handleNewClick() {
    navigate(id ? `/Location/${id}/new` : '/Location/new');
  }

  return (
    <Container fluid>
      <Title>{pageTitle}</Title>
      <Button my={15} onClick={handleNewClick}>
        New
      </Button>
      <FhirPathTable
        key={refresh.toString()}
        searchType="graphql"
        resourceType="Location"
        query={query}
        fields={fields}
      />
    </Container>
  );
}
