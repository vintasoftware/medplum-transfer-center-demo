import { AssignToRoomModal } from '@/components/actions/AssignToRoomModal';
import { useNavigate } from 'react-router-dom';

export function AssignToRoomPage(): JSX.Element {
  const navigate = useNavigate();
  return <AssignToRoomModal opened={true} onClose={() => navigate('/dashboard')} />;
}
