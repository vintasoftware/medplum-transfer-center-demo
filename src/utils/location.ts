import { MedplumClient } from '@medplum/core';
import { Location } from '@medplum/fhirtypes';

/**
 * Fetches a location by its name.
 * This avoids hardcoding location IDs which change between environments.
 *
 * @param medplum - The Medplum client instance
 * @param name - The name of the location
 * @returns The location resource
 * @throws Error if the location is not found
 */
export async function getLocationByName(medplum: MedplumClient, name: string): Promise<Location> {
  const location = await medplum.searchOne('Location', { name });

  if (!location) {
    throw new Error(`Location with name "${name}" not found`);
  }

  return location;
}
