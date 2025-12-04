import { Badge, MantineColor } from '@mantine/core';

type Status =
  | 'Completed Transfer'
  | 'Consultation'
  | 'Higher Level of Care'
  | 'Declination'
  | 'Cancellation'
  | 'In Progress';

export type StatusBadgeProps = { status: Status | undefined };

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  let color: MantineColor = '';

  switch (status) {
    case 'Completed Transfer':
      color = 'green';
      break;
    case 'Consultation':
      color = 'yellow';
      break;
    case 'Higher Level of Care':
      color = 'orange';
      break;
    case 'Declination':
    case 'Cancellation':
      color = 'red';
      break;
    case 'In Progress':
      color = 'blue';
      break;
    default:
      color = 'gray';
  }

  return (
    <Badge color={color} variant="filled" radius="sm">
      {status ?? 'Unknown'}
    </Badge>
  );
};
