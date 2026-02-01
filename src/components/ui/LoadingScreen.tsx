interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin" />
      <div className="text-zinc-400 text-sm">{message}</div>
    </div>
  );
}
