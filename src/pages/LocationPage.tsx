import { FhirPathTable, FhirPathTableField } from '@/components/FhirPathTable/FhirPathTable';
import { SAMPLE_MED_LOCATION_NAME } from '@/constants';
import { Alert, Button, Container, Group, Loader, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { normalizeErrorString, PropertyType } from '@medplum/core';
import { Location } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function LocationsPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams();
  // This is used to force a refresh of the FhirPathTable component
  const [refresh, setRefresh] = useState(false);
  const medplum = useMedplum();
  const [rootLocation, setRootLocation] = useState<Location>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) {
      medplum
        .searchOne('Location', { name: SAMPLE_MED_LOCATION_NAME })
        .then((location) => {
          if (!location) {
            throw new Error(`Location "${SAMPLE_MED_LOCATION_NAME}" not found`);
          }
          setRootLocation(location);
        })
        .catch((err) => {
          setError(normalizeErrorString(err));
        });
    }
  }, [id, medplum]);

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
    if (!rootLocation?.id) return '';

    return `{
      ResourceList: LocationList(partof: "Location/${rootLocation.id}", physical_type: "lvl", _sort: "name", _count: 40) {
        id
        name
        telecom(system: "phone") {
          system,
          value
        }
      }
    }`;
  }, [id, rootLocation]);

  function handleNewClick() {
    navigate(id ? `/Location/${id}/new` : '/Location/new');
  }

  if (error) {
    return (
      <Container fluid>
        <Alert color="red" title="Error loading location">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!id && !rootLocation) {
    return (
      <Container fluid>
        <Loader />
      </Container>
    );
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
