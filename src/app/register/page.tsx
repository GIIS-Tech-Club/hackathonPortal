'use client';
// src/app/register/page.tsx
// GIIS Hackathon 2K26 — Registration Page
// Replace the existing src/app/register/page.tsx with this file

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2-step form
  const router = useRouter();

  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !grade) {
      setError('Please fill in all fields before continuing.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) { setError('Please enter and confirm your password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    try {
      setLoading(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName.trim()} ${lastName.trim()}`, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed.');
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-body); background: var(--bg); color: var(--text); min-height: 100vh; cursor: none; overflow-x: hidden; }
        a, button, input, select { cursor: none; }

        .cursor { position: fixed; width: 18px; height: 18px; border: 2px solid var(--accent); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%,-50%); transition: width .2s, height .2s, background .2s; mix-blend-mode: screen; }
        .cursor.big { width: 36px; height: 36px; background: rgba(46,179,190,0.1); border-color: var(--accent-2); }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(46,179,190,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(46,179,190,0.04) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0; }
        .orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.3; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #0b6279, transparent 70%); top: -150px; right: -150px; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, #04304C, transparent 70%); bottom: 0; left: -100px; }

        .page { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }

        /* NAV */
        .nav { padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; }
        .nav-logo { font-family: var(--font-head); font-size: 0.78rem; font-weight: 700; letter-spacing: 2px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none; }
        .nav-back { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); text-decoration: none; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
        .nav-back:hover { color: var(--accent-2); }

        /* MAIN */
        .main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 24px 60px; }

        .auth-card {
          width: min(100%, 500px);
          background: rgba(4,25,46,0.95);
          border: 1px solid var(--border); border-radius: 16px;
          padding: 44px 40px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(46,179,190,0.06);
          animation: slideUp 0.5s ease both;
        }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform:none; } }

        .card-tag { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 3px; color: var(--accent); text-transform: uppercase; margin-bottom: 6px; }
        .card-title { font-family: var(--font-head); font-size: 1.7rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; }
        .card-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 32px; line-height: 1.5; }

        /* STEP INDICATOR */
        .steps { display: flex; align-items: center; gap: 0; margin-bottom: 32px; }
        .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; flex-shrink: 0; transition: all 0.3s; }
        .step-dot.active { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--bg); box-shadow: 0 0 16px rgba(46,179,190,0.4); }
        .step-dot.done { background: rgba(46,179,190,0.2); color: var(--accent); border: 1px solid var(--accent); }
        .step-dot.inactive { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); }
        .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 8px; }
        .step-label { font-family: var(--font-mono); font-size: 0.55rem; color: var(--text-muted); letter-spacing: 1px; margin-top: 4px; text-align: center; text-transform: uppercase; }
        .step-wrap { display: flex; flex-direction: column; align-items: center; }

        /* FORM */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { margin-bottom: 18px; }
        .form-label { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 2px; color: var(--accent-2); text-transform: uppercase; margin-bottom: 7px; display: block; }
        .form-input {
          width: 100%; background: rgba(4,48,76,0.4); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px 14px; color: var(--text);
          font-family: var(--font-body); font-size: 0.98rem; outline: none;
          transition: all 0.25s;
        }
        .form-input:focus { border-color: var(--accent); background: rgba(11,98,121,0.25); box-shadow: 0 0 16px rgba(46,179,190,0.12); }
        .form-input::placeholder { color: rgba(141,180,200,0.35); }

        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%232EB3BE' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
        }
        select.form-input option { background: #04192e; }

        /* PASSWORD STRENGTH */
        .pwd-bar { display: flex; gap: 4px; margin-top: 8px; }
        .pwd-seg { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.08); transition: background 0.3s; }
        .pwd-seg.weak { background: #ef4444; }
        .pwd-seg.fair { background: #f59e0b; }
        .pwd-seg.good { background: var(--accent); }
        .pwd-seg.strong { background: var(--accent-2); }
        .pwd-hint { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-muted); margin-top: 5px; letter-spacing: 0.5px; }

        /* ERROR */
        .error-box {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px; padding: 12px 14px; margin-bottom: 18px;
          font-size: 0.88rem; color: #fca5a5; line-height: 1.5;
        }

        /* BUTTONS */
        .btn-primary {
          width: 100%; font-family: var(--font-head); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: var(--bg); background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
          border: none; padding: 14px; border-radius: 8px;
          transition: all 0.25s; margin-top: 4px;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(46,179,190,0.35); }
        .btn-primary:disabled { opacity: 0.5; }

        .btn-secondary {
          width: 100%; font-family: var(--font-head); font-size: 0.68rem;
          font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
          color: var(--accent); background: transparent;
          border: 1px solid var(--border); padding: 12px; border-radius: 8px;
          transition: all 0.25s; margin-top: 10px;
        }
        .btn-secondary:hover { border-color: var(--accent); background: rgba(46,179,190,0.05); }

        .form-hint { font-family: var(--font-body); font-size: 0.82rem; color: var(--text-muted); margin-top: 20px; text-align: center; }
        .form-hint a { color: var(--accent-2); text-decoration: none; }
        .form-hint a:hover { text-decoration: underline; }

        /* TERMS */
        .terms { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; }
        .terms-checkbox { width: 16px; height: 16px; accent-color: var(--accent); flex-shrink: 0; margin-top: 2px; }
        .terms-text { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }
        .terms-text a { color: var(--accent-2); text-decoration: none; }

        @media (max-width: 520px) {
          .auth-card { padding: 32px 24px; }
          .form-row { grid-template-columns: 1fr; }
          .card-title { font-size: 1.4rem; }
        }
      `}</style>

      <div className="cursor" id="cursor"></div>
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="page">
        <div className="nav">
          <Link href="/" className="nav-logo">GIIS HACKATHON // 2K26</Link>
          <Link href="/" className="nav-back">← Back to home</Link>
        </div>

        <div className="main">
          <div className="auth-card">
            <div className="card-tag">// Participant Portal</div>
            <div className="card-title">{step === 1 ? 'Join the Hackathon' : 'Secure Your Account'}</div>
            <p className="card-sub">
              {step === 1
                ? '31 July – 1 August 2026 · GIIS Smart Campus, Singapore'
                : 'Almost there — set a strong password to protect your account.'}
            </p>

            {/* Step Indicator */}
            <div className="steps">
              <div className="step-wrap">
                <div className={`step-dot ${step === 1 ? 'active' : 'done'}`}>{step > 1 ? '✓' : '1'}</div>
                <div className="step-label">Profile</div>
              </div>
              <div className="step-line"></div>
              <div className="step-wrap">
                <div className={`step-dot ${step === 2 ? 'active' : 'inactive'}`}>2</div>
                <div className="step-label">Security</div>
              </div>
            </div>

            {error && <div className="error-box">⚠ {error}</div>}

            {step === 1 ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" type="text" placeholder="e.g. Anuraag" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" type="text" placeholder="e.g. Vombatkere" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@giis.com.sg" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grade / Year</label>
                    <select className="form-input" value={grade} onChange={e => setGrade(e.target.value)}>
                      <option value="">Select grade</option>
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                      <option>Grade 10</option>
                      <option>Grade 11</option>
                      <option>Grade 12</option>
                      <option>External Participant</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">School / Org</label>
                    <input className="form-input" type="text" placeholder="e.g. GIIS" value={school} onChange={e => setSchool(e.target.value)} />
                  </div>
                </div>
                <button className="btn-primary" onClick={handleNext}>Continue →</button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input" type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <div className="pwd-bar">
                    {[0,1,2,3].map(i => {
                      const len = password.length;
                      const level = len === 0 ? -1 : len < 6 ? 0 : len < 8 ? 1 : len < 12 ? 2 : 3;
                      const cls = i <= level ? (level === 0 ? 'weak' : level === 1 ? 'fair' : level === 2 ? 'good' : 'strong') : '';
                      return <div key={i} className={`pwd-seg ${cls}`}></div>;
                    })}
                  </div>
                  <div className="pwd-hint">
                    {password.length === 0 ? 'Enter a password' : password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair — add more characters' : password.length < 12 ? 'Good strength' : 'Strong password ✓'}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="form-input" type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ borderColor: confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.5)' : '' }}
                  />
                </div>
                <div className="terms">
                  <input type="checkbox" className="terms-checkbox" id="terms" required />
                  <label htmlFor="terms" className="terms-text">
                    I agree to the <a href="#">Code of Conduct</a> and <a href="#">Privacy Policy</a>. I confirm my information is accurate.
                  </label>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating account...' : '⚡ Create Account'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setStep(1); setError(''); }}>
                  ← Back
                </button>
              </form>
            )}

            <p className="form-hint">
              Already have an account? <Link href="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const cursor = document.getElementById('cursor');
        if (cursor) {
          document.addEventListener('mousemove', e => { cursor.style.left = e.clientX+'px'; cursor.style.top = e.clientY+'px'; });
          document.querySelectorAll('a,button,input,select').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('big'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
          });
        }
      `}} />
    </>
  );
}
