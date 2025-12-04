import { getReferenceString, Operator, SearchRequest } from '@medplum/core';
import { ServiceRequest } from '@medplum/fhirtypes';
import { SearchControl } from '@medplum/react';
import { useNavigate } from 'react-router-dom';

interface TasksTabProps {
  serviceRequest: ServiceRequest;
}

export function TasksTab(props: TasksTabProps): JSX.Element {
  const { serviceRequest } = props;
  const navigate = useNavigate();

  const search: SearchRequest = {
    resourceType: 'Task',
    fields: ['status', 'owner', 'code'],
    filters: [
      {
        code: 'based-on',
        operator: Operator.EQUALS,
        value: getReferenceString(serviceRequest),
      },
    ],
  };

  return (
    <SearchControl
      search={search}
      hideToolbar={true}
      onClick={(e) => navigate(`/${getReferenceString(e.resource)}`)}
      onAuxClick={(e) => navigate(`/${getReferenceString(e.resource)}`)}
    />
  );
}
