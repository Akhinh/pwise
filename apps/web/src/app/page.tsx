import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PrepWise — WAEC & NECO AI Exam Preparation',
  description: 'AI-powered past questions for Nigerian secondary school students. Practice smarter with instant explanations.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(13,33,55,0.10); border-color: #F59E0B; }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary .arrow { transform: rotate(180deg); }
        .arrow { transition: transform 0.2s ease; display:inline-block; }
      `}</style>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-black text-[#0D2137]">PrepWise</span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#why" className="hover:text-[#0D2137] transition-colors">Why PrepWise</a>
            <a href="#features" className="hover:text-[#0D2137] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#0D2137] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#0D2137] transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-[#0D2137] transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-[#0D2137]">Log in</Link>
            <Link href="/auth/register" className="bg-[#F59E0B] text-[#0D2137] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#FCD34D] transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-amber-200">
          🇳🇬 Built for Nigerian SS2 &amp; SS3 Students
        </div>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-5xl md:text-6xl font-black text-[#0D2137] leading-tight mb-6 max-w-3xl">
          Pass WAEC &amp; NECO<br />
          <span className="text-[#F59E0B]">with AI by your side</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-2xl">
          10+ years of past questions across <strong className="text-[#0D2137]">every subject</strong>. Every wrong answer explained by AI instantly.
          The most affordable exam prep platform in Nigeria — starting at just ₦500/month.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/auth/register" className="bg-[#0D2137] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-[#1A3A5C] transition-colors inline-flex items-center gap-2">
            Start Practising Free →
          </Link>
          <a href="#features" className="border border-gray-200 text-[#0D2137] px-8 py-4 rounded-xl font-semibold text-base hover:border-amber-300 transition-colors">
            See How It Works
          </a>
        </div>
        <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-gray-100">
          {[['22,000+','Past Questions'],['15+','Subjects Covered'],['10 Years','Of Past Papers'],['₦500/mo','Cheapest Plan']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-black text-[#F59E0B]">{v}</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why PrepWise ── */}
      <section id="why" className="bg-[#0D2137] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border" style={{background:'rgba(245,158,11,0.15)', color:'#F59E0B', borderColor:'rgba(245,158,11,0.3)'}}>
            Why Choose PrepWise
          </div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl md:text-4xl font-black text-white mb-4 max-w-2xl">
            We do what no other Nigerian platform does
          </h2>
          <p className="text-white/50 mb-12 max-w-xl text-base leading-relaxed">
            Other platforms cut corners. PrepWise was built from the ground up to give every Nigerian student — regardless of location or budget — a genuine shot at excellent results.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-4">📚</div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-bold text-white mb-3">
                Every Subject. Zero Exceptions.
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Most platforms only cover the "popular" subjects — Mathematics, English, Biology. PrepWise has past questions for <strong className="text-white">every single WAEC and NECO subject</strong>, including Fine Arts, Music, History, Igbo, Yoruba, Hausa, Agricultural Science, Home Economics, Physical Education, and more.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Whether you&apos;re sitting 5 papers or 9, you&apos;ll find every question you need — all in one place. No more jumping between different websites or photocopying old handouts.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Mathematics','English','Biology','Chemistry','Physics','Economics','Literature','Govt','Igbo','Yoruba','Fine Arts','Music','History','Agric','Home Econ'].map(s => (
                  <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border" style={{background:'rgba(245,158,11,0.1)', color:'#F59E0B', borderColor:'rgba(245,158,11,0.2)'}}>{s}</span>
                ))}
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border" style={{background:'rgba(245,158,11,0.1)', color:'#F59E0B', borderColor:'rgba(245,158,11,0.2)'}}>+ more</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-4">💰</div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-bold text-white mb-3">
                The Most Affordable Platform in Nigeria
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                Compare us against every other exam prep platform and you&apos;ll find the same thing: PrepWise costs less — sometimes <strong className="text-white">5× cheaper</strong> — while offering more features. We believe cost should never be the reason a student fails.
              </p>
              <div className="space-y-3">
                {[
                  ['FREE forever','10 questions/day + 5 AI explanations. No credit card. No expiry.'],
                  ['Student — ₦500/mo','Unlimited questions. All subjects. Offline mode. Full analytics.'],
                  ['Premium — ₦1,000/mo','Unlimited AI explanations. Mock exams. AI Study Chat.'],
                  ['School — ₦10,000/mo','Entire school subscription. Every student covered.'],
                ].map(([tier, desc]) => (
                  <div key={tier} className="flex gap-3">
                    <span className="font-black text-sm mt-0.5" style={{color:'#F59E0B'}}>✓</span>
                    <div>
                      <span className="text-white text-sm font-bold">{tier}: </span>
                      <span className="text-white/55 text-sm">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-4">🤖</div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-bold text-white mb-3">
                Real AI — Not Just Answer Keys
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Every wrong answer triggers an AI explanation <strong className="text-white">written specifically for you</strong> — in plain English at SS3 level, not copied from a textbook. Our AI understands Nigerian curriculum and explains concepts the way a great teacher would.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Premium users can go further with <strong className="text-white">AI Study Chat</strong> — ask follow-up questions, request a different explanation, or ask &quot;why is option B wrong?&quot; at any time.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-colors">
              <div className="text-3xl mb-4">📡</div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-xl font-bold text-white mb-3">
                Works Without Internet
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                We know Nigerian internet is unreliable. That&apos;s why PrepWise is a <strong className="text-white">Progressive Web App (PWA)</strong> — download it to your phone and practise questions fully offline. Whether you&apos;re at home, in school, or travelling with no data, your practice never stops.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Offline mode is available from the Student plan and above. Progress syncs automatically when you reconnect.
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-7 overflow-x-auto">
            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-lg font-bold text-white mb-5">How we compare</h3>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 font-semibold pb-3 pr-6">Feature</th>
                  <th className="text-center font-bold pb-3 px-4" style={{color:'#F59E0B'}}>PrepWise</th>
                  <th className="text-center text-white/30 font-semibold pb-3 px-4">Other Platforms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['All WAEC/NECO subjects', '✓', '✗'],
                  ['AI-powered explanations', '✓', '✗'],
                  ['Offline mode (PWA)', '✓', '✗'],
                  ['Free tier — no expiry', '✓', '✗'],
                  ['Plans from ₦500/month', '✓', '✗'],
                  ['Mock exam simulator', '✓', '⚠️ Some'],
                  ['National leaderboard', '✓', '✗'],
                  ['School/bulk subscription', '✓', '⚠️ Some'],
                ].map(([feat, us, them]) => (
                  <tr key={feat}>
                    <td className="py-3 pr-6 text-white/60">{feat}</td>
                    <td className="py-3 px-4 text-center font-bold" style={{color: us === '✓' ? '#4ade80' : undefined}}>{us}</td>
                    <td className="py-3 px-4 text-center" style={{color: them === '✗' ? '#f87171' : '#fbbf24', fontSize: them.startsWith('⚠️') ? '11px' : undefined}}>{them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] mb-3">Up and running in 2 minutes</h2>
          <p className="text-gray-400 mb-12 max-w-md mx-auto">No app store needed. No complicated setup. Just open, register, and start practising.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              ['01','Create Account','Sign up free in under a minute. No credit card required.'],
              ['02','Pick Your Subjects','Choose the subjects you\'re sitting for WAEC or NECO.'],
              ['03','Start Practising','Answer past questions. Get AI explanations for every wrong answer.'],
              ['04','Track Progress','Watch your scores improve week by week with smart analytics.'],
            ].map(([n,t,d]) => (
              <div key={n} className="text-left">
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#FDE68A' }} className="text-4xl font-black mb-3">{n}</div>
                <h4 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-sm font-bold text-[#0D2137] mb-1.5">{t}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] text-center mb-3">Everything you need to pass</h2>
          <p className="text-gray-400 text-center mb-12 max-w-lg mx-auto">Not just past questions — a complete study system designed around how Nigerian students actually learn</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ['✨','AI Explanations','Get instant explanations for every wrong answer from Claude AI — written at SS3 level in plain English. No jargon, no textbook copy-paste. Finally understand why you got it wrong.'],
              ['📱','Works Offline','Download your questions and practise without internet. Perfect for areas with poor network. Available on Student plan and above. Progress syncs when you reconnect.'],
              ['📊','Smart Analytics','See exactly which topics need more attention. Track your improvement week by week with detailed subject-level breakdowns. Study smarter, not harder.'],
              ['⏱️','Mock Exams','Simulate real exam conditions with full 3-hour timed papers. Build the stamina and confidence you need on exam day. Premium plan feature.'],
              ['🏆','Leaderboards','Compete with students across Nigeria. See where you rank nationally and by state — subject by subject. Healthy competition keeps you motivated.'],
              ['🔥','Daily Streaks','Build a consistent study habit with streak tracking. 20 minutes every day beats 10 hours the night before the exam — science agrees.'],
              ['💬','AI Study Chat','Have a full conversation with AI about any topic you\'re struggling with. Ask follow-up questions, request worked examples, or explore concepts deeper. Premium only.'],
              ['🎓','All 15+ Subjects','From Mathematics and English to Igbo, Fine Arts, and Music — we have every subject you\'re sitting. No student left behind regardless of their combination.'],
              ['📲','Install Like an App','PrepWise works like a native app on your Android or iPhone — add it to your home screen from your browser. No App Store or Play Store download needed.'],
            ].map(([icon,title,desc]) => (
              <div key={title as string} className="bg-white border border-gray-200 rounded-[14px] p-6 card-hover">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-base font-bold text-[#0D2137] mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-amber-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] text-center mb-3">Students are already winning</h2>
          <p className="text-gray-400 text-center mb-12">Real feedback from students across Nigeria</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              ['Chisom A.', 'Enugu State', 'I failed Chemistry twice in school but after 3 weeks on PrepWise, I finally understand what I was doing wrong. The AI explanations are honestly better.'],
              ['Akin O.', 'Lagos State', 'The offline mode is the best thing. I have no data most evenings but I can still practise 100 questions before bed. My mock scores went from 34% to 71% in 6 weeks.'],
              ['Fatima B.', 'Kano State', 'I was looking for a platform with Hausa and Islamiyya questions. PrepWise is the only one that actually has them. Plus ₦500 is nothing compared to what I spent on lesson notes.'],
            ].map(([name, loc, quote]) => (
              <div key={name as string} className="bg-white border border-amber-100 rounded-[14px] p-6">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_,i) => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">&quot;{quote}&quot;</p>
                <div>
                  <div className="text-sm font-bold text-[#0D2137]">{name}</div>
                  <div className="text-xs text-gray-400">{loc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] text-center mb-3">Simple, honest pricing</h2>
          <p className="text-gray-400 text-center mb-2">Start free. Upgrade only when you need more.</p>
          <p className="text-center mb-12 text-sm font-semibold text-green-600">✓ No hidden fees &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Cheaper than any competitor</p>
          <div className="grid md:grid-cols-4 gap-4 items-start">
            {[
              {name:'Free',price:'₦0',period:'forever',hot:false,features:['10 questions/day','5 subjects','5 AI explanations/day','Basic analytics','Web access'],cta:'Get Started Free', href:'/auth/register'},
              {name:'Student',price:'₦500',period:'/month',hot:true,features:['Unlimited questions','All 15+ subjects','50 AI explanations/day','Offline mode (PWA)','Full analytics','Streaks & leaderboard'],cta:'Start Student Plan', href:'/auth/register'},
              {name:'Premium',price:'₦1,000',period:'/month',hot:false,features:['Everything in Student','Unlimited AI explanations','Mock exams (3hr timer)','AI Study Chat','Priority support'],cta:'Go Premium', href:'/auth/register'},
              {name:'School',price:'₦10,000',period:'/month',hot:false,features:['Full school access','All Premium features','Bulk student accounts','Dedicated support'],cta:'Contact Us', href:'#contact'},
            ].map(({name,price,period,hot,features,cta,href}) => (
              <div key={name} className={`bg-white rounded-[14px] p-5 relative flex flex-col ${hot ? 'border-2 border-[#0D2137] shadow-xl' : 'border border-gray-200'}`} style={hot ? {marginTop: '-8px'} : {}}>
                {hot && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0D2137] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">Most Popular</div>}
                <div style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-lg font-bold text-[#0D2137] mb-1">{name}</div>
                <div className="mb-4">
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-black text-[#0D2137]">{price}</span>
                  <span className="text-xs text-gray-400 ml-1">{period}</span>
                </div>
                <Link
                  href={href}
                  className={`block text-center py-2.5 rounded-xl text-sm font-bold mb-4 transition-colors ${hot ? 'bg-[#0D2137] text-white hover:bg-[#1A3A5C]' : 'bg-gray-100 text-[#0D2137] hover:bg-gray-200'}`}
                >{cta}</Link>
                <ul className="space-y-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">Payments via Paystack · Bank transfer, USSD &amp; cards accepted · Cancel anytime</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              ['Is PrepWise really free?', 'Yes — completely free to start, no credit card needed, no expiry. The free plan gives you 10 questions per day and 5 AI explanations. You only need to upgrade when you want unlimited access.'],
              ['Does it work on my phone?', 'Yes. PrepWise is a Progressive Web App — open it in your phone browser (Chrome or Safari), tap "Add to Home Screen", and it works exactly like an app. No App Store or Play Store download needed.'],
              ['Can I use it without internet?', 'Yes, on the Student plan and above. Once downloaded, questions are fully available offline. Your progress syncs the next time you\'re online.'],
              ['Which subjects are available?', 'All WAEC and NECO subjects — Mathematics, English, Biology, Chemistry, Physics, Economics, Government, Literature, Geography, Commerce, Agricultural Science, Yoruba, Igbo, Hausa, History, Fine Arts, Music, Home Economics, Physical Education, and more. If you\'re sitting for it, we have it.'],
              ['How is PrepWise different from myschool.ng or past question books?', 'PrepWise has AI-powered explanations for every wrong answer — no other Nigerian platform does this. It works offline, tracks your progress intelligently, and costs far less than competitors. Physical books can\'t tell you why you got something wrong.'],
              ['How does the School plan work?', 'The School plan at ₦10,000/month gives every student in your school Premium access. You get an admin dashboard to monitor usage and student progress. Contact us to get set up.'],
              ['Can I cancel my subscription?', 'Yes, anytime — no cancellation fees, no questions asked. You keep access until the end of your current billing period.'],
              ['How do I pay?', 'Via Paystack — bank transfer, USSD, debit/credit card, or mobile money. All major Nigerian banks are supported.'],
            ].map(([q,a]) => (
              <details key={q as string} className="bg-white border border-gray-200 rounded-xl group">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-semibold text-[#0D2137] text-sm select-none list-none">
                  {q}
                  <span className="text-gray-400 flex-shrink-0 arrow">▾</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-3xl font-bold text-[#0D2137] mb-3">Get in touch</h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">Have a question, a school enquiry, or just want to say hello? We reply fast.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/2348071285990"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 text-white px-8 py-4 rounded-xl font-bold text-sm transition-colors bg-[#25D366] hover:bg-[#1ebe59]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
            <a
              href="mailto:theprepwise@gmail.com"
              className="inline-flex items-center justify-center gap-3 bg-[#0D2137] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 flex-shrink-0">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Send an Email
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-6">Schools and bulk enquiries are very welcome. We typically respond within a few hours on weekdays.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0D2137] py-20">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-4xl font-black text-white mb-4">Your results start here</h2>
          <p className="text-white/60 mb-2">Join thousands of Nigerian students already using PrepWise to prepare smarter.</p>
          <p className="text-white/40 text-sm mb-8">Free to start · All subjects covered · AI explanations included</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0D2137] px-10 py-4 rounded-xl font-black text-base hover:bg-[#FCD34D] transition-colors">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-lg font-bold text-[#0D2137]">PrepWise</span>
              <p className="text-sm text-gray-400 mt-2 max-w-xs leading-relaxed">AI-powered WAEC &amp; NECO exam preparation for every Nigerian secondary school student.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold text-[#0D2137] mb-3">Platform</div>
                <div className="space-y-2 text-gray-400">
                  <a href="#features" className="block hover:text-[#0D2137]">Features</a>
                  <a href="#pricing" className="block hover:text-[#0D2137]">Pricing</a>
                  <a href="#faq" className="block hover:text-[#0D2137]">FAQ</a>
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] mb-3">For Schools</div>
                <div className="space-y-2 text-gray-400">
                  <a href="#pricing" className="block hover:text-[#0D2137]">School Plan</a>
                  <a href="#contact" className="block hover:text-[#0D2137]">Get in Touch</a>
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#0D2137] mb-3">Legal</div>
                <div className="space-y-2 text-gray-400">
                  <Link href="#" className="block hover:text-[#0D2137]">Privacy Policy</Link>
                  <Link href="#" className="block hover:text-[#0D2137]">Terms of Service</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400">© 2026 PrepWise. Built with ❤️ for Nigerian students. 🇳🇬</p>
            <div className="flex gap-4">
              <a href="https://wa.me/2348071285990" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="mailto:theprepwise@gmail.com" className="text-gray-400 hover:text-[#0D2137] transition-colors" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
