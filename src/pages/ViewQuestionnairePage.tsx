import { ViewQuestionnaireModal } from '@/components/actions/ViewQuestionnaireModal';
import { useNavigate } from 'react-router-dom';

export function ViewQuestionnairePage(): JSX.Element {
  const navigate = useNavigate();
  return <ViewQuestionnaireModal opened={true} onClose={() => navigate('/physicians')} />;
}
