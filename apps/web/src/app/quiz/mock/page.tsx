'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken() {
  try {
    const s = localStorage.getItem('prepwise-auth');
    return s ? JSON.parse(s)?.state?.accessToken ?? null : null;
  } catch { return null; }
}

async function apiPost(path: string, body: object) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

function countdownHMS(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

interface SubQuestion { label: string; text: string; }
interface TheoryQuestion {
  id: string; year: number; questionNumber: number;
  questionText: string; subQuestions: SubQuestion[];
  questionImageUrl: string | null; topic: string | null; answer?: string | null;
}

function FlagModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (r: string) => void }) {
  const [reason, setReason] = useState('');
  const REASONS = ['Wrong answer','Incorrect question text','Duplicate question','Missing or broken image','Other issue'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[#0D2137] text-base">Report this question</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Help us improve. What&apos;s wrong?</p>
        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${reason===r?'border-amber-400 bg-amber-50':'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="reason" value={r} checked={reason===r} onChange={()=>setReason(r)} className="accent-amber-400"/>
              <span className="text-sm text-[#0D2137] font-medium">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={()=>reason&&onSubmit(reason)} disabled={!reason} className="flex-1 py-2.5 rounded-xl bg-[#0D2137] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#1A3A5C]">Submit</button>
        </div>
      </div>
    </div>
  );
}

function MockExamPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const subject  = params.get('subject')  ?? 'Mathematics';
  const examType = (params.get('examType') ?? 'WAEC') as 'WAEC'|'NECO';
  const year     = Number(params.get('year') ?? 0);

  const [sessionId, setSessionId]           = useState<string|null>(null);
  const [questions, setQuestions]           = useState<TheoryQuestion[]>([]);
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [timeLeft, setTimeLeft]             = useState(180*60);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [showAnswer, setShowAnswer]         = useState(false);
  const [showFlagModal, setShowFlagModal]   = useState(false);
  const [flaggedIds, setFlaggedIds]         = useState<Set<string>>(new Set());
  const [submittingFlag, setSubmittingFlag] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiPost('/api/v1/theory-quiz/start', { subject, examType, year: year||undefined });
      if (!res.success) { toast.error(res.error ?? 'Failed to load mock exam'); router.push('/quiz'); return; }
      setSessionId(res.data.session.id);
      setQuestions(res.data.questions);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setTimeLeft(p => { if (p<=1){clearInterval(t);handleSubmit();return 0;} return p-1; }), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId||submitting) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/v1/theory-quiz/${sessionId}/complete`, {});
      router.push(`/quiz/mock/results?sessionId=${sessionId}`);
    } catch { toast.error('Failed to submit. Try again.'); setSubmitting(false); }
  }, [sessionId, submitting, router]);

  async function handleFlag(reason: string) {
    const q = questions[currentIdx];
    if (!q) return;
    setSubmittingFlag(true);
    try {
      const res = await apiPost(`/api/v1/theory-quiz/${sessionId}/flag`, { questionId: q.id, reason });
      if (res.success) { setFlaggedIds(p=>new Set(p).add(q.id)); toast.success('Question reported. Thanks!'); }
      else if (res.error?.toLowerCase().includes('already')) { setFlaggedIds(p=>new Set(p).add(q.id)); toast.info('Already reported.'); }
      else toast.error(res.error ?? 'Failed to report');
    } catch { toast.error('Network error'); }
    finally { setSubmittingFlag(false); setShowFlagModal(false); }
  }

  function goTo(idx: number) { setCurrentIdx(idx); setShowAnswer(false); }

  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center"><Spinner size={36}/><p className="text-gray-400 mt-4 text-sm">Loading {subject} {examType} {year} questions...</p></div>
    </div>
  );

  if (questions.length===0) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <p className="text-4xl mb-4">📭</p>
        <p className="font-bold text-[#0D2137] mb-2">No theory questions found</p>
        <p className="text-sm text-gray-400 mb-6">No questions for {subject} {examType} {year}. Try a different year.</p>
        <button onClick={()=>router.push('/quiz')} className="bg-[#0D2137] text-white px-6 py-2.5 rounded-xl text-sm font-bold">Back</button>
      </div>
    </div>
  );

  const q             = questions[currentIdx];
  const progress      = Math.round(((currentIdx+1)/questions.length)*100);
  const timerWarning  = timeLeft<900;
  const timerCritical = timeLeft<300;
  const isFlagged     = flaggedIds.has(q.id);

  return (
    <div className="min-h-screen bg-[#F0F4F8]" style={{fontFamily:"'DM Sans', system-ui, sans-serif"}}>
      {showFlagModal && <FlagModal onClose={()=>setShowFlagModal(false)} onSubmit={handleFlag}/>}

      <header className="bg-[#0D2137] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Mock Exam · {subject} · {examType} {year}</p>
              <p className="text-sm font-bold text-white">Question {currentIdx+1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${timerCritical?'bg-red-500 text-white animate-pulse':timerWarning?'bg-amber-400 text-[#0D2137]':'bg-white/10 text-white'}`}>
                ⏱ {countdownHMS(timeLeft)}
              </span>
              <button onClick={()=>{if(window.confirm('Submit exam now?'))handleSubmit();}} className="text-xs text-white/40 hover:text-white/70 transition-colors">Submit</button>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-300" style={{width:`${progress}%`}}/>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-[14px] p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{q.year}</span>
              <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded">Q{q.questionNumber}</span>
              {q.topic && <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded">{q.topic}</span>}
            </div>
            <button onClick={()=>!isFlagged&&setShowFlagModal(true)} disabled={submittingFlag||isFlagged}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${isFlagged?'border-orange-200 bg-orange-50 text-orange-500 cursor-default':'border-gray-200 bg-white text-gray-400 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'}`}>
              <svg viewBox="0 0 16 16" fill={isFlagged?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M2 2v13M2 2l8 2-8 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isFlagged?'Reported':'Report'}
            </button>
          </div>

          {q.questionImageUrl && <img src={q.questionImageUrl} alt="Question" className="max-w-full rounded-lg mb-4 border border-gray-100"/>}
          <p className="text-[#0D2137] font-semibold leading-relaxed text-base mb-4">{q.questionText}</p>

          {q.subQuestions.length>0 && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {q.subQuestions.map((sq,i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-black text-[#F59E0B] flex-shrink-0 mt-0.5 min-w-[2rem]">({sq.label})</span>
                  <p className="text-sm text-[#0D2137] leading-relaxed">{sq.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          {!showAnswer ? (
            <button onClick={()=>setShowAnswer(true)} className="w-full border-2 border-amber-200 text-amber-700 py-3 rounded-xl font-semibold text-sm hover:bg-amber-50 transition-colors">
              👁 View Model Answer
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">📋 Model Answer</p>
                <button onClick={()=>setShowAnswer(false)} className="text-xs text-amber-600 hover:text-amber-800 font-medium">Hide</button>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                {q.answer ?? 'Model answer not yet available for this question.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={()=>goTo(currentIdx-1)} disabled={currentIdx===0}
            className="flex-1 bg-white border border-gray-200 text-[#0D2137] py-3.5 rounded-xl font-bold text-sm hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            ← Previous
          </button>
          {currentIdx+1>=questions.length ? (
            <button onClick={()=>{if(window.confirm('Submit the mock exam now?'))handleSubmit();}} disabled={submitting}
              className="flex-1 bg-[#F59E0B] text-[#0D2137] py-3.5 rounded-xl font-bold text-sm hover:bg-[#FCD34D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting?<><Spinner size={16}/>Submitting...</>:'Submit Exam →'}
            </button>
          ) : (
            <button onClick={()=>goTo(currentIdx+1)}
              className="flex-1 bg-[#0D2137] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors">
              Next →
            </button>
          )}
        </div>

        <div className="flex justify-center gap-1.5 flex-wrap max-w-md mx-auto">
          {questions.map((_,i) => (
            <button key={i} onClick={()=>goTo(i)} title={`Q${i+1}`}
              className={`rounded-full transition-all ${i===currentIdx?'w-3 h-3 bg-[#F59E0B] scale-125':'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'}`}/>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Tap any dot to jump to that question</p>
      </main>
    </div>
  );
}

import { Suspense } from 'react';
export default function MockExamPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin"/></div>}>
      <MockExamPage/>
    </Suspense>
  );
}