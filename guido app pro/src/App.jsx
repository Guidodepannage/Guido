import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Send, MapPin, Phone, CheckCircle2, Navigation, Flag, Bell, Radio,
  LayoutDashboard, Users, Plus, Search, Copy, Check, Power, Trash2,
  LogOut, ShieldCheck, X, Mail, Clock, UserPlus, ClipboardList, KeyRound, BellRing,
  Package, Minus, Pencil, AlertTriangle, Eye, EyeOff, Settings
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
  fourniture: r.fourniture,
  stockId: r.stock_id,
});
const mapAccount = (p) => ({
  id: p.id, type: p.role, name: p.name, company: p.company,
  phone: p.phone, email: p.email, zone: p.zone, status: p.status,
  createdAt: new Date(p.created_at).getTime(),
});

const mapStock = (r) => ({
  id: r.id, dimension: r.dimension, marque: r.marque, etat: r.etat,
  quantite: r.quantite ?? 0, prix: r.prix, seuil: r.seuil,
  rechape: r.rechape, usure: r.usure,
  createdAt: new Date(r.created_at).getTime(),
});
const stockBas = (s) => s.etat === 'neuf' && s.seuil != null && s.quantite <= s.seuil;

/* Audio partagé — débloqué par un geste utilisateur (contrainte iOS) */
let guidoAudioCtx = null;
function getGuidoAudio() {
  try {
    if (!guidoAudioCtx) guidoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (guidoAudioCtx.state === 'suspended') guidoAudioCtx.resume();
  } catch (_) {}
  return guidoAudioCtx;
}
function unlockAudio() {
  const ctx = getGuidoAudio();
  if (!ctx) return;
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(ctx.destination); src.start(0);
  } catch (_) {}
}

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
          <img src="/logo-emblem.png" alt="Guido" style={{ width: 42, height: 42, objectFit: 'contain' }} />
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
          <img src="/logo-emblem.png" alt="Guido" style={{ width: 42, height: 42, objectFit: 'contain' }} />
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
function Info({ label, value, mono }) {
  return (
    <div style={{ background: c.paper, borderRadius: 9, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: c.muted, marginBottom: 2 }}>{label}</div>
      <div className={mono ? 'num' : undefined} style={{ fontSize: 13.5, fontWeight: 700, color: c.ink, wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

function FournitureTag({ v }) {
  if (!v) return null;
  const guido = v === 'guido';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700, background: guido ? c.amberSoft : c.paper, color: guido ? c.amberDark : c.muted, border: guido ? `1px solid ${c.hazard}` : `1px solid ${c.line}` }}>
      {guido ? '🛞 Pneu à fournir par Guido' : '✓ Client déjà équipé'}
    </span>
  );
}

/* Carte détaillée d'une mission — affiche toutes les informations saisies */
function MissionDetail({ m, client }) {
  const dateStr = new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '14px 15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 11 }}>
        <Plate value={m.immat} /><Pill status={m.status} client={client} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}><MapPin size={15} color={c.amber} /> {m.lieu}</div>
      {m.fourniture && <div style={{ marginBottom: 10 }}><FournitureTag v={m.fourniture} /></div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: m.message ? 10 : 0 }}>
        <Info label="Type de pneu" value={m.type} mono />
        <Info label="Position" value={m.pos} />
        <Info label="Téléphone chauffeur" value={m.tel} mono />
        <Info label="Date" value={dateStr} />
        {!client && <Info label="Client" value={m.clientCompany} />}
        {m.assignedName && <Info label="Prestataire" value={m.assignedName} />}
      </div>
      {m.message && <NoteBox text={m.message} />}
    </div>
  );
}

