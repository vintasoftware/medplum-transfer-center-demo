import { BundleEntry, Patient } from '@medplum/fhirtypes';
import { validate as uuidValidate } from 'uuid';
import { createBundleEntry } from './createBundleEntry';

describe('createBundleEntry', () => {
  const resource: Patient = { resourceType: 'Patient' };

  it('returns a valid BundleEntry object', () => {
    const entry = createBundleEntry(resource);

    expect(entry).toBeDefined();
    expect(entry.resource).toEqual(resource);
    expect(entry.fullUrl).toMatch(/^urn:uuid:/);
    expect(entry.request).toBeDefined();
    expect(entry.request).toEqual({
      url: 'Patient',
      method: 'POST',
    });
  });

  it('generates a valid UUID for fullUrl', () => {
    const entry = createBundleEntry(resource);
    const uuid = entry.fullUrl?.replace('urn:uuid:', '');

    expect(entry).toBeDefined();
    expect(uuidValidate(uuid)).toEqual(true);
  });

  it('sets default request values', () => {
    const entry = createBundleEntry(resource);

    expect(entry).toBeDefined();
    expect(entry.request).toEqual({
      url: 'Patient',
      method: 'POST',
    });
  });

  it('merges requestOptions into request object', () => {
    const requestOptions: BundleEntry['request'] = { method: 'PUT', url: 'Patient?name=Marge' };
    const entry = createBundleEntry(resource, { requestOptions });

    expect(entry).toBeDefined();
    expect(entry.request).toEqual({
      url: 'Patient?name=Marge',
      method: 'PUT',
    });
  });
});
