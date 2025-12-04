import { UCUM } from '@medplum/core';
import { createBloodPressureObservationComponent } from './createBloodPressureObservationComponent';

describe('createBloodPressureObservationComponent', () => {
  const diastolicCode = {
    coding: [
      {
        system: 'http://loinc.org',
        code: '8462-4',
        display: 'Diastolic blood pressure',
      },
    ],
    text: 'Diastolic blood pressure',
  };
  const systolicCode = {
    coding: [
      {
        system: 'http://loinc.org',
        code: '8480-6',
        display: 'Systolic blood pressure',
      },
    ],
    text: 'Systolic blood pressure',
  };

  it('returns undefined if no diastolic or systolic values are provided', () => {
    const components = createBloodPressureObservationComponent({
      diastolic: undefined,
      systolic: undefined,
    });

    expect(components).toBeUndefined();
  });

  it('returns an ObservationComponent array with a diastolic component', () => {
    const components = createBloodPressureObservationComponent({
      diastolic: 80,
      systolic: undefined,
    });

    expect(components).toEqual([
      {
        code: diastolicCode,
        valueQuantity: {
          value: 80,
          unit: 'mmHg',
          system: UCUM,
          code: 'mm[Hg]',
        },
      },
    ]);
  });

  it('returns an ObservationComponent array with a systolic component', () => {
    const components = createBloodPressureObservationComponent({
      diastolic: undefined,
      systolic: 120,
    });

    expect(components).toEqual([
      {
        code: systolicCode,
        valueQuantity: {
          value: 120,
          unit: 'mmHg',
          system: UCUM,
          code: 'mm[Hg]',
        },
      },
    ]);
  });

  it('returns an ObservationComponent array with both diastolic and systolic components', () => {
    const components = createBloodPressureObservationComponent({
      diastolic: 80,
      systolic: 120,
    });

    expect(components).toEqual([
      {
        code: diastolicCode,
        valueQuantity: {
          value: 80,
          unit: 'mmHg',
          system: UCUM,
          code: 'mm[Hg]',
        },
      },
      {
        code: systolicCode,
        valueQuantity: {
          value: 120,
          unit: 'mmHg',
          system: UCUM,
          code: 'mm[Hg]',
        },
      },
    ]);
  });
});
