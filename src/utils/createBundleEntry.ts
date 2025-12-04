import { Resource, BundleEntry } from '@medplum/fhirtypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a BundleEntry with a temporary UUID as the fullUrl.
 * The default HTTP action is POST.
 * @param resource The resource to create a BundleEntry for.
 * @param requestOptions Optional request options.
 * @returns A BundleEntry resource.
 */
export function createBundleEntry(
  resource: Resource,
  { requestOptions }: { requestOptions?: BundleEntry['request'] } = {}
): BundleEntry {
  return {
    // Creating internal references is done by assigning temporary IDs to each bundle entry
    fullUrl: `urn:uuid:${uuidv4()}`,
    request: {
      url: resource.resourceType,
      method: 'POST',
      ...requestOptions,
    },
    resource,
  };
}
