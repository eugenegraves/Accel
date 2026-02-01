import { useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveLift } from '../context/ActiveLiftContext';
import { LiftLoggingScreen } from '../components/lift/LiftLoggingScreen';

export function LiftPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { setSessionId, session, loading, sessionId: contextSessionId } = useActiveLift();

  useLayoutEffect(() => {
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

  return <LiftLoggingScreen />;
}
