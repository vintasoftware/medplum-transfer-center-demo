import { evalFhirPath } from '@medplum/core';
import { Resource } from '@medplum/fhirtypes';
import { ResourcePropertyDisplay } from '@medplum/react';

export interface FhirPathDisplayRenderProps<T = unknown> {
  readonly resource: Resource;
  readonly value: T;
}

export interface FhirPathDisplayProps<T = unknown> {
  readonly resource: Resource;
  readonly path: string;
  readonly propertyType: string;
  readonly render?: (props: FhirPathDisplayRenderProps<T>) => JSX.Element;
}

export function FhirPathDisplay<T = unknown>(props: FhirPathDisplayProps<T>): JSX.Element | null {
  let value;

  try {
    value = evalFhirPath(props.path, props.resource);
  } catch (err) {
    console.warn('FhirPathDisplay:', err);
    return null;
  }

  if (value.length > 1) {
    throw new Error(
      `Component "path" for "FhirPathDisplay" must resolve to a single element. \
       Received ${value.length} elements \
       [${JSON.stringify(value, null, 2)}]`
    );
  }
  if (props.render) {
    return props.render({ resource: props.resource, value: value[0] as T });
  }
  return <ResourcePropertyDisplay value={value[0] || ''} propertyType={props.propertyType} />;
}
