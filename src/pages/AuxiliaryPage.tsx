import { useParams } from 'react-router-dom';
import { AuxiliaryLoggingScreen } from '../components/auxiliary/AuxiliaryLoggingScreen';

export function AuxiliaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-400">Invalid session</p>
      </div>
    );
  }

  return <AuxiliaryLoggingScreen sessionId={sessionId} />;
}