function ClientView({ missions, onSend, stock = [] }) {
  const [lieu, setLieu] = useState('');
  const [immat, setImmat] = useState('');
  const [type, setType] = useState('');
  const [element, setElement] = useState('');
  const [cote, setCote] = useState('');
  const [essieu, setEssieu] = useState(null);
  const [inout, setInout] = useState('');
  const [tel, setTel] = useState('');
  const [message, setMessage] = useState('');
  const [fourniture, setFourniture] = useState('');
  const [dim, setDim] = useState('');
  const [offreId, setOffreId] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('new');

  const offres = (stock || []).filter((s) => (s.quantite || 0) > 0);
  const dimensions = [...new Set(offres.map((o) => o.dimension))].sort();
  const offresDim = offres.filter((o) => o.dimension === dim);
  const chosenOffre = offres.find((o) => o.id === offreId);

  const needInout = element === 'Tracteur' && (essieu === 2 || essieu === 3);
  const pos = element && cote && essieu ? `${element} ${cote}${essieu}${needInout && inout ? ' ' + inout : ''}` : '';
  const typeFinal = fourniture === 'guido'
    ? (chosenOffre ? `${chosenOffre.dimension}${chosenOffre.marque ? ' ' + chosenOffre.marque : ''}` : '')
    : type.trim();
  const pneuOk = fourniture === 'guido' ? !!offreId : !!type.trim();
  const valid = lieu.trim() && immat.trim() && tel.trim() && element && cote && essieu && (!needInout || inout) && fourniture && pneuOk;

  const send = async () => {
    setBusy(true);
    const ok = await onSend({ lieu: lieu.trim(), immat: immat.trim().toUpperCase(), type: typeFinal, pos, tel: tel.trim(), message: message.trim(), fourniture, stockId: fourniture === 'guido' ? offreId : null });
    setBusy(false);
    if (ok) {
      setLieu(''); setImmat(''); setType(''); setTel(''); setElement(''); setCote(''); setEssieu(null); setInout(''); setMessage(''); setFourniture(''); setDim(''); setOffreId('');
      setSent(true); setTimeout(() => setSent(false), 2600);
    }
  };
  const chip = (label, active, onClick, key) => (
    <button key={key ?? label} onClick={onClick} style={{ padding: '9px 15px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: `1.5px solid ${active ? c.ink : c.line}`, background: active ? c.ink : c.surface, color: active ? '#fff' : c.ink }}>{label}</button>
  );
  const mine = [...missions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {[{ k: 'new', label: 'Nouvelle mission' }, { k: 'history', label: `Historique${mine.length ? ` (${mine.length})` : ''}` }].map((t) => {
          const on = tab === t.k;
          return <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700, background: on ? c.ink : 'transparent', color: on ? '#fff' : c.muted }}>{t.label}</button>;
        })}
      </div>

      {tab === 'new' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16 }}>
            <div><label style={labelStyle}>Lieu du dépannage</label>
              <input style={fieldStyle} value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex. A6 sortie 14, aire de Nemours" /></div>
            <div><label style={labelStyle}>Immatriculation</label>
              <input style={{ ...fieldStyle, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'ui-monospace, Menlo, monospace' }} value={immat} onChange={(e) => setImmat(e.target.value.toUpperCase())} placeholder="AB-123-CD" /></div>

            <div>
              <label style={labelStyle}>Fourniture du pneumatique</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ k: 'guido', label: 'Commander via Guido' }, { k: 'client', label: 'Client déjà équipé' }].map((o) => {
                  const on = fourniture === o.k;
                  return <button key={o.k} onClick={() => { setFourniture(o.k); setType(''); setDim(''); setOffreId(''); }} style={{ flex: 1, padding: '11px 10px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, border: `1.5px solid ${on ? c.amber : c.line}`, background: on ? c.amberSoft : c.surface, color: on ? c.amberDark : c.ink }}>{o.label}</button>;
                })}
              </div>
            </div>

            {fourniture === 'client' && (
              <div><label style={labelStyle}>Type de pneu</label>
                <input style={fieldStyle} list="tp" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex. 315/80 R22.5" />
                <datalist id="tp">{POS_TYPES.map((t) => <option key={t} value={t} />)}</datalist></div>
            )}

            {fourniture === 'guido' && (offres.length === 0 ? (
              <div style={{ background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 10, padding: '11px 13px', fontSize: 13.5, color: c.ink }}>
                Pneumatique indisponible, choisissez « Client déjà équipé » ou contactez Guido.
              </div>
            ) : (
              <>
                <div><label style={labelStyle}>Dimension du pneu</label>
                  <select style={fieldStyle} value={dim} onChange={(e) => { setDim(e.target.value); setOffreId(''); }}>
                    <option value="">Choisir une dimension…</option>
                    {dimensions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select></div>
                {dim && (
                  <div>
                    <label style={labelStyle}>Offre disponible</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {offresDim.map((o) => {
                        const on = offreId === o.id;
                        return (
                          <button key={o.id} onClick={() => setOffreId(o.id)} style={{ textAlign: 'left', padding: '12px 13px', borderRadius: 11, border: `1.5px solid ${on ? c.amber : c.line}`, background: on ? c.amberSoft : c.surface }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <div>
                                <div className="num" style={{ fontSize: 14.5, fontWeight: 800, color: c.ink }}>{o.dimension}</div>
                                <div style={{ fontSize: 12.5, color: c.muted, marginTop: 2 }}>{o.marque || 'Sans marque'} · {o.etat === 'neuf' ? 'Neuf' : 'Occasion'}{o.etat === 'occasion' && o.usure != null ? ` · usure ${o.usure}%` : ''}</div>
                              </div>
                              <div className="num" style={{ fontSize: 16, fontWeight: 800, color: c.amberDark }}>{o.prix != null ? `${o.prix} €` : '—'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ))}

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
        </>
      ) : (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: c.muted }}>Vos demandes des 3 derniers mois.</p>
          {mine.length === 0 ? (
            <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '36px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune mission pour le moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mine.map((m) => <MissionDetail key={m.id} m={m} client />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  ALARME PLEIN ÉCRAN (app ouverte)                                  */
/* ================================================================== */
function AlarmOverlay({ mission, onAccept, title = 'NOUVELLE MISSION', actionLabel = 'Accepter la mission' }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stopped = false;
    const ctx = getGuidoAudio();

    const tone = () => {
      if (!ctx || stopped) return;
      try {
        const now = ctx.currentTime;
        [[880, 0, 0.2], [1245, 0.25, 0.25]].forEach(([f, s, d]) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.value = f;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, now + s);
          g.gain.exponentialRampToValueAtTime(0.5, now + s + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + s + d);
          o.start(now + s); o.stop(now + s + d);
        });
      } catch (_) {}
    };
    const vibrate = () => { try { navigator.vibrate && navigator.vibrate([900, 300, 900, 300, 900]); } catch (_) {} };

    tone(); vibrate();
    const a = setInterval(tone, 900);
    const v = setInterval(vibrate, 3200);
    return () => {
      stopped = true;
      clearInterval(a); clearInterval(v);
      try { navigator.vibrate && navigator.vibrate(0); } catch (_) {}
    };
  }, []);

  const accept = async () => { setBusy(true); try { await onAccept(); } finally { /* overlay se ferme via le parent */ } };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: c.red, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', animation: 'guidoAlarm 1s ease-in-out infinite' }}>
      <style>{`@keyframes guidoAlarm{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}`}</style>
      <Bell size={64} color="#fff" />
      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.8)' }}>GUIDO</div>
      <h1 style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{title}</h1>
      <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: '16px 20px', maxWidth: 360, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Plate value={mission.immat} /></div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><MapPin size={18} /> {mission.lieu}</div>
        {mission.pos && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 }}>{mission.type} · {mission.pos}</div>}
        {mission.message && <div style={{ color: '#fff', fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>“{mission.message}”</div>}
      </div>
      <button onClick={accept} disabled={busy} style={{ marginTop: 28, width: '100%', maxWidth: 360, padding: '18px', borderRadius: 16, border: 'none', background: '#fff', color: c.red, fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <CheckCircle2 size={22} /> {busy ? 'Un instant…' : actionLabel}
      </button>
      <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.75)', fontSize: 12.5 }}>L'alarme s'arrête à l'acceptation</div>
    </div>
  );
}

/* ================================================================== */
/*  PRESTATAIRE                                                       */
/* ================================================================== */
function PrestataireView({ missions, onAdvance, alertMission, onDismissAlert, onEnableAlerts, alertsState }) {
  const active = missions.filter((m) => m.status !== 'terminee').sort((a, b) => b.createdAt - a.createdAt);
  const done = missions.filter((m) => m.status === 'terminee').sort((a, b) => b.createdAt - a.createdAt);
  const [tab, setTab] = useState('active');

  return (
    <div>
      {alertMission && (
        <AlarmOverlay
          mission={alertMission}
          onAccept={async () => { await onAdvance(alertMission.id, alertMission.status); onDismissAlert(); }}
        />
      )}

      {alertsState !== 'on' && (
        <button onClick={onEnableAlerts} style={{ width: '100%', marginBottom: 16, padding: '12px', borderRadius: 12, border: `1.5px solid ${c.amber}`, background: c.amberSoft, color: c.amberDark, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <BellRing size={17} /> Activer les alertes sur cet appareil
        </button>
      )}

      <div style={{ display: 'flex', gap: 6, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[{ k: 'active', label: `En cours${active.length ? ` (${active.length})` : ''}` }, { k: 'history', label: `Historique${done.length ? ` (${done.length})` : ''}` }].map((t) => {
          const on = tab === t.k;
          return <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700, background: on ? c.ink : 'transparent', color: on ? '#fff' : c.muted }}>{t.label}</button>;
        })}
      </div>

      {tab === 'active' ? (
        <>
          {active.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '30px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune mission en cours.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map((m) => {
              const step = PREST_NEXT[m.status];
              const isNew = m.status === 'assignee';
              return (
                <div key={m.id} style={{ background: c.surface, border: `1px solid ${isNew ? c.amber : c.line}`, borderRadius: 16, padding: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}><Plate value={m.immat} /><Pill status={m.status} /></div>
                  {m.fourniture && <div style={{ marginBottom: 10 }}><FournitureTag v={m.fourniture} /></div>}
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
        </>
      ) : (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: c.muted }}>Vos missions terminées des 3 derniers mois.</p>
          {done.length === 0 ? (
            <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '36px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune mission terminée.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {done.map((m) => <MissionDetail key={m.id} m={m} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PasswordModal({ onClose }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const valid = p1.length >= 6 && p1 === p2;

  const submit = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) {
      setErr(/different from the old/i.test(error.message) ? "Le nouveau mot de passe doit être différent de l'ancien." : error.message);
      return;
    }
    setOk(true); setTimeout(onClose, 1600);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: c.surface, borderRadius: 18, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><KeyRound size={19} color={c.amber} /><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.ink }}>Changer mon mot de passe</h2></div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', color: c.muted }}><X size={20} /></button>
        </div>
        {ok ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: c.greenSoft, color: c.green, borderRadius: 12, padding: '13px 15px', fontSize: 14, fontWeight: 600 }}><CheckCircle2 size={18} /> Mot de passe mis à jour</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} style={{ ...fieldStyle, paddingRight: 42 }} value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Au moins 6 caractères" />
                <button onClick={() => setShow((s) => !s)} aria-label="Afficher" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: c.muted, padding: 6 }}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input type={show ? 'text' : 'password'} style={fieldStyle} value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Retapez le mot de passe" />
            </div>
            {p2 && p1 !== p2 && <div style={{ color: c.red, fontSize: 12.5 }}>Les deux mots de passe ne correspondent pas.</div>}
            {err && <div style={{ color: c.red, fontSize: 12.5 }}>{err}</div>}
            <button onClick={submit} disabled={!valid || busy} style={{ marginTop: 2, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 15, fontWeight: 800 }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactView({ contact }) {
  const rows = [
    { icon: Mail, label: 'E-mail', value: contact?.email },
    { icon: Phone, label: 'Téléphone', value: contact?.phone },
    { icon: MapPin, label: 'Adresse du siège', value: contact?.adresse },
  ];
  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: c.ink }}>Contact</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13.5, color: c.muted }}>Une question ou une réclamation ? Contactez Guido.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 13, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '15px 16px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: c.amberSoft, color: c.amberDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><r.icon size={20} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: c.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: c.ink, wordBreak: 'break-word' }}>{r.value || '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminContact({ contact, onSave }) {
  const [email, setEmail] = useState(contact?.email || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [adresse, setAdresse] = useState(contact?.adresse || '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async () => {
    setBusy(true); setDone(false);
    await onSave({ email: email.trim(), phone: phone.trim(), adresse: adresse.trim() });
    setBusy(false); setDone(true); setTimeout(() => setDone(false), 2200);
  };
  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Coordonnées de contact</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13.5, color: c.muted }}>Ces informations sont affichées aux clients et prestataires dans leur onglet « Contact ».</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, maxWidth: 460 }}>
        <div><label style={labelStyle}>E-mail de contact</label><input style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@…" /></div>
        <div><label style={labelStyle}>Téléphone</label><input style={fieldStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
        <div><label style={labelStyle}>Adresse du siège</label><input style={fieldStyle} value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="15 rue de Reuilly, Paris 12" /></div>
        <button onClick={submit} disabled={busy} style={{ marginTop: 2, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: busy ? c.line : c.amber, color: busy ? c.muted : '#fff', fontSize: 15, fontWeight: 800 }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {done && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.green, fontSize: 13.5, fontWeight: 600 }}><CheckCircle2 size={16} /> Coordonnées mises à jour</div>}
      </div>
    </div>
  );
}

