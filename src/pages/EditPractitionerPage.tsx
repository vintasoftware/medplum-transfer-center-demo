import { EditPractitionerModal } from '@/components/actions/EditPractitionerModal';
import { useNavigate } from 'react-router-dom';

export function EditPractitionerPage(): JSX.Element {
  const navigate = useNavigate();
  return <EditPractitionerModal opened={true} onClose={() => navigate('/physicians')} />;
}
