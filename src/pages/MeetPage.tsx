import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveMeet } from '../context/ActiveMeetContext';
import { MeetLoggingScreen } from '../components/meet/MeetLoggingScreen';

export function MeetPage() {
  const { meetId } = useParams<{ meetId: string }>();
  const navigate = useNavigate();
  const { setMeetId, meet, loading, meetId: contextMeetId } = useActiveMeet();

  useEffect(() => {
    if (meetId) {
      setMeetId(meetId);
    }
    return () => setMeetId(null);
  }, [meetId, setMeetId]);

  // Redirect to home if meet not found after loading
  useEffect(() => {
    if (contextMeetId === meetId && !loading && !meet && meetId) {
      navigate('/');
    }
  }, [loading, meet, meetId, contextMeetId, navigate]);

  return <MeetLoggingScreen />;
}
