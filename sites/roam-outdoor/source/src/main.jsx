import React from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './styles.css';
import './controls.css';
import App from './App';

function GrayScene() {
  return <div className="app gray-mode">
    <header className="site-header"><strong>ROAM 山行</strong><span className="mono">PROPORTION STUDY / 01</span></header>
    <main className="showroom">
      <div className="room-architecture"><div className="room-wall"/><div className="room-side left"/><div className="room-side right"/><div className="room-floor"/></div>
      <div className="room-brand"><span className="wordmark">ROAM</span><span className="mono">LESS CITY. MORE TRAIL.</span></div>
      <div className="clothing-rack"><div className="rail"/>{Array.from({ length: 7 }, (_,i) => <div className="gray-garment" key={i} style={{left:`${8+i*14}%`}}/>)}</div>
    </main>
    <footer className="site-footer"><span className="mono">VIRTUAL OUTFITTER</span><div className="gray-dock">展厅 · 冲锋衣 · 帽饰 · 背包 · 徒步鞋</div><span className="mono">2026 COLLECTION</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(new URLSearchParams(location.search).has('gray') ? <GrayScene /> : <App />);
