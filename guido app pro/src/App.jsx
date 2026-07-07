import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Send, MapPin, Phone, CheckCircle2, Navigation, Flag, Bell, Radio,
  LayoutDashboard, Users, Plus, Search, Copy, Check, Power, Trash2,
  LogOut, ShieldCheck, X, Mail, Clock, UserPlus, ClipboardList, KeyRound, BellRing
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { activerNotifications } from './push';
import {
  c, fieldStyle, labelStyle, subLabel, chipRow, POS_TYPES, PREST_NEXT,
  TYPE_META, STATUS_META, initials, timeAgo, beep,
  Badge, Plate, Pill, NoteBox, GlobalStyle,
} from './common.jsx';

/* Mappage base de données -> objets d'interface */
const mapMission = (r) => ({
  id: r.id, createdAt: new Date(r.created_at).getTime(),
  lieu: r.lieu, immat: r.immat, type: r.tyre_type, pos: r.tyre_position,
  tel: r.tel_chauffeur, message: r.message, status: r.status,
  assignedTo: r.assigned_to, assignedName: r.assigned_name,
  clientId: r.client_id, clientCompany: r.client_company,
});
const mapAccount = (p) => ({
  id: p.id, type: p.role, name: p.name, company: p.company,
  phone: p.phone, email: p.email, zone: p.zone, status: p.status,
  createdAt: new Date(p.created_at).getTime(),
});

