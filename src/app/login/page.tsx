'use client';
// src/app/login/page.tsx
// GIIS Hackathon 2K26 — Login Page
// Replace the existing src/app/login/page.tsx with this file

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created! Sign in below to continue.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      setLoading(true); setError('');
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        :root {
          --bg: #030d1a; --bg-alt: #04304C;
          --accent: #2EB3BE; --accent-2: #7debea; --accent-dark: #0b6279;
          --text: #ffffff; --text-muted: #8db4c8;
          --border: rgba(46,179,190,0.25); --panel: rgba(11,98,121,0.12);
          --font-head: 'Orbitron', monospace;
          --font-body: 'Rajdhani', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-body); background: var(--bg); color: var(--text); min-height: 100vh; cursor: none; overflow-x: hidden; }
        a, button, input { cursor: none; }

        .cursor { position: fixed; width: 18px; height: 18px; border: 2px solid var(--accent); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%,-50%); transition: width .2s, height .2s, background .2s; mix-blend-mode: screen; }
        .cursor.big { width: 36px; height: 36px; background: rgba(46,179,190,0.1); border-color: var(--accent-2); }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(46,179,190,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(46,179,190,0.04) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0; }
        .orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.3; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #0b6279, transparent 70%); top: -150px; left: -100px; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #04304C, transparent 70%); bottom: 0; right: -100px; }

        .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; position: relative; z-index: 1; }

        /* LEFT PANEL */
        .left-panel {
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 40px 48px;
          background: linear-gradient(135deg, rgba(4,48,76,0.5) 0%, rgba(11,98,121,0.2) 100%);
          border-right: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .left-panel::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(46,179,190,0.015) 40px, rgba(46,179,190,0.015) 41px);
        }

        .panel-logo { font-family: var(--font-head); font-size: 0.82rem; font-weight: 700; letter-spacing: 2px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none; }

        .panel-hero { position: relative; }
        .panel-tag { font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 3px; color: var(--accent); text-transform: uppercase; margin-bottom: 16px; }
        .panel-title { font-family: var(--font-head); font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; line-height: 1; letter-spacing: -1px; margin-bottom: 20px; }
        .panel-title span { display: block; background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .panel-desc { font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; max-width: 380px; }

        .panel-features { display: flex; flex-direction: column; gap: 12px; }
        .panel-feat { display: flex; align-items: center; gap: 12px; font-size: 0.88rem; color: var(--text-muted); }
        .feat-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(46,179,190,0.1); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
        .panel-dates { font-family: var(--font-mono); font-size: 0.65rem; color: rgba(141,180,200,0.5); letter-spacing: 1px; }

        /* RIGHT PANEL */
        .right-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 48px; }

        .auth-card { width: min(100%, 420px); animation: slideUp 0.5s ease both; }
        @keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }

        .card-tag { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 3px; color: var(--accent); text-transform: uppercase; margin-bottom: 6px; }
        .card-title { font-family: var(--font-head); font-size: 1.6rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 28px; }

        .success-box { background: rgba(46,179,190,0.1); border: 1px solid rgba(46,179,190,0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 0.88rem; color: var(--accent-2); line-height: 1.5; }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 0.88rem; color: #fca5a5; line-height: 1.5; }

        .form-group { margin-bottom: 18px; }
        .form-label { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 2px; color: var(--accent-2); text-transform: uppercase; margin-bottom: 7px; display: block; }
        .form-input { width: 100%; background: rgba(4,48,76,0.4); border: 1px solid var(--border); border-radius: 8px; padding: 13px 14px; color: var(--text); font-family: var(--font-body); font-size: 1rem; outline: none; transition: all 0.25s; }
        .form-input:focus { border-color: var(--accent); background: rgba(11,98,121,0.25); box-shadow: 0 0 16px rgba(46,179,190,0.12); }
        .form-input::placeholder { color: rgba(141,180,200,0.35); }

        .forgot { display: flex; justify-content: flex-end; }
        .forgot a { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-muted); text-decoration: none; letter-spacing: 1px; transition: color 0.2s; }
        .forgot a:hover { color: var(--accent-2); }

        .btn-primary { width: 100%; font-family: var(--font-head); font-size: 0.72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--bg); background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); border: none; padding: 14px; border-radius: 8px; transition: all 0.25s; margin-top: 4px; }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(46,179,190,0.35); }
        .btn-primary:disabled { opacity: 0.5; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .btn-sso { width: 100%; font-family: var(--font-head); font-size: 0.68rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); background: transparent; border: 1px solid var(--border); padding: 12px; border-radius: 8px; transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-sso:hover { border-color: var(--accent); background: rgba(46,179,190,0.05); }

        .form-hint { font-family: var(--font-body); font-size: 0.82rem; color: var(--text-muted); margin-top: 20px; text-align: center; }
        .form-hint a { color: var(--accent-2); text-decoration: none; }
        .form-hint a:hover { text-decoration: underline; }

        .nav-mobile { display: none; padding: 20px 24px; justify-content: space-between; align-items: center; }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .nav-mobile { display: flex; }
          .right-panel { padding: 20px 24px 60px; }
        }
      `}</style>

      <div className="cursor" id="cursor"></div>
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Mobile nav */}
      <div className="nav-mobile">
        <Link href="/" style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', background: 'linear-gradient(90deg, #2EB3BE, #7debea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>GIIS HACKATHON // 2K26</Link>
        <Link href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#8db4c8', textDecoration: 'none' }}>← Home</Link>
      </div>

      <div className="page">
        {/* LEFT */}
        <div className="left-panel">
          <Link href="/" className="panel-logo">GIIS HACKATHON // 2K26</Link>

          <div className="panel-hero">
            <div className="panel-tag">// 2026 Edition</div>
            <h1 className="panel-title">
              48 Hours. <span>Infinite Possibilities.</span>
            </h1>
            <p className="panel-desc">
              Join hundreds of student builders, designers, and innovators for Singapore&apos;s most exciting student hackathon. Build something that matters.
            </p>
          </div>

          <div className="panel-features">
            <div className="panel-feat"><div className="feat-icon">⚡</div> Real pairwise judging — fairer than rubrics</div>
            <div className="panel-feat"><div className="feat-icon">🔗</div> GitHub + demo submission in one place</div>
            <div className="panel-feat"><div className="feat-icon">📱</div> QR check-in for events & food collection</div>
            <div className="panel-feat"><div className="feat-icon">🏆</div> $1,000+ in prizes across all tracks</div>
            <div className="panel-dates">31 JULY – 1 AUGUST 2026 · GIIS SMART CAMPUS · SINGAPORE</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          <div className="auth-card">
            <div className="card-tag">// Participant Portal</div>
            <div className="card-title">Welcome Back</div>

            {success && <div className="success-box">✓ {success}</div>}
            {error && <div className="error-box">⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@giis.com.sg" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="forgot"><a href="#">Forgot password?</a></div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : '→ Sign In'}
              </button>
            </form>

            <div className="divider">or</div>

            <button className="btn-sso" onClick={() => alert('School SSO coming soon!')}>
              🏫 Sign in with School SSO
            </button>

            <p className="form-hint">
              No account? <Link href="/register">Register for the hackathon</Link>
            </p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const cursor = document.getElementById('cursor');
        if (cursor) {
          document.addEventListener('mousemove', e => { cursor.style.left = e.clientX+'px'; cursor.style.top = e.clientY+'px'; });
          document.querySelectorAll('a,button,input').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('big'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
          });
        }
      `}} />
    </>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#030d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Orbitron', monospace", color: '#2EB3BE', fontSize: '0.8rem', letterSpacing: '3px' }}>LOADING...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
