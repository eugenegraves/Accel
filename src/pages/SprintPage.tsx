import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveSprint } from '../context/ActiveSprintContext';
import { SprintLoggingScreen } from '../components/sprint/SprintLoggingScreen';

export function SprintPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { setSessionId, session, loading, sessionId: contextSessionId } = useActiveSprint();

  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
    }
    return () => setSessionId(null);
  }, [sessionId, setSessionId]);

  // Redirect to home if session not found after loading
  useEffect(() => {
    if (contextSessionId === sessionId && !loading && !session && sessionId) {
      navigate('/');
    }
  }, [loading, session, sessionId, contextSessionId, navigate]);

  return <SprintLoggingScreen />;
}