/* ================================================================== */
/*  LOGIN (e-mail + mot de passe, pour tous les rôles)                */
/* ================================================================== */
function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) setErr('E-mail ou mot de passe incorrect.');
  };

  return (
    <div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 24, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: c.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={23} color="#fff" strokeWidth={2.2} /></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Guido</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>Dépannage poids lourd</div></div>
        </div>
        <div style={{ background: c.surface, borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><KeyRound size={18} color={c.amber} /><span style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>Connexion</span></div>
          <div style={{ marginBottom: 13 }}><label style={labelStyle}>Adresse e-mail</label>
            <input style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@societe.fr" onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
          <label style={labelStyle}>Mot de passe</label>
          <input type="password" style={fieldStyle} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          {err && <div style={{ color: c.red, fontSize: 13, marginTop: 8 }}>{err}</div>}
          <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: c.amber, color: '#fff', fontSize: 15, fontWeight: 800, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BIENVENUE (l'invité définit son mot de passe)                     */
/* ================================================================== */
function Bienvenue({ hasSession, onDone }) {
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (pass.length < 8) { setErr('8 caractères minimum.'); return; }
    if (pass !== pass2) { setErr('Les deux mots de passe diffèrent.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) { setBusy(false); setErr(error.message); return; }
    await supabase.rpc('activer_mon_compte');
    setBusy(false);
    onDone();
  };

  return (
    <div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 24, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: c.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={23} color="#fff" strokeWidth={2.2} /></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Bienvenue</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Activez votre compte Guido</div></div>
        </div>
        <div style={{ background: c.surface, borderRadius: 18, padding: 22 }}>
          {!hasSession ? (
            <div style={{ fontSize: 14, color: c.muted }}>
              Ce lien d'invitation n'est plus valide ou a expiré. Demandez un nouveau lien à Guido.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, color: c.muted, marginBottom: 16 }}>Choisissez votre mot de passe pour accéder à Guido.</div>
              <div style={{ marginBottom: 13 }}><label style={labelStyle}>Mot de passe</label>
                <input type="password" style={fieldStyle} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Au moins 8 caractères" /></div>
              <label style={labelStyle}>Confirmer</label>
              <input type="password" style={fieldStyle} value={pass2} onChange={(e) => setPass2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
              {err && <div style={{ color: c.red, fontSize: 13, marginTop: 8 }}>{err}</div>}
              <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: c.amber, color: '#fff', fontSize: 15, fontWeight: 800, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Activation…' : 'Activer mon compte'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CLIENT                                                            */
/* ================================================================== */
function ClientView({ missions, onSend }) {
  const [lieu, setLieu] = useState('');
  const [immat, setImmat] = useState('');
  const [type, setType] = useState('');
  const [element, setElement] = useState('');
  const [cote, setCote] = useState('');
  const [essieu, setEssieu] = useState(null);
  const [inout, setInout] = useState('');
  const [tel, setTel] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const needInout = element === 'Tracteur' && (essieu === 2 || essieu === 3);
  const pos = element && cote && essieu ? `${element} ${cote}${essieu}${needInout && inout ? ' ' + inout : ''}` : '';
  const valid = lieu.trim() && immat.trim() && type.trim() && tel.trim() && element && cote && essieu && (!needInout || inout);

  const send = async () => {
    setBusy(true);
    const ok = await onSend({ lieu: lieu.trim(), immat: immat.trim().toUpperCase(), type: type.trim(), pos, tel: tel.trim(), message: message.trim() });
    setBusy(false);
    if (ok) {
      setLieu(''); setImmat(''); setType(''); setTel(''); setElement(''); setCote(''); setEssieu(null); setInout(''); setMessage('');
      setSent(true); setTimeout(() => setSent(false), 2600);
    }
  };
  const chip = (label, active, onClick, key) => (
    <button key={key ?? label} onClick={onClick} style={{ padding: '9px 15px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: `1.5px solid ${active ? c.ink : c.line}`, background: active ? c.ink : c.surface, color: active ? '#fff' : c.ink }}>{label}</button>
  );
  const mine = [...missions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: c.ink }}>Nouvelle mission</h1>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: c.muted }}>Votre demande est transmise à Guido pour affectation.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16 }}>
        <div><label style={labelStyle}>Lieu du dépannage</label>
          <input style={fieldStyle} value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex. A6 sortie 14, aire de Nemours" /></div>
        <div><label style={labelStyle}>Immatriculation</label>
          <input style={{ ...fieldStyle, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'ui-monospace, Menlo, monospace' }} value={immat} onChange={(e) => setImmat(e.target.value.toUpperCase())} placeholder="AB-123-CD" /></div>
        <div><label style={labelStyle}>Type de pneu</label>
          <input style={fieldStyle} list="tp" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex. 315/80 R22.5" />
          <datalist id="tp">{POS_TYPES.map((t) => <option key={t} value={t} />)}</datalist></div>

        <div>
          <label style={labelStyle}>Position du pneu</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><div style={subLabel}>Élément</div><div style={chipRow}>
              {chip('Tracteur', element === 'Tracteur', () => setElement('Tracteur'))}
              {chip('Remorque', element === 'Remorque', () => { setElement('Remorque'); setInout(''); })}
            </div></div>
            <div><div style={subLabel}>Côté</div><div style={chipRow}>
              {chip('Gauche', cote === 'G', () => setCote('G'))}
              {chip('Droite', cote === 'D', () => setCote('D'))}
            </div></div>
            <div><div style={subLabel}>N° d'essieu</div><div style={chipRow}>
              {[1, 2, 3].map((n) => chip(String(n), essieu === n, () => setEssieu(n), n))}
            </div></div>
            {needInout && (
              <div className="pop"><div style={subLabel}>Roue (essieu jumelé)</div><div style={chipRow}>
                {chip('Intérieur', inout === 'Int', () => setInout('Int'))}
                {chip('Extérieur', inout === 'Ext', () => setInout('Ext'))}
              </div></div>
            )}
            {pos && <div style={{ fontSize: 13, color: c.muted, background: c.paper, borderRadius: 9, padding: '9px 11px' }}>Position retenue : <b className="num" style={{ color: c.ink }}>{pos}</b></div>}
          </div>
        </div>

        <div><label style={labelStyle}>Téléphone du chauffeur</label>
          <input type="tel" inputMode="tel" style={fieldStyle} value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78" /></div>

        <div><label style={labelStyle}>Message / spécificité (optionnel)</label>
          <textarea rows={3} style={{ ...fieldStyle, resize: 'vertical', minHeight: 74, lineHeight: 1.5 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex. Camion en sous-sol, accès poids lourd difficile, pneu déjà démonté…" /></div>

        <button onClick={send} disabled={!valid || busy} style={{ marginTop: 2, width: '100%', padding: '15px', borderRadius: 13, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <Send size={19} strokeWidth={2.4} /> {busy ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>

      {sent && <div className="pop" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 9, background: c.greenSoft, color: c.green, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={18} /> Demande envoyée à Guido</div>}

      {mine.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Mes missions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mine.map((m) => (
              <div key={m.id} style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '13px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><Plate value={m.immat} /><Pill status={m.status} client /></div>
                <div style={{ marginTop: 9, fontSize: 13.5, color: c.ink, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} color={c.muted} /> {m.lieu}</div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: c.muted }}>{m.type} · {m.pos} · <span className="num">{timeAgo(m.createdAt)}</span>{m.assignedName && <> · prestataire <b style={{ color: c.green }}>{m.assignedName}</b></>}</div>
                {m.message && <div style={{ marginTop: 7, fontSize: 12.5, color: c.ink, fontStyle: 'italic' }}>“{m.message}”</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PRESTATAIRE                                                       */
/* ================================================================== */
function PrestataireView({ missions, onAdvance, alertMission, onDismissAlert, onEnableAlerts, alertsState }) {
  const active = missions.filter((m) => m.status !== 'terminee').sort((a, b) => b.createdAt - a.createdAt);
  const done = missions.filter((m) => m.status === 'terminee').sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      {alertMission && (
        <div className="flash" onClick={onDismissAlert} style={{ marginBottom: 16, background: c.red, color: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <Bell size={22} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15 }}>Nouvelle mission assignée !</div><div style={{ fontSize: 13, opacity: 0.9 }}>{alertMission.lieu}</div></div>
        </div>
      )}

      {alertsState !== 'on' && (
        <button onClick={onEnableAlerts} style={{ width: '100%', marginBottom: 16, padding: '12px', borderRadius: 12, border: `1.5px solid ${c.amber}`, background: c.amberSoft, color: c.amberDark, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <BellRing size={17} /> Activer les alertes sur cet appareil
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Radio size={16} color={c.amber} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mes missions ({active.length})</span>
      </div>

      {active.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '30px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune mission assignée pour le moment.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {active.map((m) => {
          const step = PREST_NEXT[m.status];
          const isNew = m.status === 'assignee';
          return (
            <div key={m.id} style={{ background: c.surface, border: `1px solid ${isNew ? c.amber : c.line}`, borderRadius: 16, padding: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}><Plate value={m.immat} /><Pill status={m.status} /></div>
              {m.message && <NoteBox text={m.message} />}
              <a href={`https://maps.google.com/?q=${encodeURIComponent(m.lieu)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: c.ink, background: c.paper, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <MapPin size={17} color={c.amber} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{m.lieu}</span><Navigation size={15} color={c.muted} />
              </a>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, background: c.paper, borderRadius: 10, padding: '9px 11px' }}><div style={{ fontSize: 11, color: c.muted, marginBottom: 2 }}>Type de pneu</div><div className="num" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{m.type}</div></div>
                <div style={{ flex: 1, background: c.paper, borderRadius: 10, padding: '9px 11px' }}><div style={{ fontSize: 11, color: c.muted, marginBottom: 2 }}>Position</div><div style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{m.pos}</div></div>
              </div>
              <a href={`tel:${(m.tel || '').replace(/\s/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: c.ink, background: c.paper, borderRadius: 10, padding: '10px 12px' }}>
                <Phone size={17} color={c.green} /><span style={{ flex: 1, fontSize: 13, color: c.muted }}>Chauffeur</span><span className="num" style={{ fontSize: 14.5, fontWeight: 700 }}>{m.tel}</span>
              </a>
              {step && (
                <button onClick={() => onAdvance(m.id, m.status)} style={{ marginTop: 12, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: m.status === 'assignee' ? c.amber : c.ink, color: '#fff', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {m.status === 'assignee' ? <Flag size={17} /> : <CheckCircle2 size={17} />}{step.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Terminées</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, padding: '11px 13px', opacity: 0.72 }}>
                <CheckCircle2 size={17} color={c.muted} /><span style={{ flex: 1, fontSize: 13.5, color: c.ink }}>{m.lieu}</span><Plate value={m.immat} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldShell({ user, children, onLogout }) {
  return (
    <div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 452, minHeight: '100dvh', background: c.paper, display: 'flex', flexDirection: 'column', boxShadow: '0 0 44px rgba(0,0,0,0.25)' }}>
        <header style={{ background: c.asphalt, color: '#fff', padding: '14px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: c.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={19} color="#fff" strokeWidth={2.2} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>Guido</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{user.company} · <span style={{ textTransform: 'capitalize' }}>{user.type}</span></div></div>
            </div>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 11px', fontSize: 12.5, fontWeight: 600 }}><LogOut size={14} /> Quitter</button>
          </div>
          <div style={{ height: 5, marginLeft: -18, marginRight: -18, background: `repeating-linear-gradient(45deg, ${c.hazard} 0 14px, ${c.ink} 14px 28px)` }} />
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 28px' }}>{children}</main>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ADMIN                                                             */
/* ================================================================== */
const rowBtn = (color) => ({ flex: 1, border: 'none', borderRight: `1px solid ${c.line}`, background: 'transparent', color, padding: '11px 4px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 });

function AccountCard({ a, inviteLink, onCopy, onStatus, onDelete }) {
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 15, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: a.type === 'client' ? c.blueSoft : c.amberSoft, color: a.type === 'client' ? c.blue : c.amberDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initials(a.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
          <div style={{ fontSize: 12.5, color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.company} · {a.email}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}><Badge meta={STATUS_META[a.status]} dot /><Badge meta={TYPE_META[a.type]} /></div>
      </div>
      {inviteLink && (
        <div className="pop" style={{ borderTop: `1px solid ${c.line}`, padding: '11px 15px', background: c.paper }}>
          <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 6, fontWeight: 700 }}>LIEN D'INVITATION (à envoyer à la personne)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} style={{ ...fieldStyle, fontSize: 12.5, padding: '9px 10px' }} />
            <button onClick={() => onCopy(inviteLink)} style={{ flexShrink: 0, border: 'none', background: c.ink, color: '#fff', borderRadius: 11, padding: '0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Copy size={15} /> Copier</button>
          </div>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${c.line}`, display: 'flex' }}>
        {a.status === 'actif' && <button onClick={() => onStatus(a.id, 'suspendu')} style={rowBtn(c.muted)}><Power size={15} /> Suspendre</button>}
        {a.status !== 'actif' && <button onClick={() => onStatus(a.id, 'actif')} style={rowBtn(c.green)}><Power size={15} /> Activer</button>}
        <button onClick={() => onDelete(a.id)} style={{ ...rowBtn(c.red), borderRight: 'none' }}><Trash2 size={15} /> Supprimer</button>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate }) {
  const [type, setType] = useState('prestataire');
  const [name, setName] = useState(''); const [company, setCompany] = useState('');
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [zone, setZone] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const valid = name.trim() && company.trim() && email.trim();

  const submit = async () => {
    setBusy(true); setErr('');
    const res = await onCreate({ type, name: name.trim(), company: company.trim(), phone: phone.trim(), email: email.trim(), zone: type === 'prestataire' ? zone.trim() : '' });
    setBusy(false);
    if (res?.error) setErr(res.error); else onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: c.surface, borderRadius: 18, padding: 22, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><UserPlus size={19} color={c.amber} /><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.ink }}>Nouveau compte</h2></div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', color: c.muted }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div><label style={labelStyle}>Type de compte</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['client', 'prestataire'].map((t) => { const on = type === t; return <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 14, fontWeight: 700, textTransform: 'capitalize', border: `1.5px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.ink }}>{t}</button>; })}
            </div></div>
          <div><label style={labelStyle}>Nom du contact</label><input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Karim Bensaïd" /></div>
          <div><label style={labelStyle}>Société</label><input style={fieldStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. Dépannage Martin" /></div>
          <div><label style={labelStyle}>E-mail (sert d'identifiant de connexion)</label><input type="email" style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@societe.fr" /></div>
          <div><label style={labelStyle}>Téléphone (optionnel)</label><input type="tel" style={fieldStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
          {type === 'prestataire' && <div><label style={labelStyle}>Zone d'intervention (optionnel)</label><input style={fieldStyle} value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex. Île-de-France" /></div>}
          {err && <div style={{ color: c.red, fontSize: 13 }}>{err}</div>}
          <button onClick={submit} disabled={!valid || busy} style={{ marginTop: 4, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 15, fontWeight: 800 }}>{busy ? 'Création…' : 'Créer le compte et générer le lien'}</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ accounts, missions, goMissions, goAccounts }) {
  const aAssigner = missions.filter((m) => m.status === 'envoyee').length;
  const clients = accounts.filter((a) => a.type === 'client' && a.status === 'actif').length;
  const prests = accounts.filter((a) => a.type === 'prestataire' && a.status === 'actif').length;
  const cards = [
    { label: 'Missions à assigner', value: aAssigner, color: aAssigner ? c.red : c.ink, onClick: goMissions },
    { label: 'Clients actifs', value: clients, color: c.blue },
    { label: 'Prestataires actifs', value: prests, color: c.amber },
    { label: 'Comptes au total', value: accounts.length, color: c.ink, onClick: goAccounts },
  ];
  return (
    <div>
      <h1 style={{ margin: '0 0 18px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Tableau de bord</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {cards.map((card) => <div key={card.label} onClick={card.onClick} style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 15, padding: '16px 17px', cursor: card.onClick ? 'pointer' : 'default' }}><div className="num" style={{ fontSize: 30, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div><div style={{ fontSize: 12.5, color: c.muted, marginTop: 6 }}>{card.label}</div></div>)}
      </div>
    </div>
  );
}

function MissionAdminCard({ m, prestataires, onAssign }) {
  const [sel, setSel] = useState(m.assignedTo || '');
  const canAssign = m.status === 'envoyee' || m.status === 'assignee';
  return (
    <div style={{ background: c.surface, border: `1px solid ${m.status === 'envoyee' ? c.amber : c.line}`, borderRadius: 15, padding: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}><Plate value={m.immat} /><Pill status={m.status} /></div>
      {m.message && <NoteBox text={m.message} />}
      <div style={{ fontSize: 13, color: c.ink, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><MapPin size={14} color={c.amber} /> {m.lieu}</div>
      <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 2 }}>Client : <b style={{ color: c.ink }}>{m.clientCompany}</b> · <span className="num">{timeAgo(m.createdAt)}</span></div>
      <div style={{ fontSize: 12.5, color: c.muted }}>{m.type} · {m.pos} · chauffeur <span className="num">{m.tel}</span></div>
      {canAssign ? (
        <div style={{ marginTop: 12 }}>
          {m.status === 'assignee' && <div style={{ fontSize: 12.5, color: c.blue, marginBottom: 7 }}>Assignée à <b>{m.assignedName}</b> · en attente de validation</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ ...fieldStyle, flex: 1 }}>
              <option value="">Choisir un prestataire…</option>
              {prestataires.map((p) => <option key={p.id} value={p.id}>{p.company}{p.zone ? ` — ${p.zone}` : ''}</option>)}
            </select>
            <button onClick={() => sel && onAssign(m.id, sel)} disabled={!sel || sel === m.assignedTo} style={{ flexShrink: 0, border: 'none', borderRadius: 11, padding: '0 16px', fontWeight: 700, fontSize: 14, background: (!sel || sel === m.assignedTo) ? c.line : c.amber, color: (!sel || sel === m.assignedTo) ? c.muted : '#fff' }}>{m.assignedTo ? 'Réassigner' : 'Assigner'}</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 13, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} color={c.green} /> {m.status === 'terminee' ? 'Terminée par' : 'Prise en charge par'} <b style={{ color: c.green }}>{m.assignedName}</b>
        </div>
      )}
    </div>
  );
}

function AdminMissions({ missions, accounts, onAssign }) {
  const [filter, setFilter] = useState('all');
  const prestataires = accounts.filter((a) => a.type === 'prestataire' && a.status === 'actif');
  const filters = [{ k: 'all', label: 'Toutes' }, { k: 'todo', label: 'À assigner' }, { k: 'progress', label: 'En cours' }, { k: 'done', label: 'Terminées' }];
  const shown = missions.filter((m) => {
    if (filter === 'todo') return m.status === 'envoyee';
    if (filter === 'progress') return m.status === 'assignee' || m.status === 'prise_en_charge';
    if (filter === 'done') return m.status === 'terminee';
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Missions</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map((f) => { const on = filter === f.k; return <button key={f.k} onClick={() => setFilter(f.k)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.muted }}>{f.label}</button>; })}
      </div>
      {prestataires.length === 0 && <div style={{ background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: c.ink, marginBottom: 14 }}>Créez d'abord un compte prestataire pour assigner les missions.</div>}
      {shown.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '40px 0' }}>Aucune mission ici.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((m) => <MissionAdminCard key={m.id} m={m} prestataires={prestataires} onAssign={onAssign} />)}
      </div>
    </div>
  );
}

function AccountsView({ accounts, invites, onOpen, onCopy, onStatus, onDelete }) {
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState('');
  const filters = [{ k: 'all', label: 'Tous' }, { k: 'client', label: 'Clients' }, { k: 'prestataire', label: 'Prestataires' }, { k: 'invite', label: 'Invités' }];
  const shown = accounts.filter((a) => {
    if (a.type === 'admin') return false;
    const bf = filter === 'all' ? true : filter === 'invite' ? a.status === 'invite' : a.type === filter;
    const bq = q.trim() === '' ? true : (a.name + a.company + (a.email || '')).toLowerCase().includes(q.toLowerCase());
    return bf && bq;
  }).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Comptes</h1>
        <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 7, background: c.amber, color: '#fff', border: 'none', borderRadius: 11, padding: '10px 15px', fontSize: 14, fontWeight: 700, flexShrink: 0 }}><Plus size={17} strokeWidth={2.4} /> Nouveau</button>
      </div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} color={c.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" style={{ ...fieldStyle, paddingLeft: 38 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map((f) => { const on = filter === f.k; return <button key={f.k} onClick={() => setFilter(f.k)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.muted }}>{f.label}</button>; })}
      </div>
      {shown.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '36px 0' }}>Aucun compte.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {shown.map((a) => <AccountCard key={a.id} a={a} inviteLink={invites[a.id]} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function AdminShell({ profile, accounts, missions, invites, onCreate, onCopy, onStatus, onDelete, onAssign, onLogout, toast }) {
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);
  const aAssigner = missions.filter((m) => m.status === 'envoyee').length;
  const nav = [
    { k: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { k: 'missions', label: 'Missions', Icon: ClipboardList, badge: aAssigner },
    { k: 'accounts', label: 'Comptes', Icon: Users },
  ];
  return (
    <div style={{ minHeight: '100dvh', background: c.paper }}>
      <header style={{ background: c.asphalt, color: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: c.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={18} color="#fff" strokeWidth={2.2} /></div>
            <div><div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1 }}>Guido</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Console admin</div></div>
          </div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 13px', fontSize: 13, fontWeight: 600 }}><LogOut size={15} /> Déconnexion</button>
        </div>
        <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${c.hazard} 0 14px, ${c.ink} 14px 28px)` }} />
      </header>
      <nav style={{ background: c.surface, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px', display: 'flex', gap: 4 }}>
          {nav.map(({ k, label, Icon, badge }) => { const on = tab === k; return <button key={k} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', border: 'none', background: 'transparent', color: on ? c.ink : c.muted, fontSize: 14, fontWeight: on ? 700 : 500, borderBottom: `2.5px solid ${on ? c.amber : 'transparent'}` }}><Icon size={17} strokeWidth={on ? 2.3 : 1.9} /> {label}{badge ? <span style={{ background: c.red, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{badge}</span> : null}</button>; })}
        </div>
      </nav>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '22px 16px 40px' }}>
        {tab === 'dashboard' ? <Dashboard accounts={accounts} missions={missions} goMissions={() => setTab('missions')} goAccounts={() => setTab('accounts')} />
          : tab === 'missions' ? <AdminMissions missions={missions} accounts={accounts} onAssign={onAssign} />
          : <AccountsView accounts={accounts} invites={invites} onOpen={() => setModal(true)} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} />}
      </main>
      {modal && <CreateModal onClose={() => setModal(false)} onCreate={onCreate} />}
      {toast && <div className="pop" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: c.ink, color: '#fff', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 60 }}><Check size={16} color={c.green} /> {toast}</div>}
    </div>
  );
}

/* ================================================================== */
/*  APP (routeur + logique)                                           */
/* ================================================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [missions, setMissions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invites, setInvites] = useState({});       // { accountId: inviteLink }
  const [alertMission, setAlertMission] = useState(null);
  const [alertsState, setAlertsState] = useState('off');
  const [toast, setToast] = useState('');
  const [path, setPath] = useState(window.location.pathname);

  const seen = useRef(new Set());
  const firstMissions = useRef(true);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  /* Authentification */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* Profil de l'utilisateur connecté */
  useEffect(() => {
    let active = true;
    (async () => {
      if (!session) { setProfile(null); setReady(true); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (active) { setProfile(data ? mapAccount(data) : null); setReady(true); }
    })();
    return () => { active = false; };
  }, [session]);

  /* Missions + temps réel (RLS filtre déjà selon le rôle) */
  useEffect(() => {
    if (!profile) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (!active || !data) return;
      const list = data.map(mapMission);
      setMissions(list);
      if (profile.type === 'prestataire') {
        const mine = list.filter((m) => m.assignedTo === profile.id && m.status === 'assignee');
        const fresh = mine.filter((m) => !seen.current.has(m.id));
        if (!firstMissions.current && fresh.length) { setAlertMission(fresh[0]); beep(); }
        mine.forEach((m) => seen.current.add(m.id));
      }
      firstMissions.current = false;
    };
    load();
    const ch = supabase.channel('missions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Comptes (admin) */
  useEffect(() => {
    if (profile?.type !== 'admin') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (active && data) setAccounts(data.map(mapAccount));
    };
    load();
    const ch = supabase.channel('profiles-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Actions */
  const logout = async () => { await supabase.auth.signOut(); seen.current = new Set(); setPath('/'); window.history.replaceState({}, '', '/'); };

  const createMission = async (p) => {
    const { error } = await supabase.from('missions').insert({
      client_id: profile.id, client_company: profile.company,
      lieu: p.lieu, immat: p.immat, tyre_type: p.type, tyre_position: p.pos,
      tel_chauffeur: p.tel, message: p.message || null, status: 'envoyee',
    });
    if (error) { flash('Erreur : ' + error.message); return false; }
    return true;
  };
  const advance = async (id, status) => {
    const step = PREST_NEXT[status]; if (!step) return;
    await supabase.from('missions').update({ status: step.to }).eq('id', id);
  };
  const assign = async (id, prestId) => {
    const p = accounts.find((a) => a.id === prestId);
    await supabase.from('missions').update({ status: 'assignee', assigned_to: prestId, assigned_name: p ? p.company : '' }).eq('id', id);
  };
  const createAccount = async (data) => {
    const { data: res, error } = await supabase.functions.invoke('creer-compte', { body: data });
    if (error) return { error: error.message };
    if (res?.error) return { error: res.error };
    if (res?.profileId && res?.inviteLink) setInvites((x) => ({ ...x, [res.profileId]: res.inviteLink }));
    flash("Compte créé — lien d'invitation prêt");
    return { ok: true };
  };
  const setStatus = async (id, status) => { await supabase.from('profiles').update({ status }).eq('id', id); };
  const removeAccount = async (id) => { await supabase.from('profiles').delete().eq('id', id); };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); flash('Lien copié'); } catch (_) { flash('Sélectionnez le lien pour le copier'); } };
  const enableAlerts = async () => {
    const r = await activerNotifications(profile.id);
    if (r.ok) { setAlertsState('on'); flash('Alertes activées'); } else flash(r.msg);
  };

  /* Rendu */
  if (path.startsWith('/bienvenue')) {
    return <><GlobalStyle /><Bienvenue hasSession={!!session} onDone={() => { window.history.replaceState({}, '', '/'); setPath('/'); }} /></>;
  }
  if (!ready) {
    return <><GlobalStyle /><div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>Chargement…</div></>;
  }
  if (!session || !profile) {
    return <><GlobalStyle /><Login /></>;
  }
  if (profile.status === 'suspendu') {
    return <><GlobalStyle /><div style={{ minHeight: '100dvh', background: c.asphalt, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <ShieldCheck size={40} color={c.amber} /><div style={{ fontSize: 16 }}>Votre compte est suspendu. Contactez Guido.</div>
      <button onClick={logout} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600 }}>Se déconnecter</button>
    </div></>;
  }

  if (profile.type === 'admin') {
    return <><GlobalStyle /><AdminShell profile={profile} accounts={accounts} missions={missions} invites={invites}
      onCreate={createAccount} onCopy={copy} onStatus={setStatus} onDelete={removeAccount} onAssign={assign} onLogout={logout} toast={toast} /></>;
  }

  return (
    <>
      <GlobalStyle />
      <FieldShell user={profile} onLogout={logout}>
        {profile.type === 'client'
          ? <ClientView missions={missions} onSend={createMission} />
          : <PrestataireView missions={missions} onAdvance={advance} alertMission={alertMission} onDismissAlert={() => setAlertMission(null)} onEnableAlerts={enableAlerts} alertsState={alertsState} />}
      </FieldShell>
      {toast && <div className="pop" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: c.ink, color: '#fff', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, zIndex: 60 }}>{toast}</div>}
    </>
  );
}