function FieldShell({ user, children, onLogout, contact }) {
  const [view, setView] = useState('main');
  const [pwd, setPwd] = useState(false);
  return (
    <div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 452, minHeight: '100dvh', background: c.paper, display: 'flex', flexDirection: 'column', boxShadow: '0 0 44px rgba(0,0,0,0.25)' }}>
        <header style={{ background: c.asphalt, color: '#fff', padding: '14px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo-emblem.png" alt="Guido" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <div><div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>Guido</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{user.company} · <span style={{ textTransform: 'capitalize' }}>{user.type}</span></div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPwd(true)} aria-label="Mon compte" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 10px', fontSize: 12.5, fontWeight: 600 }}><KeyRound size={14} /></button>
              <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 11px', fontSize: 12.5, fontWeight: 600 }}><LogOut size={14} /> Quitter</button>
            </div>
          </div>
          <div style={{ height: 5, marginLeft: -18, marginRight: -18, background: `repeating-linear-gradient(45deg, ${c.hazard} 0 14px, ${c.ink} 14px 28px)` }} />
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 28px' }}>{view === 'main' ? children : <ContactView contact={contact} />}</main>
        <nav style={{ display: 'flex', borderTop: `1px solid ${c.line}`, background: c.surface }}>
          {[{ k: 'main', label: 'Accueil', Icon: LayoutDashboard }, { k: 'contact', label: 'Contact', Icon: Mail }].map((t) => {
            const on = view === t.k;
            return (
              <button key={t.k} onClick={() => setView(t.k)} style={{ flex: 1, border: 'none', background: 'transparent', color: on ? c.amberDark : c.muted, padding: '10px 4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700 }}>
                <t.Icon size={20} /> {t.label}
              </button>
            );
          })}
        </nav>
      </div>
      {pwd && <PasswordModal onClose={() => setPwd(false)} />}
    </div>
  );
}

