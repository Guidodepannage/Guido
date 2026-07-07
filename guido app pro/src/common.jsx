import React from 'react';
import { MessageSquare } from 'lucide-react';

/* Palette */
export const c = {
  ink: '#1B1E24', asphalt: '#23272E', paper: '#F4F3F1', surface: '#FFFFFF',
  amber: '#ED7014', amberDark: '#CF5D08', amberSoft: '#FCE9D6', hazard: '#F4B400',
  red: '#D23A2C', redSoft: '#FBE4E1', green: '#1E8E5A', greenSoft: '#E0F0E8',
  blue: '#2C5FB3', blueSoft: '#E4ECFA', line: '#E6E3DE', muted: '#6C7178',
};

/* Styles partagés */
export const fieldStyle = { width: '100%', padding: '12px 13px', borderRadius: 11, border: `1px solid ${c.line}`, background: c.surface, fontSize: 15, color: c.ink, outline: 'none' };
export const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: c.muted, marginBottom: 6 };
export const subLabel = { fontSize: 12, fontWeight: 600, color: c.muted, marginBottom: 7 };
export const chipRow = { display: 'flex', flexWrap: 'wrap', gap: 8 };

/* Constantes métier */
export const POS_TYPES = ['315/80 R22.5', '385/65 R22.5', '295/80 R22.5', '385/55 R22.5', '13 R22.5', '295/60 R22.5'];

export const MSTATUS = {
  envoyee:         { label: 'Demande envoyée', bg: c.amberSoft, fg: c.amberDark, dot: c.amber },
  assignee:        { label: 'Assignée',        bg: c.blueSoft,  fg: c.blue,      dot: c.blue },
  prise_en_charge: { label: 'Prise en charge', bg: c.greenSoft, fg: c.green,     dot: c.green },
  terminee:        { label: 'Terminée',        bg: c.line,      fg: c.muted,     dot: c.muted },
};
export const CLIENT_STEP = {
  envoyee:         { label: 'Demande de mission envoyée',         color: c.amber },
  assignee:        { label: 'Demande de mission envoyée',         color: c.amber },
  prise_en_charge: { label: 'Demande de mission prise en charge', color: c.green },
  terminee:        { label: 'Mission terminée',                   color: c.muted },
};
export const PREST_NEXT = {
  assignee:        { to: 'prise_en_charge', label: 'Valider la prise en charge' },
  prise_en_charge: { to: 'terminee',        label: 'Marquer terminée' },
};
export const TYPE_META = {
  client:      { label: 'Client',      bg: c.blueSoft,  fg: c.blue },
  prestataire: { label: 'Prestataire', bg: c.amberSoft, fg: c.amberDark },
  admin:       { label: 'Admin',       bg: c.line,      fg: c.ink },
};
export const STATUS_META = {
  invite:   { label: 'Invité',   bg: c.amberSoft, fg: c.amberDark, dot: c.amber },
  actif:    { label: 'Actif',    bg: c.greenSoft, fg: c.green,     dot: c.green },
  suspendu: { label: 'Suspendu', bg: c.redSoft,   fg: c.red,       dot: c.red },
};

/* Helpers */
export const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60); if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24); if (d === 1) return 'hier'; if (d < 30) return `il y a ${d} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
export function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const play = (f, s, d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + s);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d);
    };
    play(880, 0, 0.18); play(1174, 0.22, 0.28);
  } catch (_) {}
}

/* Atoms */
export function Badge({ meta, dot }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: meta.bg, color: meta.fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.dot }} />}{meta.label}
    </span>
  );
}
export function Plate({ value }) {
  return (
    <span className="num" style={{ display: 'inline-flex', border: `2px solid ${c.ink}`, borderRadius: 6, overflow: 'hidden', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em' }}>
      <span style={{ background: c.blue, color: '#fff', padding: '3px 5px', fontSize: 10, display: 'flex', alignItems: 'center', fontWeight: 800 }}>F</span>
      <span style={{ padding: '3px 9px', color: c.ink }}>{value || '—'}</span>
    </span>
  );
}
export function Pill({ status, client }) {
  if (client) {
    const m = CLIENT_STEP[status] || CLIENT_STEP.envoyee;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.paper, border: `1px solid ${c.line}`, color: c.ink, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: m.color }} />{m.label}
      </span>
    );
  }
  const m = MSTATUS[status] || MSTATUS.envoyee;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: m.bg, color: m.fg, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: m.dot }} />{m.label}
    </span>
  );
}
export function NoteBox({ text }) {
  return (
    <div style={{ display: 'flex', gap: 8, background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
      <MessageSquare size={16} color={c.amberDark} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 13, color: c.ink, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

export function GlobalStyle() {
  return (
    <style>{`
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; font-family: -apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background: ${c.asphalt}; }
      .num { font-family: ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric: tabular-nums; }
      button { cursor: pointer; font-family: inherit; }
      input, select, textarea { font-family: inherit; }
      button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid ${c.amber}; outline-offset: 2px; }
      main::-webkit-scrollbar { width: 0; }
      .pop { animation: pop .22s cubic-bezier(.2,.9,.3,1.15); }
      @keyframes pop { from { transform: scale(.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .flash { animation: flash 1s ease-in-out infinite; }
      @keyframes flash { 0%,100% { box-shadow: 0 0 0 0 rgba(210,58,44,0.5); } 50% { box-shadow: 0 0 0 8px rgba(210,58,44,0); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
    `}</style>
  );
}
