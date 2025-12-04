import { getDisplayString } from '@medplum/core';
import { BundleEntry, Reference, Resource } from '@medplum/fhirtypes';

/**
 * Creates a Reference to a BundleEntry using the fullUrl as the reference.
 * @param entry The BundleEntry to reference.
 * @returns A Reference to the BundleEntry.
 */
export function createBundleEntryReference(entry: BundleEntry): Reference<Resource> {
  const displayString = entry.resource ? getDisplayString(entry.resource) : undefined;
  const display = displayString?.includes('undefined') ? undefined : displayString;
  const reference = entry.fullUrl;
  return !display || display === reference ? { reference } : { reference, display };
}
