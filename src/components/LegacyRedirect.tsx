import { useParams, Navigate } from 'react-router-dom';

export function LegacyTradeRedirect() {
  const { agentId } = useParams<{ agentId: string }>();
  return <Navigate to={`/agent/${agentId}`} replace />;
}