'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { quiz, ai, questions as questionsApi } from '@prepwise/api-client';
import type { QuestionForQuiz, QuizSession } from '@prepwise/types';
import { Spinner } from '@/components/ui';
import { getOfflineQuestions, saveQuestionsOffline, shuffleArray } from '@/lib/offlineStorage';

function countdown(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function FlagModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const REASONS = [
    'Wrong answer key',
    'Incorrect question text',
    'Duplicate question',
    'Missing or broken image',
    'Other issue',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[#0D2137] text-base">Flag this question</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Help us improve. Tell us what&apos;s wrong.</p>
        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${reason === r ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-amber-400" />
              <span className="text-sm text-[#0D2137] font-medium">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason && onSubmit(reason)}
            disabled={!reason}
            className="flex-1 py-2.5 rounded-xl bg-[#0D2137] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#1A3A5C] transition-colors"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveQuizPage() {
  const router = useRouter();
  const params = useSearchParams();

  const subject  = params.get('subject')  ?? 'Mathematics';
  const examType = (params.get('examType') ?? 'WAEC') as 'WAEC' | 'NECO';
  const mode     = (params.get('mode')    ?? 'TIMED') as any;
  const year     = params.get('year') ? Number(params.get('year')) : undefined;
  const count    = Number(params.get('count') ?? 20);

  const [session, setSession]         = useState<QuizSession | null>(null);
  const [questions, setQuestions]     = useState<QuestionForQuiz[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selected, setSelected]       = useState<string | null>(null);
  const [answered, setAnswered]       = useState<Record<string, { selected: string | null; correct: boolean }>>({});
  const [revealed, setRevealed]       = useState(false);
  const [correctAns, setCorrectAns]   = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingAI, setLoadingAI]     = useState(false);
  const [timeLeft, setTimeLeft]       = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [qStart, setQStart]           = useState(Date.now());
  const [isOffline, setIsOffline]     = useState(false);

  // Flag state
  const [showFlagModal, setShowFlagModal]   = useState(false);
  const [flaggedIds, setFlaggedIds]         = useState<Set<string>>(new Set());
  const [submittingFlag, setSubmittingFlag] = useState(false);

  // Topic state — tracks topics assigned this session (before next quiz load)
  const [topicOverrides, setTopicOverrides] = useState<Record<string, string>>({});

  // Start quiz — falls back to IndexedDB when offline
  useEffect(() => {
    (async () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);

      if (offline) {
        // ── Tier check — FREE users cannot use offline mode ───
        // Read tier from localStorage where auth stores it
        const stored = localStorage.getItem('user');
        const tier   = stored ? JSON.parse(stored)?.subscriptionTier ?? 'FREE' : 'FREE';
        if (tier === 'FREE') {
          toast.error('Offline mode requires a Student plan or above.');
          router.push('/pricing');
          return;
        }

        // ── Offline: load from IndexedDB ──────────────────────
        const cached = await getOfflineQuestions(subject, examType);
        if (cached.length === 0) {
          toast.error('No offline questions for this subject. Connect to the internet first.');
          router.push('/quiz');
          return;
        }
        const picked = shuffleArray(cached).slice(0, Math.min(count, cached.length));
        setSession({
          id: 'offline', userId: 'offline', mode, subject, examType,
          questionIds: picked.map((q: any) => q.id),
          startedAt: new Date().toISOString(),
          completedAt: null, totalScore: null, isAbandoned: false,
        });
        setQuestions(picked as QuestionForQuiz[]);
        if (mode === 'TIMED') setTimeLeft(30 * 60);
        setLoading(false);
        toast.info('📡 Offline mode — using saved questions');
        return;
      }

      // ── Online: normal API call ────────────────────────────
      const res = await quiz.start({ mode, subject, examType, year, questionCount: count, timeLimitMinutes: mode === 'TIMED' ? 30 : undefined });
      if (!res.success) { toast.error((res as any).error || 'Failed to start quiz'); router.push('/quiz'); return; }
      setSession(res.data.session);
      setQuestions(res.data.questions);
      if (mode === 'TIMED') setTimeLeft(30 * 60);
      if (mode === 'MOCK')  setTimeLeft(180 * 60);
      setLoading(false);

      // ── Silently save questions to IndexedDB for offline use ──
      // Only for Student+ users. Fire and forget — never blocks the quiz.
      try {
        const stored = localStorage.getItem('prepwise-auth');
        const tier   = stored
          ? JSON.parse(stored)?.state?.user?.subscriptionTier ?? 'FREE'
          : 'FREE';
        if (tier !== 'FREE') {
          saveQuestionsOffline(subject, examType, res.data.questions).catch(() => {});
        }
      } catch {
        // Silent fail — offline saving is best-effort
      }
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p === null || p <= 1) { clearInterval(t); handleComplete(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft !== null]);

  const q = questions[currentIdx];

  async function handleSelect(option: string) {
    if (revealed || !session || !q) return;
    const timeTaken = Math.floor((Date.now() - qStart) / 1000);
    setSelected(option);

    if (isOffline) {
      // ── Offline: evaluate answer locally using stored correctAnswer ──
      const correctAnswer = (q as any).correctAnswer as string;
      const isCorrect     = option === correctAnswer;
      setRevealed(true);
      setCorrectAns(correctAnswer);
      setAnswered(p => ({ ...p, [q.id]: { selected: option, correct: isCorrect } }));
      if (isCorrect) toast.success('Correct! 🎉');
      return;
    }

    const res = await quiz.submitAnswer(session.id, q.id, option, timeTaken);
    if (!res.success) { toast.error('Failed to submit'); return; }

    const { isCorrect, correctAnswer } = res.data;
    setRevealed(true);
    setCorrectAns(correctAnswer);
    setAnswered(p => ({ ...p, [q.id]: { selected: option, correct: isCorrect } }));

    if (isCorrect) toast.success('Correct! 🎉');
    if (mode === 'PRACTICE' && !isCorrect) fetchExplanation(q.id, option);

    // Silently classify topic if question has none — fire and forget
    if (!q.topic && !topicOverrides[q.id]) {
      ai.classifyTopic(q.id).then(res => {
        if (res.success && res.data.topic) {
          setTopicOverrides(prev => ({ ...prev, [q.id]: res.data.topic! }));
        }
      }).catch(() => {});
    }
  }

  async function fetchExplanation(qId: string, sel: string) {
    setLoadingAI(true);
    const res = await ai.explain(qId, sel);
    if (res.success) setExplanation(res.data.explanation);
    else toast.error((res as any).error);
    setLoadingAI(false);
  }

  async function handleFlagSubmit(reason: string) {
    if (!q) return;
    setSubmittingFlag(true);
    try {
      const res = await questionsApi.flag(q.id, reason);
      if (res.success) {
        setFlaggedIds(prev => new Set(prev).add(q.id));
        toast.success('Question reported. Thanks for the feedback!');
      } else if ((res as any).code === 'ALREADY_FLAGGED' || (res as any).error?.toLowerCase().includes('already')) {
        setFlaggedIds(prev => new Set(prev).add(q.id));
        toast.info('You have already reported this question.');
      } else {
        toast.error((res as any).error ?? 'Failed to report question');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setSubmittingFlag(false);
      setShowFlagModal(false);
    }
  }

  function handleNext() {
    setSelected(null);
    setRevealed(false);
    setCorrectAns(null);
    setExplanation(null);
    setQStart(Date.now());
    if (currentIdx + 1 >= questions.length) handleComplete();
    else setCurrentIdx(i => i + 1);
  }

  const handleComplete = useCallback(async () => {
    if (!session) return;
    if (isOffline) {
      // Offline: show local results summary
      const correct = Object.values(answered).filter(a => a.correct).length;
      const total   = questions.length;
      const score   = Math.round((correct / total) * 100);
      router.push(`/quiz/results?offline=1&score=${score}&correct=${correct}&total=${total}&subject=${encodeURIComponent(subject)}`);
      return;
    }
    const res = await quiz.complete(session.id);
    if (res.success) router.push(`/quiz/results?sessionId=${session.id}`);
    else toast.error('Failed to complete');
  }, [session, router, isOffline, answered, questions, subject]);

  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center"><Spinner size={36} /><p className="text-gray-400 mt-4 text-sm">Loading questions...</p></div>
    </div>
  );

  if (!q) return null;

  const progress       = Math.round(((currentIdx + 1) / questions.length) * 100);
  const timerWarning   = timeLeft !== null && timeLeft < 300;
  const isFlagged      = flaggedIds.has(q.id);

  return (
    <div className="min-h-screen bg-[#F0F4F8]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Flag modal */}
      {showFlagModal && (
        <FlagModal
          onClose={() => setShowFlagModal(false)}
          onSubmit={handleFlagSubmit}
        />
      )}

      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-amber-500 text-[#0D2137] text-xs font-bold text-center py-1.5 px-4">
          📡 Offline mode — answers won&apos;t be saved to your progress
        </div>
      )}

      {/* Top bar */}
      <header className="bg-[#0D2137] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">{subject} · {examType}</p>
              <p className="text-sm font-bold text-white">Question {currentIdx + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <span className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${timerWarning ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
                  ⏱ {countdown(timeLeft)}
                </span>
              )}
              <button onClick={handleComplete} className="text-xs text-white/40 hover:text-white/70 transition-colors">End Quiz</button>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Question card */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {q.year  && <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{q.year}</span>}
              {(q.topic || topicOverrides[q.id]) && (
                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded">
                  {topicOverrides[q.id] ?? q.topic}
                </span>
              )}
            </div>
            {/* Flag button */}
            <button
              onClick={() => !isFlagged && setShowFlagModal(true)}
              disabled={submittingFlag || isFlagged}
              title={isFlagged ? 'Already reported' : 'Report an issue with this question'}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                isFlagged
                  ? 'border-orange-200 bg-orange-50 text-orange-500 cursor-default'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 cursor-pointer'
              }`}
            >
              <svg viewBox="0 0 16 16" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M2 2v13M2 2l8 2-8 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isFlagged ? 'Reported' : 'Report'}
            </button>
          </div>

          {(q as any).questionImageUrl && (
            <img src={(q as any).questionImageUrl} alt="Question diagram" className="max-w-full rounded-lg mb-4 border border-gray-100" />
          )}
          <p className="text-[#0D2137] font-semibold leading-relaxed">{q.questionText}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {Object.entries(q.options).map(([key, val]) => {
            let style = 'border-gray-200 bg-white hover:border-amber-300 cursor-pointer';
            if (revealed) {
              if (key === correctAns) style = 'border-green-500 bg-green-50 cursor-default';
              else if (key === selected) style = 'border-red-400 bg-red-50 cursor-default';
              else style = 'border-gray-100 bg-gray-50 opacity-60 cursor-default';
            }
            return (
              <button key={key} onClick={() => handleSelect(key)} disabled={revealed}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${style}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  revealed && key === correctAns ? 'bg-green-500 text-white' :
                  revealed && key === selected   ? 'bg-red-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>{key}</span>
                <span className="text-sm font-medium text-[#0D2137]">{val}</span>
                {revealed && key === correctAns && <span className="ml-auto text-green-500 text-sm">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Post-answer actions */}
        {revealed && (
          <div className="space-y-4">
            {selected !== correctAns && (
              <div>
                <button
                  onClick={() => !explanation && fetchExplanation(q.id, selected!)}
                  disabled={loadingAI || !!explanation}
                  className="w-full border-2 border-blue-200 text-blue-600 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingAI ? <><Spinner size={16} />Getting AI explanation...</> : '✨ Get AI Explanation'}
                </button>
                {explanation && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <p className="text-xs font-bold text-blue-700 mb-2">✨ AI Explanation</p>
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{explanation}</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleNext} className="w-full bg-[#0D2137] text-white py-3.5 rounded-xl font-bold hover:bg-[#1A3A5C] transition-colors">
              {currentIdx + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-8 flex-wrap max-w-md mx-auto">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
              i < currentIdx ? (answered[questions[i].id]?.correct ? 'bg-green-400' : 'bg-red-400') :
              i === currentIdx ? 'bg-[#F59E0B]' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </main>
    </div>
  );
}

import { Suspense } from 'react';
export default function ActiveQuizPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" /></div>}>
      <ActiveQuizPage />
    </Suspense>
  );
}
