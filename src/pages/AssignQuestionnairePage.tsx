import { AssignQuestionnaireModal } from '@/components/actions/AssignQuestionnaireModal';
import { useNavigate } from 'react-router-dom';

export function AssignQuestionnairePage(): JSX.Element {
  const navigate = useNavigate();
  return <AssignQuestionnaireModal opened={true} onClose={() => navigate('/physicians')} />;
}
