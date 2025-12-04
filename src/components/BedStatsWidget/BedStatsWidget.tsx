import BedStatsGrid from '@/components/BedStatsGrid';
import { PAPER_PROPS } from '@/lib/common';
import { Loader } from '@mantine/core';
import { Bundle, Location } from '@medplum/fhirtypes';
import { useMedplum, useSubscription } from '@medplum/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const parentOrgId = 'ba836894-122f-42d0-874b-83ea9557e4f3';

// We pulled this out because it prevents the object from being recreated on every re-render
// It also makes us hit the fast path for `deepEquals` of object reference equality within the useSubscription hook
const useSubOpts = {
  subscriptionProps: {
    extension: [
      {
        url: 'https://medplum.com/fhir/StructureDefinition/subscription-supported-interaction',
        valueCode: 'update',
      },
    ],
  },
};

export function BedStatsWidget(): JSX.Element {
  const medplum = useMedplum();

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [locationsError, setLocationsError] = useState<string>();

  const fetchLocations = useCallback(
    async (shouldSetLoading = false): Promise<void> => {
      try {
        if (shouldSetLoading) {
          setLoadingLocations(true);
        }
        const result = await medplum.graphql(
          `
      {
        Location(id: "${parentOrgId}") {
          id
          name
          LocationList(_reference: partof, physical_type: "lvl") {
            id
            name
            telecom(system: "phone") {
              system,
              value
            }
            occupiedLocations: LocationList(_reference: partof, physical_type: "ro", operational_status: "O", _count: 40) {
              id,
              name,
              description,
              operationalStatus {
                code,
                display
              }
            }
            unoccupiedLocations: LocationList(_reference: partof, physical_type: "ro", operational_status: "U", _count: 40) {
              id,
              name,
              description,
              operationalStatus {
                code,
                display
              }
            }
          }
        }
      }
    `,
          undefined,
          undefined,
          { cache: 'reload' }
        );

        const locations = [] as Location[];
        for (const level of result.data.Location.LocationList) {
          locations.push({ ...level });
        }
        setLocations(locations);
      } catch {
        setLocationsError('Failed to fetch locations');
      } finally {
        setLoadingLocations(false);
      }
    },
    [medplum]
  );

  useEffect(() => {
    fetchLocations(true).catch(console.error);
  }, [fetchLocations]);

  const locationDetails = useMemo<Record<string, Location[]>>(() => {
    const details = {} as Record<string, Location[]>;
    for (const location of locations as (Location & {
      occupiedLocations: Location[];
      unoccupiedLocations: Location[];
    })[]) {
      details[location.id as string] = [...location.occupiedLocations, ...location.unoccupiedLocations];
    }
    return details;
  }, [locations]);

  const locationsRefStr = useMemo(
    () => locations.map((location) => `Location/${location.id as string}`).join(','),
    [locations]
  );

  useSubscription(
    locationsRefStr ? `Location?physical-type=ro&partof=${locationsRefStr}` : undefined,
    (bundle: Bundle) => {
      const updatedLoc = bundle.entry?.[1]?.resource as Location;
      if (!updatedLoc) {
        return;
      }
      fetchLocations().catch(console.error);
    },
    useSubOpts
  );

  if (loadingLocations) {
    return <Loader />;
  }

  if (locationsError) {
    return <div>Error: {locationsError}</div>;
  }

  // TODO: fix
  const error = false;

  return <BedStatsGrid data={locations} locationDetails={locationDetails} error={error} paperProps={PAPER_PROPS} />;
}
