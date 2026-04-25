// src/app/page.tsx
// GIIS Hackathon 2K26 — Landing Page
// Replace the existing src/app/page.tsx with this file

import Link from 'next/link';

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg: #030d1a;
          --bg-alt: #04304C;
          --accent: #2EB3BE;
          --accent-2: #7debea;
          --accent-dark: #0b6279;
          --text: #ffffff;
          --text-muted: #8db4c8;
          --border: rgba(46,179,190,0.25);
          --panel: rgba(11,98,121,0.12);
          --font-head: 'Orbitron', monospace;
          --font-body: 'Rajdhani', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: var(--font-body);
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
          cursor: none;
        }
        a, button, input, select, textarea { cursor: none; }

        .cursor {
          position: fixed; width: 18px; height: 18px;
          border: 2px solid var(--accent); border-radius: 50%;
          pointer-events: none; z-index: 99999;
          transform: translate(-50%,-50%);
          transition: width .2s, height .2s, background .2s, border-color .2s;
          mix-blend-mode: screen;
        }
        .cursor.big {
          width: 40px; height: 40px;
          background: rgba(46,179,190,0.1);
          border-color: var(--accent-2);
        }

        .grid-bg {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(46,179,190,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,179,190,0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none; z-index: 0;
        }

        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.35;
        }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #0b6279 0%, transparent 70%); top: -200px; right: -200px; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #04304C 0%, transparent 70%); bottom: 100px; left: -100px; }

        .scanline {
          position: fixed; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px);
          pointer-events: none; z-index: 9998;
        }

        .scroll-progress {
          position: fixed; top: 0; left: 0; height: 2px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          z-index: 9999; width: 0%; transition: width 0.1s;
        }

        /* NAV */
        nav {
          position: fixed; top: 16px; left: 50%;
          transform: translateX(-50%);
          width: min(95%, 1200px);
          background: rgba(3,13,26,0.8);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 50px;
          padding: 12px 28px;
          display: flex; align-items: center; justify-content: space-between;
          z-index: 1000; transition: all 0.3s;
        }
        nav.scrolled { box-shadow: 0 8px 40px rgba(0,0,0,0.5); }

        .nav-logo {
          font-family: var(--font-head);
          font-size: 0.8rem; font-weight: 700; letter-spacing: 2px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          text-decoration: none;
        }

        .nav-links { display: flex; gap: 4px; list-style: none; align-items: center; }
        .nav-links a {
          font-family: var(--font-head); font-size: 0.62rem;
          letter-spacing: 1.5px; color: var(--text-muted);
          text-decoration: none; padding: 6px 14px;
          border-radius: 20px; border: 1px solid transparent;
          transition: all 0.25s; text-transform: uppercase;
        }
        .nav-links a:hover {
          color: var(--text); border-color: var(--border);
          background: rgba(46,179,190,0.08);
        }

        .nav-actions { display: flex; gap: 10px; align-items: center; }

        .btn-nav-secondary {
          font-family: var(--font-head); font-size: 0.62rem;
          font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
          text-decoration: none; color: var(--accent);
          background: transparent; padding: 7px 18px;
          border: 1px solid var(--accent); border-radius: 20px;
          transition: all 0.25s; white-space: nowrap;
        }
        .btn-nav-secondary:hover { background: rgba(46,179,190,0.1); }

        .btn-nav-primary {
          font-family: var(--font-head); font-size: 0.62rem;
          font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          text-decoration: none; color: var(--bg);
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          padding: 8px 20px; border-radius: 20px;
          transition: all 0.25s; white-space: nowrap; border: none;
        }
        .btn-nav-primary:hover { opacity: 0.85; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(46,179,190,0.3); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 120px 24px 100px;
          position: relative; z-index: 1;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 0.68rem;
          color: var(--accent-2);
          border: 1px solid rgba(125,235,234,0.3);
          background: rgba(125,235,234,0.05);
          padding: 6px 16px; border-radius: 20px;
          margin-bottom: 32px; letter-spacing: 2px; text-transform: uppercase;
          animation: fadeUp 0.8s ease 0.1s both;
        }
        .hero-badge-dot { color: var(--accent); animation: pulse 2s infinite; }

        .hero-title {
          font-family: var(--font-head);
          font-size: clamp(3.5rem, 9vw, 8rem);
          font-weight: 900; line-height: 0.95;
          letter-spacing: -2px; margin-bottom: 4px;
          animation: fadeUp 0.8s ease 0.25s both;
        }
        .hero-title .line1 { color: #fff; display: block; }
        .hero-title .line2 {
          display: block;
          background: linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .hero-tagline {
          font-family: var(--font-mono); font-size: 0.75rem;
          color: var(--accent-dark); letter-spacing: 4px;
          text-transform: uppercase; margin-top: 12px;
          animation: fadeUp 0.8s ease 0.35s both;
        }

        .hero-sub {
          font-family: var(--font-body);
          font-size: clamp(1rem, 2.5vw, 1.35rem);
          color: var(--text-muted); margin-top: 24px;
          max-width: 580px; line-height: 1.65;
          animation: fadeUp 0.8s ease 0.45s both;
        }
        .hero-sub em { color: var(--accent-2); font-style: normal; font-weight: 600; }

        .hero-actions {
          display: flex; gap: 14px; margin-top: 40px;
          flex-wrap: wrap; justify-content: center;
          animation: fadeUp 0.8s ease 0.55s both;
        }

        .btn-primary {
          font-family: var(--font-head); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          text-decoration: none; color: var(--bg);
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
          padding: 14px 32px; border-radius: 4px;
          clip-path: polygon(10px 0%, 100% 0%, calc(100%-10px) 100%, 0% 100%);
          border: none; transition: all 0.25s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover {
          opacity: 0.9; transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(46,179,190,0.4);
        }

        .btn-outline {
          font-family: var(--font-head); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          text-decoration: none; color: var(--accent);
          background: transparent; padding: 13px 32px;
          border: 1px solid var(--accent); border-radius: 4px;
          clip-path: polygon(10px 0%, 100% 0%, calc(100%-10px) 100%, 0% 100%);
          transition: all 0.25s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-outline:hover { background: rgba(46,179,190,0.1); transform: translateY(-2px); }

        /* COUNTDOWN */
        .countdown-wrap {
          margin-top: 56px;
          animation: fadeUp 0.8s ease 0.65s both;
        }
        .countdown-label {
          font-family: var(--font-mono); font-size: 0.62rem;
          letter-spacing: 3px; color: var(--text-muted);
          text-transform: uppercase; margin-bottom: 16px;
        }
        .countdown { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cd-unit {
          display: flex; flex-direction: column; align-items: center;
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 8px; padding: 16px 20px; min-width: 78px;
          backdrop-filter: blur(10px);
        }
        .cd-num {
          font-family: var(--font-head); font-size: 2rem; font-weight: 900;
          background: linear-gradient(180deg, #fff 0%, var(--accent-2) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .cd-label {
          font-family: var(--font-mono); font-size: 0.55rem;
          color: var(--text-muted); letter-spacing: 2px;
          text-transform: uppercase; margin-top: 4px;
        }

        .hero-dates {
          margin-top: 20px;
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--text-muted); letter-spacing: 2px;
          animation: fadeUp 0.8s ease 0.75s both;
        }
        .hero-dates span { color: var(--accent-2); }

        /* STATS */
        .stats-section { position: relative; z-index: 1; padding: 0 24px 80px; }
        .stats-bar {
          display: flex; justify-content: center;
          max-width: 900px; margin: 0 auto;
          border: 1px solid var(--border); border-radius: 12px;
          overflow: hidden; backdrop-filter: blur(10px);
          background: rgba(4,48,76,0.3);
        }
        .stat-item {
          flex: 1; text-align: center; padding: 28px 20px;
          border-right: 1px solid var(--border); transition: background 0.3s;
        }
        .stat-item:last-child { border-right: none; }
        .stat-item:hover { background: rgba(46,179,190,0.06); }
        .stat-num {
          font-family: var(--font-head); font-size: 1.9rem; font-weight: 900;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .stat-desc {
          font-family: var(--font-body); font-size: 0.82rem;
          color: var(--text-muted); margin-top: 4px;
          letter-spacing: 1px; text-transform: uppercase; font-weight: 500;
        }

        /* GENERIC SECTION */
        .section {
          position: relative; z-index: 1;
          padding: 80px 24px;
          max-width: 1200px; margin: 0 auto;
        }

        .section-label {
          font-family: var(--font-mono); font-size: 0.68rem;
          letter-spacing: 3px; color: var(--accent);
          text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .section-label::before { content: '//'; opacity: 0.5; }

        .section-title {
          font-family: var(--font-head);
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 700; letter-spacing: 1px; margin-bottom: 48px;
        }
        .section-title span {
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* CARDS */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
          gap: 18px;
        }

        .feature-card {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 12px; padding: 30px;
          transition: all 0.4s cubic-bezier(.25,.8,.25,1);
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover { transform: translateY(-6px); border-color: rgba(46,179,190,0.5); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { font-size: 1.8rem; margin-bottom: 14px; display: block; }
        .feature-title {
          font-family: var(--font-head); font-size: 0.82rem;
          font-weight: 700; letter-spacing: 1px; margin-bottom: 10px;
          color: var(--accent-2);
        }
        .feature-desc { font-size: 0.92rem; color: var(--text-muted); line-height: 1.6; }

        /* TRACKS */
        .tracks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        .track-card {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 12px; padding: 32px;
          transition: all 0.4s;
          position: relative; overflow: hidden;
        }
        .track-card::after {
          content: ''; position: absolute;
          inset: 0; border-radius: 12px;
          background: linear-gradient(135deg, rgba(46,179,190,0.05), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .track-card:hover { transform: translateY(-4px) scale(1.01); border-color: rgba(46,179,190,0.5); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .track-card:hover::after { opacity: 1; }
        .track-num {
          font-family: var(--font-mono); font-size: 0.62rem;
          color: var(--accent-dark); letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 12px;
        }
        .track-icon { font-size: 2.2rem; margin-bottom: 12px; display: block; }
        .track-name {
          font-family: var(--font-head); font-size: 0.88rem;
          font-weight: 700; letter-spacing: 1px;
          color: var(--accent-2); margin-bottom: 10px;
        }
        .track-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; }

        /* TIMELINE */
        .tl-wrap { position: relative; padding-left: 32px; }
        .tl-wrap::before {
          content: ''; position: absolute;
          left: 0; top: 8px; bottom: 8px; width: 2px;
          background: linear-gradient(to bottom, var(--accent), transparent);
        }
        .tl-item {
          padding: 0 0 36px 28px; position: relative;
          opacity: 0; transform: translateX(-16px);
          transition: all 0.5s ease;
        }
        .tl-item.visible { opacity: 1; transform: none; }
        .tl-item::before {
          content: ''; position: absolute;
          left: -5px; top: 6px;
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 12px var(--accent);
        }
        .tl-date {
          font-family: var(--font-mono); font-size: 0.65rem;
          color: var(--accent); letter-spacing: 2px;
          text-transform: uppercase; margin-bottom: 4px;
        }
        .tl-name {
          font-family: var(--font-head); font-size: 0.88rem;
          font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;
        }
        .tl-desc { font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; }

        /* FAQ */
        .faq-list { display: flex; flex-direction: column; gap: 10px; }
        .faq-card {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 10px; padding: 20px 24px;
          transition: all 0.3s;
        }
        .faq-card.open { border-color: rgba(46,179,190,0.5); }
        .faq-q {
          display: flex; justify-content: space-between; align-items: center;
          font-family: var(--font-head); font-size: 0.82rem;
          letter-spacing: 0.5px; cursor: none;
        }
        .faq-icon { font-size: 1.2rem; color: var(--accent); flex-shrink: 0; margin-left: 16px; }
        .faq-a {
          max-height: 0; overflow: hidden;
          font-size: 0.9rem; color: var(--text-muted);
          line-height: 1.65; transition: max-height 0.35s ease, margin-top 0.35s;
        }
        .faq-card.open .faq-a { max-height: 200px; margin-top: 12px; }

        /* CTA */
        .cta-section {
          position: relative; z-index: 1;
          padding: 80px 24px 120px; text-align: center;
        }
        .cta-inner {
          max-width: 700px; margin: 0 auto;
          background: linear-gradient(135deg, rgba(4,48,76,0.6), rgba(11,98,121,0.3));
          border: 1px solid var(--border); border-radius: 20px;
          padding: 60px 40px;
          position: relative; overflow: hidden;
        }
        .cta-inner::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-2), transparent);
        }
        .cta-title {
          font-family: var(--font-head); font-size: clamp(1.6rem, 4vw, 2.5rem);
          font-weight: 900; letter-spacing: 1px; margin-bottom: 16px;
        }
        .cta-sub { font-size: 1rem; color: var(--text-muted); margin-bottom: 36px; line-height: 1.6; }
        .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* FOOTER */
        .footer-wrap {
          position: relative; z-index: 1;
          border-top: 1px solid var(--border);
          padding: 36px 24px;
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .footer-brand {
          font-family: var(--font-head); font-size: 0.72rem;
          letter-spacing: 2px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .footer-links { display: flex; gap: 20px; list-style: none; }
        .footer-links a {
          font-family: var(--font-mono); font-size: 0.62rem;
          color: var(--text-muted); text-decoration: none;
          letter-spacing: 1px; text-transform: uppercase; transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--accent-2); }
        .footer-copy { font-family: var(--font-mono); font-size: 0.6rem; color: rgba(141,180,200,0.5); letter-spacing: 1px; }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        @media (max-width: 700px) {
          nav { top: 0; border-radius: 0; width: 100%; }
          .nav-links { display: none; }
          .stats-bar { flex-direction: column; }
          .stat-item { border-right: none; border-bottom: 1px solid var(--border); }
          .stat-item:last-child { border-bottom: none; }
          .footer-inner { flex-direction: column; text-align: center; }
          .footer-links { justify-content: center; }
        }
      `}</style>

      <div className="cursor" id="cursor"></div>
      <div className="grid-bg"></div>
      <div className="scanline"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="scroll-progress" id="scrollProgress"></div>

      {/* NAV */}
      <nav id="mainNav">
        <Link href="/" className="nav-logo">GIIS HACKATHON // 2K26</Link>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#tracks">Tracks</a></li>
          <li><a href="#timeline">Timeline</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="btn-nav-secondary">Sign In</Link>
          <Link href="/register" className="btn-nav-primary">Register →</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot">●</span>
          GIIS Singapore · Official Portal · 2026
        </div>
        <h1 className="hero-title">
          <span className="line1">HACKATHON</span>
          <span className="line2">2K26</span>
        </h1>
        <div className="hero-tagline">Innovate · Initiate · Inspire</div>
        <p className="hero-sub">
          <em>48 hours</em> to transform ideas into solutions. Build anything, learn everything.
          Open to students across Singapore.
        </p>
        <div className="hero-actions">
          <Link href="/register" className="btn-primary">⚡ Register Now</Link>
          <Link href="/login" className="btn-outline">→ Sign In</Link>
        </div>
        <div className="countdown-wrap">
          <div className="countdown-label">// Event begins in</div>
          <div className="countdown">
            <div className="cd-unit"><div className="cd-num" id="cd-days">--</div><div className="cd-label">Days</div></div>
            <div className="cd-unit"><div className="cd-num" id="cd-hrs">--</div><div className="cd-label">Hours</div></div>
            <div className="cd-unit"><div className="cd-num" id="cd-min">--</div><div className="cd-label">Mins</div></div>
            <div className="cd-unit"><div className="cd-num" id="cd-sec">--</div><div className="cd-label">Secs</div></div>
          </div>
        </div>
        <div className="hero-dates">
          <span>31 July – 1 August 2026</span> · GIIS Smart Campus, Singapore
        </div>
      </div>

      {/* STATS */}
      <div className="stats-section">
        <div className="stats-bar reveal">
          <div className="stat-item"><div className="stat-num">48H</div><div className="stat-desc">Hack Duration</div></div>
          <div className="stat-item"><div className="stat-num">$1K+</div><div className="stat-desc">Prize Pool</div></div>
          <div className="stat-item"><div className="stat-num">200+</div><div className="stat-desc">Participants</div></div>
          <div className="stat-item"><div className="stat-num">4</div><div className="stat-desc">Tracks</div></div>
        </div>
      </div>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="reveal">
          <div className="section-label">About the Event</div>
          <h2 className="section-title">What is <span>GIIS Hackathon</span> 2K26?</h2>
        </div>
        <div className="features-grid">
          {[
            { icon: '🚀', title: 'Build Anything', desc: 'From AI apps to IoT — if you can imagine it, build it. We provide the space, you bring the creativity.' },
            { icon: '🤝', title: 'Team Up', desc: 'Form teams of up to 4. Find teammates via the portal, or bring your crew.' },
            { icon: '🏆', title: 'Win Big', desc: 'Compete for cash prizes, recognition from sponsors, and a place in GIIS history.' },
            { icon: '🎓', title: 'Learn Fast', desc: 'Workshops, mentor sessions, and expert talks packed into 48 hours of building.' },
            { icon: '🔗', title: 'Hack Club Network', desc: 'Affiliated with Hack Club — join a global community of student builders and makers.' },
            { icon: '⚡', title: 'Non-Profit Spirit', desc: 'Operated as a non-profit via Hack Club Bank. All funds go directly into the event.' },
          ].map((f, i) => (
            <div key={i} className={`feature-card reveal reveal-delay-${(i % 3) + 1}`}>
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKS */}
      <section id="tracks" className="section">
        <div className="reveal">
          <div className="section-label">Competition Tracks</div>
          <h2 className="section-title">Choose Your <span>Track</span></h2>
        </div>
        <div className="tracks-grid">
          {[
            { num: 'TRACK 01', icon: '🧠', name: 'AI & Machine Learning', desc: 'Build intelligent systems. LLMs, computer vision, or custom ML models solving real-world problems.' },
            { num: 'TRACK 02', icon: '🌐', name: 'Web & Mobile', desc: 'Create apps that matter. Web platforms and mobile applications that live in browsers or pockets.' },
            { num: 'TRACK 03', icon: '🌱', name: 'Sustainability Tech', desc: 'Tech for good. Climate, environment, social impact — build something that helps the planet.' },
            { num: 'TRACK 04', icon: '🎮', name: 'Open Innovation', desc: 'No constraints. Game dev, hardware hacks, creative tech — if it\'s unique, it belongs here.' },
          ].map((t, i) => (
            <div key={i} className={`track-card reveal reveal-delay-${i + 1}`}>
              <div className="track-num">{t.num}</div>
              <span className="track-icon">{t.icon}</span>
              <div className="track-name">{t.name}</div>
              <div className="track-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section id="timeline" className="section">
        <div className="reveal">
          <div className="section-label">Event Schedule</div>
          <h2 className="section-title">How It <span>Unfolds</span></h2>
        </div>
        <div className="tl-wrap">
          {[
            { date: 'June 2026 · Registration Opens', name: 'PARTICIPANT REGISTRATION', desc: 'Sign up, form your team, and receive your unique QR code for event access and check-in.' },
            { date: 'July 15 · Teams Locked', name: 'TEAM SUBMISSION DEADLINE', desc: 'Finalize your team of 2–4. All members must be registered through the portal.' },
            { date: 'July 31 · 09:00 SGT', name: 'OPENING CEREMONY & CHECK-IN', desc: 'QR code check-in, sponsor showcases, and the official problem statement reveal.' },
            { date: 'July 31 · 11:00 SGT', name: 'HACKING BEGINS ⚡', desc: '48 hours on the clock. Build fast, iterate faster. Mentors available throughout.' },
            { date: 'August 1 · 11:00 SGT', name: 'PROJECT SUBMISSION DEADLINE', desc: 'Submit GitHub repo, demo link, and project description via the portal before time runs out.' },
            { date: 'August 1 · 13:00 SGT', name: 'DEMO & JUDGING', desc: 'Pairwise judging by industry experts and alumni. Top teams present on stage.' },
            { date: 'August 1 · 16:00 SGT', name: 'CLOSING CEREMONY & PRIZES', desc: 'Winners announced, prizes distributed, group photos. Celebrate what you built.' },
          ].map((t, i) => (
            <div key={i} className="tl-item">
              <div className="tl-date">{t.date}</div>
              <div className="tl-name">{t.name}</div>
              <div className="tl-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="reveal">
          <div className="section-label">Frequently Asked Questions</div>
          <h2 className="section-title">Got <span>Questions?</span></h2>
        </div>
        <div className="faq-list reveal">
          {[
            { q: 'Who can participate?', a: 'Currently open to all GIIS students and external participants. Teams of 2–4 people. Solo registrations are not accepted.' },
            { q: 'Is it free to participate?', a: 'Yes — completely free for all participants, funded by our sponsors and operated as a non-profit through Hack Club Bank.' },
            { q: 'What should I bring?', a: 'Laptop, charger, student ID, and your hacker mindset. We provide WiFi, power strips, food & drinks, and a space to crash.' },
            { q: 'Can I start coding before the event?', a: 'No pre-built projects. All code must be written during the 48-hour window. Using open-source libraries and public APIs is fine.' },
            { q: 'How are projects judged?', a: 'We use a pairwise comparison judging system. Judges compare two projects at a time, making the process fair and scalable. Results are computed algorithmically to rank all teams.' },
            { q: 'What if I don\'t have a team?', a: 'Register solo and use the team-finding feature in the portal. We\'ll also host a team formation session at the opening ceremony.' },
          ].map((f, i) => (
            <div key={i} className="faq-card" id={`faq-${i}`}>
              <div className="faq-q" onClick={() => {
                const card = document.getElementById(`faq-${i}`);
                card?.classList.toggle('open');
              }}>
                {f.q}
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-inner reveal">
          <h2 className="cta-title">Ready to <span style={{ background: 'linear-gradient(90deg, #2EB3BE, #7debea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Build?</span></h2>
          <p className="cta-sub">Registration is open. Form your team, grab your QR code, and show up ready to hack. Spots are limited.</p>
          <div className="cta-actions">
            <Link href="/register" className="btn-primary">⚡ Register Now</Link>
            <Link href="/login" className="btn-outline">→ Sign In</Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer-wrap">
        <div className="footer-inner">
          <div className="footer-brand">GIIS TECH CLUB // HACKATHON 2K26</div>
          <ul className="footer-links">
            <li><a href="https://www.instagram.com/giistechclub/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="http://github.com/orgs/GIIS-Tech-Club/repositories" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="http://hcb.hackclub.com/tech-club/" target="_blank" rel="noopener noreferrer">HCB</a></li>
            <li><a href="mailto:support@giistech.club">Contact</a></li>
          </ul>
          <div className="footer-copy">© 2026 GIIS Tech Club. Non-profit via Hack Club Bank.</div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // Cursor
        const cursor = document.getElementById('cursor');
        if (cursor) {
          document.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
          });
          document.querySelectorAll('a,button,input,.feature-card,.track-card,.faq-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('big'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
          });
        }

        // Scroll progress
        window.addEventListener('scroll', () => {
          const p = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          const bar = document.getElementById('scrollProgress');
          if (bar) bar.style.width = p + '%';
          const nav = document.getElementById('mainNav');
          if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
        });

        // Countdown — target: July 31 2026 09:00 SGT
        const target = new Date('2026-07-31T09:00:00+08:00');
        function updateCD() {
          const diff = target - new Date();
          if (diff <= 0) { ['cd-days','cd-hrs','cd-min','cd-sec'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent='00'; }); return; }
          const d = Math.floor(diff/86400000);
          const h = Math.floor((diff%86400000)/3600000);
          const m = Math.floor((diff%3600000)/60000);
          const s = Math.floor((diff%60000)/1000);
          const pad = n => String(n).padStart(2,'0');
          ['cd-days','cd-hrs','cd-min','cd-sec'].forEach((id,i) => {
            const el = document.getElementById(id);
            if(el) el.textContent = pad([d,h,m,s][i]);
          });
        }
        updateCD(); setInterval(updateCD, 1000);

        // Reveal on scroll
        const obs = new IntersectionObserver(entries => {
          entries.forEach(en => { if(en.isIntersecting) en.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal, .tl-item').forEach(el => obs.observe(el));

        // FAQ toggle
        document.querySelectorAll('.faq-card').forEach(card => {
          const q = card.querySelector('.faq-q');
          const icon = card.querySelector('.faq-icon');
          if (q) q.addEventListener('click', () => {
            card.classList.toggle('open');
            if (icon) icon.textContent = card.classList.contains('open') ? '−' : '+';
          });
        });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(a => {
          a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          });
        });
      `}} />
    </>
  );
}
