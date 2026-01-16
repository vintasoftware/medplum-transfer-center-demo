import { MedplumClient } from '@medplum/core';
import { Organization } from '@medplum/fhirtypes';

/**
 * Fetches an organization by its name.
 * This avoids hardcoding organization IDs which change between environments.
 *
 * @param medplum - The Medplum client instance
 * @param name - The name of the organization
 * @returns The organization resource
 * @throws Error if the organization is not found
 */
export async function getOrganizationByName(
  medplum: MedplumClient,
  name: string
): Promise<Organization> {
  const organization = await medplum.searchOne('Organization', { name });

  if (!organization) {
    throw new Error(`Organization with name "${name}" not found`);
  }

  return organization;
}
