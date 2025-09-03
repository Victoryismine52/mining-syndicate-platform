export function ComingSoon() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 
          className="text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse"
          data-testid="text-coming-soon"
        >
          COMING SOON
        </h1>
      </div>
    </div>
  );
}