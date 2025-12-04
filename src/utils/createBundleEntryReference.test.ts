import { BundleEntry, Patient } from '@medplum/fhirtypes';
import { v4 as uuidv4 } from 'uuid';
import { createBundleEntryReference } from './createBundleEntryReference';
import { getDisplayString } from '@medplum/core';

describe('createBundleEntry', () => {
  it('returns a valid Reference object', () => {
    const bundleEntry: BundleEntry = {
      fullUrl: `urn:uuid:${uuidv4()}`,
      request: {
        url: 'Patient',
        method: 'POST',
      },
      resource: { resourceType: 'Patient', name: [{ family: 'Doe', given: ['John'] }] },
    };
    const reference = createBundleEntryReference(bundleEntry);

    expect(reference).toBeDefined();
    expect(reference).toEqual({
      display: getDisplayString(bundleEntry.resource as Patient),
      reference: bundleEntry.fullUrl,
    });
  });
});