/* ================================================================== */
/*  ADMIN                                                             */
/* ================================================================== */
const rowBtn = (color) => ({ flex: 1, border: 'none', borderRight: `1px solid ${c.line}`, background: 'transparent', color, padding: '11px 4px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 });

function PneusModal({ client, stock, authorizedIds, onToggle, onClose }) {
  const [sel, setSel] = useState(new Set(authorizedIds));
  const toggle = (id) => {
    const next = new Set(sel);
    const has = next.has(id);
    if (has) next.delete(id); else next.add(id);
    setSel(next);
    onToggle(client.id, id, !has);
  };
  const refs = [...stock].sort((a, b) => a.dimension.localeCompare(b.dimension));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: c.surface, borderRadius: 18, padding: 22, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Package size={19} color={c.amber} /><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.ink }}>Pneus autorisés</h2></div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', color: c.muted }}><X size={20} /></button>
        </div>
        <div style={{ fontSize: 13, color: c.muted, marginBottom: 16 }}>Cochez les références que <b style={{ color: c.ink }}>{client.company}</b> peut commander.</div>
        {refs.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '24px 0' }}>Aucune référence en stock. Ajoutez-en dans l'onglet Stock.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {refs.map((s) => {
            const on = sel.has(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 13px', borderRadius: 11, border: `1.5px solid ${on ? c.amber : c.line}`, background: on ? c.amberSoft : c.surface }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on ? c.amber : c.line}`, background: on ? c.amber : c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Check size={15} color="#fff" />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="num" style={{ fontSize: 14, fontWeight: 800, color: c.ink }}>{s.dimension}</div>
                  <div style={{ fontSize: 12, color: c.muted }}>{s.marque || 'Sans marque'} · {s.etat === 'neuf' ? 'Neuf' : 'Occasion'}{s.prix != null ? ` · ${s.prix} €` : ''} · {s.quantite} en stock</div>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 18, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: c.ink, color: '#fff', fontSize: 15, fontWeight: 800 }}>Terminé</button>
      </div>
    </div>
  );
}

