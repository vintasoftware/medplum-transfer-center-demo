import ErrorAlert from '@/components/ErrorAlert';
import { StatusBadge, StatusBadgeProps } from '@/components/StatusBadge';
import { DataTable } from 'mantine-datatable';
import { ReactNode } from 'react';

export type ProjectItem = {
  id: string;
  name: string;
  date: string;
  transfer_from: string;
  state: StatusBadgeProps['status'];
  transfer_doctor: string;
};

type ProjectsTableProps = {
  data?: ProjectItem[];
  error: ReactNode;
  loading: boolean;
};

const ProjectsTable = ({ data, error, loading }: ProjectsTableProps) => {
  return error ? (
    <ErrorAlert title="Error loading projects" message={error.toString()} />
  ) : (
    <DataTable
      verticalSpacing="sm"
      highlightOnHover
      columns={[
        { accessor: 'name' },
        { accessor: 'date' },
        { accessor: 'transfer_from' },
        { accessor: 'transfer_doctor' },
        {
          accessor: 'state',
          render: ({ state }) => <StatusBadge status={state} />,
        },
      ]}
      records={data}
      fetching={loading}
      // TODO: fix empty state
      emptyState={<div></div>}
    />
  );
};

export default ProjectsTable;
