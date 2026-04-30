'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0D2137] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
        You&apos;re offline
      </h1>
      <p className="text-white/60 text-sm mb-8 max-w-xs">
        To practise offline, open the app while connected to the internet first.
        Your saved subjects will be available once the app loads.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-[#F59E0B] text-[#0D2137] px-6 py-3 rounded-xl font-bold text-sm"
      >
        Go Back
      </button>
    </div>
  );
}