function AccountCard({ a, inviteLink, onCopy, onStatus, onDelete, onManagePneus, nbPneus, onRegenLink }) {
  const [regen, setRegen] = useState(false);
  const doRegen = async () => { setRegen(true); await onRegenLink(a); setRegen(false); };
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
      {a.status === 'invite' && !inviteLink && (
        <button onClick={doRegen} disabled={regen} style={{ width: '100%', borderTop: `1px solid ${c.line}`, border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: c.line, background: c.paper, color: c.amberDark, padding: '11px', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <KeyRound size={16} /> {regen ? 'Génération…' : "Revoir le lien d'invitation"}
        </button>
      )}
      {a.type === 'client' && (
        <button onClick={() => onManagePneus(a)} style={{ width: '100%', borderTop: `1px solid ${c.line}`, border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: c.line, background: c.paper, color: c.blue, padding: '11px', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Package size={16} /> Pneus autorisés{nbPneus ? ` (${nbPneus})` : ''}
        </button>
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

function Dashboard({ accounts, missions, stock = [], goMissions, goAccounts, goStock }) {
  const aAssigner = missions.filter((m) => m.status === 'envoyee').length;
  const clients = accounts.filter((a) => a.type === 'client' && a.status === 'actif').length;
  const prests = accounts.filter((a) => a.type === 'prestataire' && a.status === 'actif').length;
  const aRecommander = stock.filter(stockBas).length;
  const cards = [
    { label: 'Missions à assigner', value: aAssigner, color: aAssigner ? c.red : c.ink, onClick: goMissions },
    { label: 'Pneus à recommander', value: aRecommander, color: aRecommander ? c.red : c.ink, onClick: goStock },
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

function MissionAdminCard({ m, prestataires, onAssign, onTakeCharge }) {
  const [sel, setSel] = useState(m.assignedTo || '');
  const canAssign = m.status === 'envoyee' || m.status === 'assignee';
  return (
    <div style={{ background: c.surface, border: `1px solid ${m.status === 'envoyee' ? c.amber : c.line}`, borderRadius: 15, padding: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}><Plate value={m.immat} /><Pill status={m.status} /></div>
      {m.message && <NoteBox text={m.message} />}
      <div style={{ fontSize: 13, color: c.ink, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><MapPin size={14} color={c.amber} /> {m.lieu}</div>
      <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 2 }}>Client : <b style={{ color: c.ink }}>{m.clientCompany}</b> · <span className="num">{timeAgo(m.createdAt)}</span></div>
      <div style={{ fontSize: 12.5, color: c.muted }}>{m.type} · {m.pos} · chauffeur <span className="num">{m.tel}</span></div>
      {m.fourniture && <div style={{ marginTop: 8 }}><FournitureTag v={m.fourniture} /></div>}
      {canAssign ? (
        <div style={{ marginTop: 12 }}>
          {m.status === 'assignee' && <div style={{ fontSize: 12.5, color: c.blue, marginBottom: 7 }}>Assignée à <b>{m.assignedName}</b> · en attente de validation</div>}
          <button onClick={() => onTakeCharge(m.id)} style={{ width: '100%', border: `1.5px solid ${c.amber}`, background: c.amberSoft, color: c.amberDark, borderRadius: 11, padding: '11px', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 10 }}><Flag size={16} /> Prendre en charge moi-même</button>
          <div style={{ fontSize: 11.5, color: c.muted, textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ou répartir à un prestataire</div>
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

function AdminMissions({ missions, accounts, onAssign, onTakeCharge }) {
  const [filter, setFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const prestataires = accounts.filter((a) => a.type === 'prestataire' && a.status === 'actif');
  const clients = accounts.filter((a) => a.type === 'client').sort((a, b) => (a.company || '').localeCompare(b.company || ''));
  const filters = [{ k: 'all', label: 'Toutes' }, { k: 'todo', label: 'À assigner' }, { k: 'progress', label: 'En cours' }, { k: 'done', label: 'Terminées' }];
  const shown = missions.filter((m) => {
    if (clientFilter && m.clientId !== clientFilter) return false;
    if (filter === 'todo') return m.status === 'envoyee';
    if (filter === 'progress') return m.status === 'assignee' || m.status === 'prise_en_charge';
    if (filter === 'done') return m.status === 'terminee';
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);
  const clientChoisi = clients.find((cl) => cl.id === clientFilter);
  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Missions</h1>
      <div style={{ marginBottom: 12 }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color={c.muted} /> Filtrer par client</label>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={fieldStyle}>
          <option value="">Tous les clients</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.company} — {cl.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map((f) => { const on = filter === f.k; return <button key={f.k} onClick={() => setFilter(f.k)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.muted }}>{f.label}</button>; })}
      </div>
      {clientChoisi && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: c.blueSoft, borderRadius: 11, padding: '10px 13px', marginBottom: 14 }}>
        <span style={{ fontSize: 13.5, color: c.ink }}>Historique de <b>{clientChoisi.company}</b> · {shown.length} mission{shown.length > 1 ? 's' : ''}</span>
        <button onClick={() => setClientFilter('')} style={{ border: 'none', background: 'transparent', color: c.blue, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><X size={14} /> Effacer</button>
      </div>}
      {prestataires.length === 0 && <div style={{ background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: c.ink, marginBottom: 14 }}>Astuce : créez un compte prestataire pour répartir, ou prenez la mission en charge vous-même.</div>}
      {shown.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '40px 0' }}>Aucune mission ici.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((m) => <MissionAdminCard key={m.id} m={m} prestataires={prestataires} onAssign={onAssign} onTakeCharge={onTakeCharge} />)}
      </div>
    </div>
  );
}

function MyInterventions({ missions, profileId, onAdvance }) {
  const mine = missions.filter((m) => m.assignedTo === profileId);
  const active = mine.filter((m) => m.status !== 'terminee').sort((a, b) => b.createdAt - a.createdAt);
  const done = mine.filter((m) => m.status === 'terminee').sort((a, b) => b.createdAt - a.createdAt);
  const [tab, setTab] = useState('active');
  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Mes interventions</h1>
      <div style={{ display: 'flex', gap: 6, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[{ k: 'active', label: `En cours${active.length ? ` (${active.length})` : ''}` }, { k: 'history', label: `Historique${done.length ? ` (${done.length})` : ''}` }].map((t) => {
          const on = tab === t.k;
          return <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 700, background: on ? c.ink : 'transparent', color: on ? '#fff' : c.muted }}>{t.label}</button>;
        })}
      </div>
      {tab === 'active' ? (
        active.length === 0 ? (
          <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '36px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune intervention en cours.<br />Prenez une mission en charge depuis l'onglet Missions.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map((m) => {
              const step = PREST_NEXT[m.status];
              return (
                <div key={m.id} style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}><Plate value={m.immat} /><Pill status={m.status} /></div>
                  {m.fourniture && <div style={{ marginBottom: 10 }}><FournitureTag v={m.fourniture} /></div>}
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
                    <button onClick={() => onAdvance(m.id, m.status)} style={{ marginTop: 12, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: c.ink, color: '#fff', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <CheckCircle2 size={17} /> {step.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        done.length === 0 ? (
          <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '36px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune intervention terminée.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {done.map((m) => <MissionDetail key={m.id} m={m} />)}
          </div>
        )
      )}
    </div>
  );
}

function AccountsView({ accounts, invites, onOpen, onCopy, onStatus, onDelete, stock = [], clientStock = [], onToggleAuth, onRegenLink }) {
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState('');
  const [pneusClient, setPneusClient] = useState(null);
  const authIdsFor = (id) => clientStock.filter((r) => r.client_id === id).map((r) => r.stock_id);
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
        {shown.map((a) => <AccountCard key={a.id} a={a} inviteLink={invites[a.id]} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} onManagePneus={setPneusClient} nbPneus={a.type === 'client' ? authIdsFor(a.id).length : 0} onRegenLink={onRegenLink} />)}
      </div>
      {pneusClient && (
        <PneusModal
          client={pneusClient}
          stock={stock}
          authorizedIds={authIdsFor(pneusClient.id)}
          onToggle={onToggleAuth}
          onClose={() => setPneusClient(null)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  STOCK (admin)                                                     */
/* ================================================================== */
function StockModal({ item, onClose, onSubmit }) {
  const [dimension, setDimension] = useState(item?.dimension || '');
  const [marque, setMarque] = useState(item?.marque || '');
  const [etat, setEtat] = useState(item?.etat || 'neuf');
  const [quantite, setQuantite] = useState(item ? String(item.quantite) : '0');
  const [prix, setPrix] = useState(item?.prix != null ? String(item.prix) : '');
  const [seuil, setSeuil] = useState(item?.seuil != null ? String(item.seuil) : '');
  const [rechape, setRechape] = useState(item?.rechape ?? false);
  const [usure, setUsure] = useState(item?.usure != null ? item.usure : 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = dimension.trim();

  const submit = async () => {
    setBusy(true); setErr('');
    const payload = {
      dimension: dimension.trim(),
      marque: marque.trim() || null,
      etat,
      quantite: parseInt(quantite, 10) || 0,
      prix: prix.trim() === '' ? null : parseFloat(prix.replace(',', '.')),
      seuil: etat === 'neuf' && seuil.trim() !== '' ? parseInt(seuil, 10) : null,
      rechape: etat === 'occasion' ? !!rechape : null,
      usure: etat === 'occasion' ? Number(usure) : null,
    };
    const res = await onSubmit(payload);
    setBusy(false);
    if (res?.error) setErr(res.error); else onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: c.surface, borderRadius: 18, padding: 22, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Package size={19} color={c.amber} /><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.ink }}>{item ? 'Modifier la référence' : 'Nouvelle référence'}</h2></div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', color: c.muted }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div><label style={labelStyle}>Dimension</label><input style={fieldStyle} value={dimension} onChange={(e) => setDimension(e.target.value)} placeholder="Ex. 315/80 R22.5" /></div>
          <div><label style={labelStyle}>Marque</label><input style={fieldStyle} value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Ex. Michelin" /></div>
          <div><label style={labelStyle}>État</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ k: 'neuf', label: 'Neuf' }, { k: 'occasion', label: 'Occasion' }].map((o) => { const on = etat === o.k; return <button key={o.k} onClick={() => setEtat(o.k)} style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: `1.5px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.ink }}>{o.label}</button>; })}
            </div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Quantité</label><input type="number" inputMode="numeric" style={fieldStyle} value={quantite} onChange={(e) => setQuantite(e.target.value)} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Prix (€)</label><input type="number" inputMode="decimal" style={fieldStyle} value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Optionnel" /></div>
          </div>
          {etat === 'neuf' && (
            <div><label style={labelStyle}>Seuil d'alerte</label>
              <input type="number" inputMode="numeric" style={fieldStyle} value={seuil} onChange={(e) => setSeuil(e.target.value)} placeholder="Ex. 2 — alerte quand le stock descend à ce niveau" /></div>
          )}
          {etat === 'occasion' && (
            <>
              <div><label style={labelStyle}>Réchapé</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: false, label: 'Non réchapé' }, { v: true, label: 'Réchapé' }].map((o) => { const on = rechape === o.v; return <button key={String(o.v)} onClick={() => setRechape(o.v)} style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 14, fontWeight: 700, border: `1.5px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.ink }}>{o.label}</button>; })}
                </div>
              </div>
              <div><label style={labelStyle}>Taux d'usure : <span className="num" style={{ color: c.amberDark }}>{usure}%</span></label>
                <input type="range" min={0} max={80} step={5} value={usure} onChange={(e) => setUsure(e.target.value)} style={{ width: '100%', accentColor: c.amber }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted, marginTop: 2 }}><span>0% (neuf)</span><span>80% (usé)</span></div>
              </div>
            </>
          )}
          {err && <div style={{ color: c.red, fontSize: 13 }}>{err}</div>}
          <button onClick={submit} disabled={!valid || busy} style={{ marginTop: 4, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 15, fontWeight: 800 }}>{busy ? 'Enregistrement…' : (item ? 'Enregistrer' : 'Ajouter au stock')}</button>
        </div>
      </div>
    </div>
  );
}

function StockCard({ s, onEdit, onDelete, onAdjust }) {
  const bas = stockBas(s);
  const etatMeta = s.etat === 'neuf' ? { label: 'Neuf', bg: c.greenSoft, fg: c.green } : { label: 'Occasion', bg: c.blueSoft, fg: c.blue };
  return (
    <div style={{ background: c.surface, border: `1px solid ${bas ? c.red : c.line}`, borderRadius: 15, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="num" style={{ fontSize: 16, fontWeight: 800, color: c.ink }}>{s.dimension}</div>
          <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>{s.marque || 'Sans marque'}{s.prix != null ? ` · ${s.prix} €` : ''}</div>
          {s.etat === 'occasion' && (
            <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{s.rechape ? 'Réchapé' : 'Non réchapé'} · usure <b className="num" style={{ color: c.ink }}>{s.usure ?? 0}%</b></div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <Badge meta={etatMeta} />
          {bas && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: c.red, fontSize: 11.5, fontWeight: 700 }}><AlertTriangle size={13} /> À recommander</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => onAdjust(s.id, -1)} aria-label="Retirer" style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.line}`, background: c.surface, color: c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
          <span className="num" style={{ minWidth: 42, textAlign: 'center', fontSize: 20, fontWeight: 800, color: bas ? c.red : c.ink }}>{s.quantite}</span>
          <button onClick={() => onAdjust(s.id, 1)} aria-label="Ajouter" style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: c.amber, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
          <span style={{ fontSize: 12, color: c.muted }}>en stock</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(s)} aria-label="Modifier" style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.line}`, background: c.surface, color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={15} /></button>
          <button onClick={() => onDelete(s.id)} aria-label="Supprimer" style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.line}`, background: c.surface, color: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  );
}

function StockView({ stock, onCreate, onUpdate, onDelete, onAdjust }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const filters = [{ k: 'all', label: 'Toutes' }, { k: 'neuf', label: 'Neuf' }, { k: 'occasion', label: 'Occasion' }, { k: 'bas', label: 'À recommander' }];
  const shown = stock.filter((s) => {
    const bf = filter === 'all' ? true : filter === 'bas' ? stockBas(s) : s.etat === filter;
    const bq = q.trim() === '' ? true : (`${s.dimension} ${s.marque || ''}`).toLowerCase().includes(q.toLowerCase());
    return bf && bq;
  }).sort((a, b) => (stockBas(b) - stockBas(a)) || a.dimension.localeCompare(b.dimension));

  const openNew = () => { setEditing(null); setModal(true); };
  const openEdit = (s) => { setEditing(s); setModal(true); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Stock</h1>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, background: c.amber, color: '#fff', border: 'none', borderRadius: 11, padding: '10px 15px', fontSize: 14, fontWeight: 700, flexShrink: 0 }}><Plus size={17} strokeWidth={2.4} /> Ajouter</button>
      </div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} color={c.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une dimension, une marque…" style={{ ...fieldStyle, paddingLeft: 38 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map((f) => { const on = filter === f.k; return <button key={f.k} onClick={() => setFilter(f.k)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.muted }}>{f.label}</button>; })}
      </div>
      {shown.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '40px 0' }}>Aucune référence. Cliquez sur « Ajouter » pour créer votre stock.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 11 }}>
        {shown.map((s) => <StockCard key={s.id} s={s} onEdit={openEdit} onDelete={onDelete} onAdjust={onAdjust} />)}
      </div>
      {modal && <StockModal item={editing} onClose={() => setModal(false)} onSubmit={editing ? (payload) => onUpdate(editing.id, payload) : onCreate} />}
    </div>
  );
}

function AdminShell({ profile, accounts, missions, invites, onCreate, onCopy, onStatus, onDelete, onAssign, onLogout, toast, onEnableAlerts, alertsState, stock, onStockCreate, onStockUpdate, onStockDelete, onStockAdjust, clientStock, onToggleAuth, onTakeCharge, onAdvance, onRegenLink, contact, onSaveContact }) {
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);
  const [pwd, setPwd] = useState(false);
  const aAssigner = missions.filter((m) => m.status === 'envoyee').length;
  const aRecommander = stock.filter(stockBas).length;
  const mesInterventions = missions.filter((m) => m.assignedTo === profile.id && m.status !== 'terminee').length;
  const nav = [
    { k: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
    { k: 'missions', label: 'Missions', Icon: ClipboardList, badge: aAssigner },
    { k: 'interventions', label: 'Mes interventions', Icon: Flag, badge: mesInterventions },
    { k: 'stock', label: 'Stock', Icon: Package, badge: aRecommander },
    { k: 'contact', label: 'Contact', Icon: Mail },
    { k: 'accounts', label: 'Comptes', Icon: Users },
  ];
  return (
    <div style={{ minHeight: '100dvh', background: c.paper }}>
      <header style={{ background: c.asphalt, color: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-emblem.png" alt="Guido" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div><div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1 }}>Guido</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Console admin</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {alertsState !== 'on' && (
              <button onClick={onEnableAlerts} style={{ display: 'flex', alignItems: 'center', gap: 6, background: c.amber, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}><BellRing size={15} /> Activer les alertes</button>
            )}
            <button onClick={() => setPwd(true)} aria-label="Mon compte" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 11px', fontSize: 13, fontWeight: 600 }}><KeyRound size={15} /></button>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 13px', fontSize: 13, fontWeight: 600 }}><LogOut size={15} /> Déconnexion</button>
          </div>
        </div>
        <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${c.hazard} 0 14px, ${c.ink} 14px 28px)` }} />
      </header>
      <nav style={{ background: c.surface, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px', display: 'flex', gap: 4 }}>
          {nav.map(({ k, label, Icon, badge }) => { const on = tab === k; return <button key={k} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', border: 'none', background: 'transparent', color: on ? c.ink : c.muted, fontSize: 14, fontWeight: on ? 700 : 500, borderBottom: `2.5px solid ${on ? c.amber : 'transparent'}` }}><Icon size={17} strokeWidth={on ? 2.3 : 1.9} /> {label}{badge ? <span style={{ background: c.red, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{badge}</span> : null}</button>; })}
        </div>
      </nav>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '22px 16px 40px' }}>
        {tab === 'dashboard' ? <Dashboard accounts={accounts} missions={missions} stock={stock} goMissions={() => setTab('missions')} goAccounts={() => setTab('accounts')} goStock={() => setTab('stock')} />
          : tab === 'missions' ? <AdminMissions missions={missions} accounts={accounts} onAssign={onAssign} onTakeCharge={onTakeCharge} />
          : tab === 'interventions' ? <MyInterventions missions={missions} profileId={profile.id} onAdvance={onAdvance} />
          : tab === 'stock' ? <StockView stock={stock} onCreate={onStockCreate} onUpdate={onStockUpdate} onDelete={onStockDelete} onAdjust={onStockAdjust} />
          : tab === 'contact' ? <AdminContact contact={contact} onSave={onSaveContact} />
          : <AccountsView accounts={accounts} invites={invites} onOpen={() => setModal(true)} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} stock={stock} clientStock={clientStock} onToggleAuth={onToggleAuth} onRegenLink={onRegenLink} />}
      </main>
      {modal && <CreateModal onClose={() => setModal(false)} onCreate={onCreate} />}
      {pwd && <PasswordModal onClose={() => setPwd(false)} />}
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
  const [stock, setStock] = useState([]);
  const [clientStock, setClientStock] = useState([]);
  const [contact, setContact] = useState(null);
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
      if (profile.type === 'admin') {
        const pending = list.filter((m) => m.status === 'envoyee');
        const fresh = pending.filter((m) => !seen.current.has('adm:' + m.id));
        if (!firstMissions.current && fresh.length) { setAlertMission(fresh[0]); beep(); }
        pending.forEach((m) => seen.current.add('adm:' + m.id));
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

  /* Stock (admin : gestion ; client : catalogue des offres) */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('stock').select('*').order('created_at', { ascending: false });
      if (active && data) setStock(data.map(mapStock));
    };
    load();
    const ch = supabase.channel('stock-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Autorisations pneus par client */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('client_stock').select('*');
      if (active && data) setClientStock(data);
    };
    load();
    const ch = supabase.channel('cs-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_stock' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Coordonnées de contact (tous rôles) */
  useEffect(() => {
    if (!profile) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('parametres').select('*').eq('id', 1).single();
      if (active && data) setContact({ email: data.contact_email, phone: data.contact_phone, adresse: data.contact_adresse });
    };
    load();
    const ch = supabase.channel('param-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parametres' }, load)
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
      fourniture: p.fourniture || null,
      stock_id: p.stockId || null,
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
  const takeCharge = async (id) => {
    // L'admin prend la mission : statut direct "prise_en_charge" (pas "assignee")
    // => le déclencheur d'appel (qui ne réagit qu'à "assignee") ne se déclenche pas : pas de double appel.
    await supabase.from('missions').update({ status: 'prise_en_charge', assigned_to: profile.id, assigned_name: 'Guido' }).eq('id', id);
    flash('Mission prise en charge');
  };
  const createAccount = async (data) => {
    const { data: res, error } = await supabase.functions.invoke('creer-compte', { body: data });
    if (error) return { error: error.message };
    if (res?.error) return { error: res.error };
    if (res?.profileId && res?.inviteLink) setInvites((x) => ({ ...x, [res.profileId]: res.inviteLink }));
    flash("Compte créé — lien d'invitation prêt");
    return { ok: true };
  };
  const regenLink = async (account) => {
    const { data: res, error } = await supabase.functions.invoke('regenerer-lien', { body: { email: account.email } });
    if (error) { flash('Erreur : ' + error.message); return; }
    if (res?.error) { flash('Erreur : ' + res.error); return; }
    if (res?.inviteLink) { setInvites((x) => ({ ...x, [account.id]: res.inviteLink })); flash('Nouveau lien généré'); }
  };
  const setStatus = async (id, status) => { await supabase.from('profiles').update({ status }).eq('id', id); };
  const removeAccount = async (id) => { await supabase.from('profiles').delete().eq('id', id); };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); flash('Lien copié'); } catch (_) { flash('Sélectionnez le lien pour le copier'); } };

  const stockCreate = async (payload) => {
    const { error } = await supabase.from('stock').insert(payload);
    if (error) return { error: error.message };
    flash('Référence ajoutée'); return { ok: true };
  };
  const stockUpdate = async (id, payload) => {
    const { error } = await supabase.from('stock').update(payload).eq('id', id);
    if (error) return { error: error.message };
    flash('Référence mise à jour'); return { ok: true };
  };
  const stockDelete = async (id) => { await supabase.from('stock').delete().eq('id', id); };
  const stockAdjust = async (id, delta) => {
    const item = stock.find((s) => s.id === id);
    if (!item) return;
    const q = Math.max(0, (item.quantite || 0) + delta);
    await supabase.from('stock').update({ quantite: q }).eq('id', id);
  };
  const authToggle = async (clientId, stockId, allowed) => {
    if (allowed) await supabase.from('client_stock').insert({ client_id: clientId, stock_id: stockId });
    else await supabase.from('client_stock').delete().eq('client_id', clientId).eq('stock_id', stockId);
  };
  const saveContact = async (fields) => {
    await supabase.from('parametres').update({ contact_email: fields.email, contact_phone: fields.phone, contact_adresse: fields.adresse, updated_at: new Date().toISOString() }).eq('id', 1);
    flash('Coordonnées mises à jour');
  };

  const enableAlerts = async () => {
    unlockAudio();
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
      onCreate={createAccount} onCopy={copy} onStatus={setStatus} onDelete={removeAccount} onAssign={assign} onLogout={logout} toast={toast}
      onEnableAlerts={enableAlerts} alertsState={alertsState}
      stock={stock} onStockCreate={stockCreate} onStockUpdate={stockUpdate} onStockDelete={stockDelete} onStockAdjust={stockAdjust}
      clientStock={clientStock} onToggleAuth={authToggle} onTakeCharge={takeCharge} onAdvance={advance} onRegenLink={regenLink} contact={contact} onSaveContact={saveContact} />
      {alertMission && (
        <AlarmOverlay
          mission={alertMission}
          title="NOUVELLE DEMANDE"
          actionLabel="J'ai vu — répartir"
          onAccept={async () => { setAlertMission(null); }}
        />
      )}
    </>;
  }

  return (
    <>
      <GlobalStyle />
      <FieldShell user={profile} onLogout={logout} contact={contact}>
        {profile.type === 'client'
          ? <ClientView missions={missions} onSend={createMission} stock={stock.filter((s) => clientStock.some((r) => r.stock_id === s.id))} />
          : <PrestataireView missions={missions} onAdvance={advance} alertMission={alertMission} onDismissAlert={() => setAlertMission(null)} onEnableAlerts={enableAlerts} alertsState={alertsState} />}
      </FieldShell>
      {toast && <div className="pop" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: c.ink, color: '#fff', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, zIndex: 60 }}>{toast}</div>}
    </>
  );
}
