// import { ReactNode } from 'react';
import BedStatsCard from '@/components/BedStatsCard';
import ErrorAlert from '@/components/ErrorAlert';
import { PaperProps, SimpleGrid, Skeleton } from '@mantine/core';
import { Location } from '@medplum/fhirtypes';

type LocationProps = {
  data?: Location[];
  locationDetails: { [key: string]: Location[] };
  error?: boolean | null;
  paperProps?: PaperProps;
};

// export default function StatsGrid({ data, paperProps, error, loading }: StatsGridProps) {
export default function BedStatsGrid({ data, locationDetails, error, paperProps }: LocationProps) {
  // const floorLocation = data?.map((floor) => <BedStatsCard key={floor.id} data={floor} {...paperProps} />);
  const floorLocation = data?.map((floor) => (
    <BedStatsCard key={floor.id} data={floor} locationDetails={locationDetails} {...paperProps} />
  ));

  //TODO: Fix
  const loading = false;

  return (
    <>
      {error ? (
        <ErrorAlert title="Error loading stats" message={error.toString()} />
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`stats-loading-${i}`} visible={true} height={200} />
              ))
            : floorLocation}
        </SimpleGrid>
      )}
    </>
  );
}
