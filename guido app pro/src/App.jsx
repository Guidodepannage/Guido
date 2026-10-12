import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Send, MapPin, Phone, CheckCircle2, Navigation, Flag, Bell, Radio,
  LayoutDashboard, Users, Plus, Search, Copy, Check, Power, Trash2,
  LogOut, ShieldCheck, X, Mail, Clock, UserPlus, ClipboardList, KeyRound, BellRing,
  Package, Minus, Pencil, AlertTriangle, Eye, EyeOff, Settings, Download, FileText,
  ArrowLeft, ChevronRight, CircleDot, Gauge
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
  champs: r.champs_perso || null,
});
const mapAccount = (p) => ({
  id: p.id, type: p.role, name: p.name, company: p.company,
  phone: p.phone, email: p.email, zone: p.zone, status: p.status,
  prenom: p.prenom, siret: p.siret, adresse: p.adresse,
  createdAt: new Date(p.created_at).getTime(),
});

const mapStock = (r) => ({
  id: r.id, dimension: r.dimension, marque: r.marque, etat: r.etat,
  quantite: r.quantite ?? 0, prix: r.prix, seuil: r.seuil,
  rechape: r.rechape, usure: r.usure,
  createdAt: new Date(r.created_at).getTime(),
});
const stockBas = (s) => s.etat === 'neuf' && s.seuil != null && s.quantite <= s.seuil;

const mapFacture = (r) => ({
  id: r.id, clientId: r.client_id, numero: r.numero,
  dateFacture: r.date_facture, path: r.fichier_path,
  createdAt: new Date(r.created_at).getTime(),
});

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
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'sent'
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // Champs d'inscription
  const [name, setName] = useState('');
  const [prenom, setPrenom] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [siret, setSiret] = useState('');
  const [adresse, setAdresse] = useState('');

  const submit = async () => {
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) setErr('E-mail ou mot de passe incorrect.');
  };

  const validSignup = name.trim() && prenom.trim() && company.trim() && email.trim() && pass.length >= 6;
  const signup = async () => {
    setErr(''); setBusy(true);
    const { data, error } = await supabase.functions.invoke('inscription-client', {
      body: { name: name.trim(), prenom: prenom.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), siret: siret.trim(), adresse: adresse.trim(), password: pass },
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data?.error) { setErr(data.error); return; }
    setMode('sent');
  };

  const shell = (inner) => (
    <div style={{ minHeight: '100dvh', background: c.asphalt, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 24, justifyContent: 'center' }}>
          <img src="/logo-emblem.png" alt="Guido" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Guido</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>Dépannage poids lourd</div></div>
        </div>
        <div style={{ background: c.surface, borderRadius: 18, padding: 22 }}>{inner}</div>
      </div>
    </div>
  );

  if (mode === 'sent') {
    return shell(
      <div style={{ textAlign: 'center', padding: '10px 4px' }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: c.greenSoft, color: c.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle2 size={30} /></div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: c.ink }}>Demande envoyée</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: c.muted, lineHeight: 1.5 }}>Votre compte a bien été créé. Il sera actif dès que Guido aura validé votre inscription. Vous pourrez alors vous connecter.</p>
        <button onClick={() => { setMode('login'); setErr(''); }} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: c.ink, color: '#fff', fontSize: 15, fontWeight: 800 }}>Retour à la connexion</button>
      </div>
    );
  }

  if (mode === 'signup') {
    return shell(
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><UserPlus size={18} color={c.amber} /><span style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>Créer un compte client</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Prénom</label><input style={fieldStyle} value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Nom</label><input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Société</label><input style={fieldStyle} value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          <div><label style={labelStyle}>E-mail</label><input style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@societe.fr" /></div>
          <div><label style={labelStyle}>Téléphone</label><input type="tel" style={fieldStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
          <div><label style={labelStyle}>SIRET</label><input style={fieldStyle} value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="14 chiffres" /></div>
          <div><label style={labelStyle}>Adresse postale</label><input style={fieldStyle} value={adresse} onChange={(e) => setAdresse(e.target.value)} /></div>
          <div><label style={labelStyle}>Mot de passe</label><input type="password" style={fieldStyle} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Au moins 6 caractères" /></div>
          {err && <div style={{ color: c.red, fontSize: 13 }}>{err}</div>}
          <button onClick={signup} disabled={!validSignup || busy} style={{ marginTop: 2, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: validSignup && !busy ? c.amber : c.line, color: validSignup && !busy ? '#fff' : c.muted, fontSize: 15, fontWeight: 800 }}>{busy ? 'Création…' : 'Créer mon compte'}</button>
          <button onClick={() => { setMode('login'); setErr(''); }} style={{ border: 'none', background: 'transparent', color: c.muted, fontSize: 13.5, fontWeight: 600 }}>← J'ai déjà un compte</button>
        </div>
      </div>
    );
  }

  return shell(
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><KeyRound size={18} color={c.amber} /><span style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>Connexion</span></div>
      <div style={{ marginBottom: 13 }}><label style={labelStyle}>Adresse e-mail</label>
        <input style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@societe.fr" onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
      <label style={labelStyle}>Mot de passe</label>
      <input type="password" style={fieldStyle} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div style={{ color: c.red, fontSize: 13, marginTop: 8 }}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: c.amber, color: '#fff', fontSize: 15, fontWeight: 800, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Connexion…' : 'Se connecter'}
      </button>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.line}`, textAlign: 'center' }}>
        <span style={{ fontSize: 13.5, color: c.muted }}>Pas encore client ? </span>
        <button onClick={() => { setMode('signup'); setErr(''); }} style={{ border: 'none', background: 'transparent', color: c.amberDark, fontSize: 13.5, fontWeight: 800 }}>Créer un compte</button>
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

function ClientView({ missions, onSend, stock = [], onEnableAlerts, alertsState, champs = [] }) {
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
  const [reponses, setReponses] = useState({});

  const setRep = (id, val) => setReponses((r) => ({ ...r, [id]: val }));
  const champsOk = (champs || []).every((ch) => !ch.obligatoire || (reponses[ch.id] != null && String(reponses[ch.id]).trim() !== ''));

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
  const valid = lieu.trim() && immat.trim() && tel.trim() && element && cote && essieu && (!needInout || inout) && fourniture && pneuOk && champsOk;

  const send = async () => {
    setBusy(true);
    // Construire les réponses lisibles (libellé -> valeur) pour l'admin
    const champsPerso = (champs || [])
      .map((ch) => ({ label: ch.label, valeur: reponses[ch.id] ?? '' }))
      .filter((x) => String(x.valeur).trim() !== '');
    const ok = await onSend({ lieu: lieu.trim(), immat: immat.trim().toUpperCase(), type: typeFinal, pos, tel: tel.trim(), message: message.trim(), fourniture, stockId: fourniture === 'guido' ? offreId : null, champsPerso: champsPerso.length ? champsPerso : null });
    setBusy(false);
    if (ok) {
      setLieu(''); setImmat(''); setType(''); setTel(''); setElement(''); setCote(''); setEssieu(null); setInout(''); setMessage(''); setFourniture(''); setDim(''); setOffreId(''); setReponses({});
      setSent(true); setTimeout(() => setSent(false), 2600);
    }
  };
  const chip = (label, active, onClick, key) => (
    <button key={key ?? label} onClick={onClick} style={{ padding: '9px 15px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: `1.5px solid ${active ? c.ink : c.line}`, background: active ? c.ink : c.surface, color: active ? '#fff' : c.ink }}>{label}</button>
  );
  const mine = [...missions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      {alertsState !== 'on' && (
        <button onClick={onEnableAlerts} style={{ width: '100%', marginBottom: 14, padding: '12px', borderRadius: 12, border: `1.5px solid ${c.amber}`, background: c.amberSoft, color: c.amberDark, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <BellRing size={17} /> Activer les alertes sur cet appareil
        </button>
      )}
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

            {(champs || []).map((ch) => (
              <div key={ch.id}>
                <label style={labelStyle}>{ch.label}{ch.obligatoire ? '' : ' (optionnel)'}</label>
                {ch.type === 'liste' ? (
                  <select style={fieldStyle} value={reponses[ch.id] || ''} onChange={(e) => setRep(ch.id, e.target.value)}>
                    <option value="">Choisir…</option>
                    {(ch.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : ch.type === 'oui_non' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Oui', 'Non'].map((o) => { const on = reponses[ch.id] === o; return <button key={o} type="button" onClick={() => setRep(ch.id, o)} style={{ flex: 1, padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: `1.5px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.ink }}>{o}</button>; })}
                  </div>
                ) : (
                  <input style={fieldStyle} value={reponses[ch.id] || ''} onChange={(e) => setRep(ch.id, e.target.value)} placeholder={ch.label} />
                )}
              </div>
            ))}

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

const VEHIC_TYPES = ['Tracteur', 'Porteur', 'Remorque', 'Semi-remorque'];
const mapVehicule = (r) => ({ id: r.id, clientId: r.client_id, immat: r.immat, vtype: r.vtype, essieux: Array.isArray(r.essieux) ? r.essieux : null, createdAt: new Date(r.created_at).getTime() });

/* ---- Pneus par véhicule (suivi de parc) ---- */
const mapPneu = (r) => ({ id: r.id, vehiculeId: r.vehicule_id, clientId: r.client_id, essieu: r.essieu, pos: r.pos, marque: r.marque, dimension: r.dimension, profondeur: r.profondeur, etat: r.etat, nature: r.nature });

/* Disposition d'essieux par défaut selon le type (modifiable ensuite) */
const ESSIEUX_DEFAUT = {
  'Tracteur': ['simple', 'jumele'],
  'Porteur': ['simple', 'jumele'],
  'Remorque': ['simple', 'simple'],
  'Semi-remorque': ['simple', 'simple', 'simple'],
};
const essieuxDe = (v) => (v.essieux && v.essieux.length ? v.essieux : (ESSIEUX_DEFAUT[v.vtype] || ['simple', 'jumele']));
/* Emplacements (codes + libellés courts) pour un type d'essieu */
const POS_SIMPLE = [{ code: 'G', lib: 'Gauche' }, { code: 'D', lib: 'Droite' }];
const POS_JUMELE = [{ code: 'GE', lib: 'G. ext.' }, { code: 'GI', lib: 'G. int.' }, { code: 'DI', lib: 'D. int.' }, { code: 'DE', lib: 'D. ext.' }];
const posDe = (type) => (type === 'jumele' ? POS_JUMELE : POS_SIMPLE);

const ETAT_PNEU = {
  neuf:       { label: 'Neuf',          bg: c.greenSoft, fg: c.green,    dot: c.green },
  bon:        { label: 'Bon',           bg: c.blueSoft,  fg: c.blue,     dot: c.blue },
  surveiller: { label: 'À surveiller',  bg: c.amberSoft, fg: c.amberDark, dot: c.amber },
  changer:    { label: 'À changer',     bg: c.redSoft,   fg: c.red,      dot: c.red },
};
const ETAT_LIST = [['neuf', 'Neuf'], ['bon', 'Bon'], ['surveiller', 'À surveiller'], ['changer', 'À changer']];
const NATURE_LIST = [['neuf', 'Neuf'], ['recreuse', 'Recreusé'], ['rechape', 'Réchappé'], ['rechape_recreuse', 'Réchappé + recreusé']];
const NATURE_LABEL = Object.fromEntries(NATURE_LIST);
const MARQUES_PL = ['Michelin', 'Continental', 'Bridgestone', 'Goodyear', 'Hankook', 'Pirelli', 'Dunlop', 'Firestone', 'Barum', 'Kormoran', 'Recamic', 'Bandvulc', 'Insa Turbo', 'Autre'];

/* Icônes silhouettes par type de véhicule (dessinées pour le poids lourd) */
function VehiculeIcon({ type, size = 22, color = '#fff' }) {
  const s = { width: size, height: size, display: 'block' };
  const w = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const roue = (cx) => <circle cx={cx} cy="18.5" r="2.3" fill={color} stroke="none" />;
  if (type === 'Tracteur') {
    // Cabine tractrice seule (camion court, sellette)
    return (
      <svg viewBox="0 0 32 24" style={s} xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16 V8 a2 2 0 0 1 2-2 h9 l4 4 v6" {...w} />
        <path d="M19 10 h5 l3 3 v3 h-8" {...w} />
        <path d="M4 16 h23" {...w} />
        {roue(9)}{roue(23)}
      </svg>
    );
  }
  if (type === 'Porteur') {
    // Camion porteur (cabine + caisse sur le même châssis)
    return (
      <svg viewBox="0 0 32 24" style={s} xmlns="http://www.w3.org/2000/svg">
        <path d="M3 16 V7 a1 1 0 0 1 1-1 h15 v10" {...w} />
        <path d="M19 9 h6 l4 3 v4 h-10" {...w} />
        <path d="M3 16 h26" {...w} />
        {roue(8)}{roue(24)}
      </svg>
    );
  }
  if (type === 'Remorque') {
    // Remorque (caisse sur roues, timon à l'avant)
    return (
      <svg viewBox="0 0 32 24" style={s} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 13 h3" {...w} />
        <rect x="5" y="5" width="23" height="11" rx="1" {...w} />
        {roue(12)}{roue(21)}
        <path d="M5 16 h23" {...w} />
      </svg>
    );
  }
  // Semi-remorque (tracteur + grande remorque attelée)
  return (
    <svg viewBox="0 0 34 24" style={s} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 15 V9 a1 1 0 0 1 1-1 h5 l3 3 v4" {...w} />
      <rect x="13" y="4" width="19" height="12" rx="1" {...w} />
      <path d="M11 13 h2" {...w} />
      {roue(5)}{roue(18)}{roue(27)}
      <path d="M2 15 h8 M13 16 h17" {...w} />
    </svg>
  );
}

/* Formulaire d'un pneu (une case d'emplacement) */
function PneuForm({ slot, readOnly = false, onClose, onSave, onClear }) {
  const p = slot.data || {};
  if (readOnly) {
    const m = p.etat ? ETAT_PNEU[p.etat] : null;
    const Ligne = ({ k, v }) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${c.line}` }}>
        <span style={{ fontSize: 13, color: c.muted, fontWeight: 600 }}>{k}</span>
        <span style={{ fontSize: 13.5, color: c.ink, fontWeight: 700, textAlign: 'right' }}>{v}</span>
      </div>
    );
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 80 }}>
        <div onClick={(e) => e.stopPropagation()} className="pop" style={{ width: '100%', maxWidth: 452, background: c.surface, borderRadius: '18px 18px 0 0', padding: '18px 18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: c.ink }}>Essieu {slot.essieu} · {slot.lib}</div>
            <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: c.paper, borderRadius: 9, padding: 7, display: 'flex' }}><X size={17} color={c.muted} /></button>
          </div>
          {!p.id ? (
            <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '24px 0' }}>Ce pneu n'est pas encore renseigné.</div>
          ) : (
            <div>
              <Ligne k="Marque" v={p.marque || '—'} />
              <Ligne k="Dimension" v={p.dimension || '—'} />
              <Ligne k="Profondeur de gomme" v={p.profondeur != null ? `${p.profondeur} mm` : '—'} />
              <Ligne k="État" v={m ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: m.bg, color: m.fg, borderRadius: 999, padding: '3px 10px', fontSize: 12.5, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: m.dot }} />{m.label}</span> : '—'} />
              <Ligne k="Nature" v={NATURE_LABEL[p.nature] || '—'} />
            </div>
          )}
        </div>
      </div>
    );
  }
  const [marque, setMarque] = useState(p.marque || '');
  const [dimension, setDimension] = useState(p.dimension || '');
  const [profondeur, setProfondeur] = useState(p.profondeur != null ? String(p.profondeur) : '');
  const [etat, setEtat] = useState(p.etat || 'bon');
  const [nature, setNature] = useState(p.nature || 'neuf');
  const [busy, setBusy] = useState(false);
  const existe = !!(slot.data && slot.data.id);

  const save = async () => {
    setBusy(true);
    await onSave({ marque: marque.trim(), dimension, profondeur: profondeur === '' ? null : Number(profondeur), etat, nature });
    setBusy(false);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 80, padding: 0 }}>
      <div onClick={(e) => e.stopPropagation()} className="pop" style={{ width: '100%', maxWidth: 452, background: c.surface, borderRadius: '18px 18px 0 0', padding: '18px 18px 24px', maxHeight: '92dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: c.ink }}>Essieu {slot.essieu} · {slot.lib}</div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: c.paper, borderRadius: 9, padding: 7, display: 'flex' }}><X size={17} color={c.muted} /></button>
        </div>

        <label style={labelStyle}>Marque</label>
        <input list="marques-pl" value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Ex. Michelin" style={{ ...fieldStyle, marginBottom: 13 }} />
        <datalist id="marques-pl">{MARQUES_PL.map((m) => <option key={m} value={m} />)}</datalist>

        <div style={{ display: 'flex', gap: 10, marginBottom: 13 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Dimension</label>
            <select value={dimension} onChange={(e) => setDimension(e.target.value)} style={fieldStyle}>
              <option value="">—</option>
              {POS_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ width: 120 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}><Gauge size={13} color={c.muted} /> Gomme</label>
            <div style={{ position: 'relative' }}>
              <input type="number" inputMode="decimal" step="0.5" min="0" value={profondeur} onChange={(e) => setProfondeur(e.target.value)} placeholder="8" style={{ ...fieldStyle, paddingRight: 34 }} />
              <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: c.muted, fontWeight: 600 }}>mm</span>
            </div>
          </div>
        </div>

        <label style={labelStyle}>État</label>
        <div style={{ ...chipRow, marginBottom: 14 }}>
          {ETAT_LIST.map(([v, lab]) => {
            const on = etat === v; const m = ETAT_PNEU[v];
            return <button key={v} onClick={() => setEtat(v)} style={{ border: `1.5px solid ${on ? m.dot : c.line}`, background: on ? m.bg : c.surface, color: on ? m.fg : c.muted, borderRadius: 999, padding: '7px 13px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: m.dot }} />{lab}</button>;
          })}
        </div>

        <label style={labelStyle}>Nature</label>
        <select value={nature} onChange={(e) => setNature(e.target.value)} style={{ ...fieldStyle, marginBottom: 18 }}>
          {NATURE_LIST.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
        </select>

        <button onClick={save} disabled={busy} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: busy ? c.line : c.amber, color: busy ? c.muted : '#fff', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: existe ? 10 : 0 }}><Check size={17} /> {busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {existe && (
          <button onClick={() => { onClear(); onClose(); }} style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1px solid ${c.line}`, background: c.surface, color: c.red, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Trash2 size={15} /> Vider cette case</button>
        )}
      </div>
    </div>
  );
}

/* Un pneu sur le schéma (vu de dessus) — cliquable */
function TyreTop({ pos, pneu, readOnly, onTap }) {
  const rempli = !!pneu;
  const m = rempli && pneu.etat ? ETAT_PNEU[pneu.etat] : null;
  const col = m ? m.dot : c.line;
  const disabled = readOnly && !rempli;
  const infos = rempli ? `${pos.lib} — ${pneu.marque || 'sans marque'}${pneu.dimension ? ' · ' + pneu.dimension : ''}${pneu.profondeur != null ? ' · ' + pneu.profondeur + ' mm' : ''}` : `${pos.lib} — non renseigné`;
  return (
    <button onClick={disabled ? undefined : onTap} disabled={disabled} title={infos} aria-label={infos} style={{
      width: 34, height: 50, borderRadius: 8, border: `2.5px ${rempli ? 'solid' : 'dashed'} ${rempli ? col : c.line}`,
      background: rempli ? '#fff' : c.paper, position: 'relative', zIndex: 1, flexShrink: 0, padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
    }}>
      <div style={{ position: 'absolute', inset: '7px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: rempli ? 0.28 : 0.18 }}>
        {[0, 1, 2].map((k) => <div key={k} style={{ height: 2.5, background: rempli ? col : c.muted, borderRadius: 2 }} />)}
      </div>
      {rempli
        ? <span style={{ fontSize: 11.5, fontWeight: 800, color: c.ink, zIndex: 1, background: '#fff', borderRadius: 4, padding: '0 2px' }}>{pneu.profondeur != null ? pneu.profondeur : '•'}</span>
        : <Plus size={15} color={c.muted} />}
    </button>
  );
}

/* Écran détaillé d'un véhicule : ses pneus par essieu */
function PneusVehicule({ vehicule, pneus = [], readOnly = false, onBack, onSaveConfig, onSaveTyre, onDeleteTyre }) {
  const essieux = essieuxDe(vehicule);
  const [slot, setSlot] = useState(null);
  const pneuAt = (essieu, pos) => pneus.find((p) => p.essieu === essieu && p.pos === pos) || null;
  const total = essieux.reduce((n, t) => n + posDe(t).length, 0);
  const remplis = pneus.length;
  const aChanger = pneus.filter((p) => p.etat === 'changer').length;

  const addEssieu = (type) => onSaveConfig([...essieux, type]);
  const removeLast = () => {
    if (!window.confirm(`Retirer l'essieu ${essieux.length} et ses pneus ?`)) return;
    onSaveConfig(essieux.slice(0, -1), essieux.length);
  };

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: c.muted, fontSize: 13.5, fontWeight: 700, padding: '2px 0', marginBottom: 12 }}><ArrowLeft size={17} /> Retour au parc</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '13px 15px', marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: c.asphalt, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><VehiculeIcon type={vehicule.vtype} size={26} /></div>
        <div style={{ flex: 1, minWidth: 0 }}><Plate value={vehicule.immat} /><div style={{ fontSize: 12.5, color: c.muted, marginTop: 4 }}>{vehicule.vtype}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.paper, border: `1px solid ${c.line}`, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700, color: c.ink }}><CircleDot size={13} color={c.muted} /> {remplis}/{total} pneus renseignés</span>
        {aChanger > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.redSoft, color: c.red, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}><AlertTriangle size={13} /> {aChanger} à changer</span>}
      </div>

      {essieux.length === 0 ? (
        <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '34px 16px', background: c.surface, borderRadius: 16, border: `1px dashed ${c.line}` }}>
          Aucun essieu. {readOnly ? '' : 'Ajoutez-en un ci-dessous.'}
        </div>
      ) : (
        <div style={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: '16px 10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: c.muted, letterSpacing: '0.12em' }}>AVANT</div>
          <div style={{ width: 56, height: 30, borderRadius: '11px 11px 5px 5px', background: c.asphalt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}><VehiculeIcon type={vehicule.vtype} size={20} /></div>
          {essieux.map((type, i) => {
            const num = i + 1;
            const ps = posDe(type);
            const half = ps.length / 2;
            const left = ps.slice(0, half);
            const right = ps.slice(half);
            const tyre = (pos) => (
              <TyreTop key={pos.code} pos={pos} pneu={pneuAt(num, pos.code)} readOnly={readOnly}
                onTap={() => setSlot({ essieu: num, pos: pos.code, lib: pos.lib, data: pneuAt(num, pos.code) })} />
            );
            return (
              <React.Fragment key={num}>
                <div style={{ width: 12, height: 20, background: c.asphalt }} />
                <div style={{ fontSize: 10.5, fontWeight: 700, color: c.muted, marginBottom: 7 }}>Essieu {num}</div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <div style={{ position: 'absolute', left: '13%', right: '13%', height: 7, background: c.asphalt, borderRadius: 4, zIndex: 0 }} />
                  <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>{left.map(tyre)}</div>
                  <div style={{ width: 15, height: 15, borderRadius: 4, background: c.asphalt, margin: '0 12px', zIndex: 1, flexShrink: 0 }} />
                  <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>{right.map(tyre)}</div>
                </div>
              </React.Fragment>
            );
          })}
          <div style={{ width: 12, height: 16, background: c.asphalt, marginTop: 2 }} />
          <div style={{ fontSize: 10.5, fontWeight: 800, color: c.muted, letterSpacing: '0.12em', marginTop: 6 }}>ARRIÈRE</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, justifyContent: 'center', marginTop: 16, paddingTop: 13, borderTop: `1px solid ${c.line}`, width: '100%' }}>
            {ETAT_LIST.map(([v, lab]) => <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: c.muted, fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: ETAT_PNEU[v].dot }} />{lab}</span>)}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: c.muted, marginTop: 9, lineHeight: 1.4 }}>
            Le chiffre = profondeur (mm).{readOnly ? ' Touchez un pneu pour voir le détail.' : ' Touchez un pneu pour le renseigner.'}
          </div>
        </div>
      )}

      {!readOnly && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${c.line}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.muted, marginBottom: 9 }}>Modifier la disposition</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => addEssieu('simple')} style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.ink, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Essieu simple</button>
            <button onClick={() => addEssieu('jumele')} style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.ink, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Essieu jumelé</button>
            {essieux.length > 0 && <button onClick={removeLast} style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.red, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Minus size={15} /> Retirer le dernier</button>}
          </div>
        </div>
      )}

      {slot && (
        <PneuForm slot={slot} readOnly={readOnly} onClose={() => setSlot(null)}
          onSave={(fields) => onSaveTyre({ essieu: slot.essieu, pos: slot.pos, ...fields })}
          onClear={() => slot.data && onDeleteTyre(slot.data)} />
      )}
    </div>
  );
}

function ParcClient({ vehicules = [], pneus = [] }) {
  const [sel, setSel] = useState(null);
  const liste = [...vehicules].sort((a, b) => (a.immat || '').localeCompare(b.immat || ''));
  const vehic = sel ? liste.find((v) => v.id === sel) : null;
  if (vehic) return <PneusVehicule vehicule={vehic} pneus={pneus.filter((p) => p.vehiculeId === vehic.id)} readOnly onBack={() => setSel(null)} />;
  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: c.ink }}>Mon parc</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13.5, color: c.muted }}>Vos véhicules suivis par Guido.</p>
      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '44px 16px', background: c.surface, borderRadius: 16, border: `1px dashed ${c.line}`, lineHeight: 1.6 }}>
          <Truck size={34} color={c.line} style={{ marginBottom: 10 }} /><br />
          Aucun véhicule enregistré pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {liste.map((v) => {
            const np = pneus.filter((p) => p.vehiculeId === v.id).length;
            return (
              <button key={v.id} onClick={() => setSel(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '14px 15px', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: c.asphalt, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><VehiculeIcon type={v.vtype} size={26} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Plate value={v.immat} />
                  <div style={{ fontSize: 12.5, color: c.muted, marginTop: 5 }}>{v.vtype}{np > 0 ? ` · ${np} pneu${np > 1 ? 's' : ''}` : ''}</div>
                </div>
                <ChevronRight size={18} color={c.muted} style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParcAdmin({ accounts, parcClients, vehicules, pneus = [], onAdd, onDelete, onSaveConfig, onSaveTyre, onDeleteTyre }) {
  const clients = accounts.filter((a) => a.type === 'client' && parcClients.includes(a.id)).sort((a, b) => (a.company || '').localeCompare(b.company || ''));
  const [clientId, setClientId] = useState('');
  const [immat, setImmat] = useState('');
  const [vtype, setVtype] = useState('Tracteur');
  const [busy, setBusy] = useState(false);
  const [selVeh, setSelVeh] = useState(null);
  const client = clients.find((cl) => cl.id === clientId);
  const liste = vehicules.filter((v) => v.clientId === clientId).sort((a, b) => (a.immat || '').localeCompare(b.immat || ''));
  const valid = clientId && immat.trim();

  const ajouter = async () => {
    setBusy(true);
    await onAdd({ clientId, immat: immat.trim().toUpperCase(), vtype });
    setBusy(false);
    setImmat('');
  };

  const vehic = selVeh ? vehicules.find((v) => v.id === selVeh) : null;
  if (vehic) return (
    <PneusVehicule vehicule={vehic} pneus={pneus.filter((p) => p.vehiculeId === vehic.id)}
      onBack={() => setSelVeh(null)}
      onSaveConfig={(essieux, removeNum) => onSaveConfig(vehic.id, essieux, removeNum)}
      onSaveTyre={(fields) => onSaveTyre({ vehiculeId: vehic.id, clientId: vehic.clientId, ...fields })}
      onDeleteTyre={onDeleteTyre} />
  );

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Suivi de parc</h1>

      {clients.length === 0 ? (
        <div style={{ background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 12, padding: '13px 15px', fontSize: 13.5, color: c.ink }}>
          Aucun client n'a le suivi de parc activé. Activez-le depuis l'onglet <b>Comptes</b> (bouton « Suivi de parc » sur une fiche client).
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color={c.muted} /> Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={fieldStyle}>
              <option value="">Choisir un client…</option>
              {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.company} — {cl.name}</option>)}
            </select>
          </div>

          {client && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>Ajouter un véhicule</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Immatriculation</label>
                    <input style={{ ...fieldStyle, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'ui-monospace, Menlo, monospace' }} value={immat} onChange={(e) => setImmat(e.target.value.toUpperCase())} placeholder="AB-123-CD" /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Type</label>
                    <select style={fieldStyle} value={vtype} onChange={(e) => setVtype(e.target.value)}>
                      {VEHIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                </div>
                <button onClick={ajouter} disabled={!valid || busy} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Plus size={17} /> {busy ? 'Ajout…' : 'Ajouter au parc'}</button>
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Parc de {client.company} ({liste.length})</div>
              {liste.length === 0 ? (
                <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '30px 0' }}>Aucun véhicule pour ce client.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {liste.map((v) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 13, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 13, padding: '12px 14px' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: c.asphalt, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><VehiculeIcon type={v.vtype} size={23} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}><Plate value={v.immat} /><div style={{ fontSize: 12.5, color: c.muted, marginTop: 4 }}>{v.vtype}</div></div>
                      <button onClick={() => onDelete(v)} aria-label="Supprimer" style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.red, borderRadius: 9, padding: '8px 10px', display: 'flex', alignItems: 'center' }}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function FieldShell({ user, children, onLogout, contact, factures = [], onFactureOpen, parcAutorise = false, vehicules = [], pneusVeh = [] }) {
  const [view, setView] = useState('main');
  const [pwd, setPwd] = useState(false);
  const isClient = user.type === 'client';
  const navItems = [
    { k: 'main', label: 'Accueil', Icon: LayoutDashboard },
    ...(isClient ? [{ k: 'factures', label: 'Factures', Icon: FileText }] : []),
    ...(isClient && parcAutorise ? [{ k: 'parc', label: 'Mon parc', Icon: Truck }] : []),
    { k: 'contact', label: 'Contact', Icon: Mail },
  ];
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
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 28px' }}>{view === 'main' ? children : view === 'factures' ? <FacturesClient factures={factures} onOpen={onFactureOpen} /> : view === 'parc' ? <ParcClient vehicules={vehicules} pneus={pneusVeh} /> : <ContactView contact={contact} />}</main>
        <nav style={{ display: 'flex', borderTop: `1px solid ${c.line}`, background: c.surface }}>
          {navItems.map((t) => {
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

function ChampsModal({ client, champs, onSave, onClose }) {
  const [liste, setListe] = useState(champs && champs.length ? champs : []);
  const [busy, setBusy] = useState(false);
  // Nouveau champ en cours de création
  const [label, setLabel] = useState('');
  const [ftype, setFtype] = useState('texte');
  const [oblig, setOblig] = useState(false);
  const [optionsTxt, setOptionsTxt] = useState('');

  const ajouter = () => {
    if (!label.trim()) return;
    const champ = {
      id: 'c' + Date.now(),
      label: label.trim(),
      type: ftype,
      obligatoire: oblig,
      options: ftype === 'liste' ? optionsTxt.split(',').map((o) => o.trim()).filter(Boolean) : [],
    };
    if (ftype === 'liste' && champ.options.length === 0) return;
    setListe([...liste, champ]);
    setLabel(''); setFtype('texte'); setOblig(false); setOptionsTxt('');
  };
  const retirer = (id) => setListe(liste.filter((c2) => c2.id !== id));
  const enregistrer = async () => { setBusy(true); await onSave(client.id, liste); setBusy(false); onClose(); };

  const typeLabel = { texte: 'Texte libre', liste: 'Liste de choix', oui_non: 'Oui / Non' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: c.surface, borderRadius: 18, padding: 22, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ClipboardList size={19} color={c.amber} /><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c.ink }}>Champs personnalisés</h2></div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', color: c.muted }}><X size={20} /></button>
        </div>
        <div style={{ fontSize: 13, color: c.muted, marginBottom: 16 }}>Champs supplémentaires affichés dans le formulaire de <b style={{ color: c.ink }}>{client.company}</b>.</div>

        {liste.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {liste.map((ch) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.paper, borderRadius: 11, padding: '10px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{ch.label}{ch.obligatoire && <span style={{ color: c.red }}> *</span>}</div>
                  <div style={{ fontSize: 12, color: c.muted }}>{typeLabel[ch.type]}{ch.type === 'liste' && ch.options?.length ? ` : ${ch.options.join(', ')}` : ''}</div>
                </div>
                <button onClick={() => retirer(ch.id)} aria-label="Retirer" style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.red, borderRadius: 9, padding: '7px 9px' }}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: c.paper, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: c.ink, marginBottom: 11 }}>Ajouter un champ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div><label style={labelStyle}>Libellé du champ</label><input style={fieldStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. N° de commande" /></div>
            <div><label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ k: 'texte', l: 'Texte' }, { k: 'liste', l: 'Liste' }, { k: 'oui_non', l: 'Oui/Non' }].map((t) => { const on = ftype === t.k; return <button key={t.k} onClick={() => setFtype(t.k)} style={{ flex: 1, padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: `1.5px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.ink }}>{t.l}</button>; })}
              </div></div>
            {ftype === 'liste' && (
              <div><label style={labelStyle}>Options (séparées par une virgule)</label><input style={fieldStyle} value={optionsTxt} onChange={(e) => setOptionsTxt(e.target.value)} placeholder="Ex. Tracteur, Porteur, Remorque" /></div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: c.ink, cursor: 'pointer' }}>
              <input type="checkbox" checked={oblig} onChange={(e) => setOblig(e.target.checked)} style={{ width: 17, height: 17, accentColor: c.amber }} /> Champ obligatoire
            </label>
            <button onClick={ajouter} disabled={!label.trim()} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: label.trim() ? c.amber : c.line, color: label.trim() ? '#fff' : c.muted, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={16} /> Ajouter ce champ</button>
          </div>
        </div>

        <button onClick={enregistrer} disabled={busy} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: busy ? c.line : c.ink, color: busy ? c.muted : '#fff', fontSize: 15, fontWeight: 800 }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </div>
  );
}

function AccountCard({ a, inviteLink, onCopy, onStatus, onDelete, onManagePneus, nbPneus, onRegenLink, onManageChamps, nbChamps, parcActif, onToggleParc }) {
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
      {a.status === 'invite' && a.type === 'client' && (a.siret || a.adresse || a.phone) && (
        <div style={{ borderTop: `1px solid ${c.line}`, padding: '10px 15px', background: c.paper, fontSize: 12.5, color: c.muted, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(a.prenom || a.name) && <div>Contact : <b style={{ color: c.ink }}>{[a.prenom, a.name].filter(Boolean).join(' ')}</b></div>}
          {a.phone && <div>Tél : <span className="num" style={{ color: c.ink }}>{a.phone}</span></div>}
          {a.siret && <div>SIRET : <span className="num" style={{ color: c.ink }}>{a.siret}</span></div>}
          {a.adresse && <div>Adresse : <span style={{ color: c.ink }}>{a.adresse}</span></div>}
        </div>
      )}
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
      {a.type === 'client' && (
        <button onClick={() => onManageChamps(a)} style={{ width: '100%', borderTop: `1px solid ${c.line}`, border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: c.line, background: c.paper, color: c.amberDark, padding: '11px', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <ClipboardList size={16} /> Champs du formulaire{nbChamps ? ` (${nbChamps})` : ''}
        </button>
      )}
      {a.type === 'client' && (
        <button onClick={() => onToggleParc(a, !parcActif)} style={{ width: '100%', borderTop: `1px solid ${c.line}`, border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: c.line, background: parcActif ? c.greenSoft : c.paper, color: parcActif ? c.green : c.muted, padding: '11px', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Truck size={16} /> Suivi de parc {parcActif ? '· activé ✓' : '· désactivé'}
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

function MissionAdminCard({ m, prestataires, onAssign, onTakeCharge, onDecline }) {
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
      {Array.isArray(m.champs) && m.champs.length > 0 && (
        <div style={{ marginTop: 10, background: c.paper, borderRadius: 10, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.champs.map((ch, i) => <div key={i} style={{ fontSize: 12.5, color: c.muted }}>{ch.label} : <b style={{ color: c.ink }}>{ch.valeur}</b></div>)}
        </div>
      )}
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
          <button onClick={() => onDecline(m)} style={{ display: 'block', margin: '12px auto 0', border: 'none', background: 'transparent', color: c.red, fontSize: 12.5, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>Décliner cette demande</button>
        </div>
      ) : m.status === 'declinee' ? (
        <div style={{ marginTop: 12, fontSize: 13, color: c.red, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <X size={15} color={c.red} /> Demande déclinée
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 13, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} color={c.green} /> {m.status === 'terminee' ? 'Terminée par' : 'Prise en charge par'} <b style={{ color: c.green }}>{m.assignedName}</b>
        </div>
      )}
    </div>
  );
}

function AdminMissions({ missions, accounts, onAssign, onTakeCharge, stock = [], onDecline }) {
  const [filter, setFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [periode, setPeriode] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const prestataires = accounts.filter((a) => a.type === 'prestataire' && a.status === 'actif');
  const clients = accounts.filter((a) => a.type === 'client').sort((a, b) => (a.company || '').localeCompare(b.company || ''));
  const filters = [{ k: 'all', label: 'Toutes' }, { k: 'todo', label: 'À assigner' }, { k: 'progress', label: 'En cours' }, { k: 'done', label: 'Terminées' }, { k: 'declined', label: 'Déclinées' }];
  const periodes = [{ k: 'all', label: 'Toute période' }, { k: 'today', label: "Aujourd'hui" }, { k: '7', label: '7 jours' }, { k: '30', label: '30 jours' }, { k: '90', label: '3 mois' }];

  const now = new Date();
  const bornePeriode = (m) => {
    if (dateDebut || dateFin) {
      const d = new Date(m.createdAt);
      if (dateDebut && d < new Date(dateDebut + 'T00:00:00')) return false;
      if (dateFin && d > new Date(dateFin + 'T23:59:59')) return false;
      return true;
    }
    if (periode === 'all') return true;
    if (periode === 'today') { const d = new Date(m.createdAt); return d.toDateString() === now.toDateString(); }
    const jours = parseInt(periode, 10);
    return m.createdAt >= now.getTime() - jours * 86400000;
  };

  const shown = missions.filter((m) => {
    if (clientFilter && m.clientId !== clientFilter) return false;
    if (!bornePeriode(m)) return false;
    if (filter === 'todo') return m.status === 'envoyee';
    if (filter === 'progress') return m.status === 'assignee' || m.status === 'prise_en_charge';
    if (filter === 'done') return m.status === 'terminee';
    if (filter === 'declined') return m.status === 'declinee';
    // Vue "Toutes" : on masque les déclinées (visibles via leur filtre dédié)
    return m.status !== 'declinee';
  }).sort((a, b) => b.createdAt - a.createdAt);
  const clientChoisi = clients.find((cl) => cl.id === clientFilter);
  const datesActives = dateDebut || dateFin;

  const exporter = () => {
    const entete = ['Date', 'Client', 'Lieu', 'Immatriculation', 'Type de pneu', 'Position', 'Fourniture', 'Pneu commandé', 'Prix (€)', 'Intervenant', 'Statut'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lignes = shown.map((m) => {
      const ref = m.stockId ? stock.find((s) => s.id === m.stockId) : null;
      const fourn = m.fourniture === 'guido' ? 'Commande Guido' : (m.fourniture === 'client' ? 'Client équipé' : '');
      const pneuCmd = m.fourniture === 'guido' ? m.type : '';
      const prix = m.fourniture === 'guido' && ref?.prix != null ? String(ref.prix).replace('.', ',') : '';
      return [
        new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        m.clientCompany, m.lieu, m.immat, m.type, m.pos, fourn, pneuCmd, prix,
        m.assignedName || '', STATUS_META[m.status]?.label || m.status,
      ].map(esc).join(';');
    });
    const csv = '\uFEFF' + [entete.map(esc).join(';'), ...lignes].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffixe = clientChoisi ? '-' + clientChoisi.company.replace(/[^a-z0-9]/gi, '_') : '';
    a.href = url; a.download = `missions-guido${suffixe}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Missions</h1>
        <button onClick={exporter} disabled={shown.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 7, background: shown.length ? c.ink : c.line, color: shown.length ? '#fff' : c.muted, border: 'none', borderRadius: 11, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, flexShrink: 0 }}><Download size={16} /> Exporter</button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color={c.muted} /> Filtrer par client</label>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={fieldStyle}>
          <option value="">Tous les clients</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.company} — {cl.name}</option>)}
        </select>
      </div>

      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color={c.muted} /> Période</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {periodes.map((p) => { const on = !datesActives && periode === p.k; return <button key={p.k} onClick={() => { setPeriode(p.k); setDateDebut(''); setDateFin(''); }} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.amber : c.line}`, background: on ? c.amberSoft : c.surface, color: on ? c.amberDark : c.muted }}>{p.label}</button>; })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPeriode('all'); }} style={{ ...fieldStyle, flex: 1, padding: '9px 10px', fontSize: 13 }} />
        <span style={{ color: c.muted, fontSize: 13 }}>au</span>
        <input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPeriode('all'); }} style={{ ...fieldStyle, flex: 1, padding: '9px 10px', fontSize: 13 }} />
        {datesActives && <button onClick={() => { setDateDebut(''); setDateFin(''); }} aria-label="Effacer les dates" style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.muted, borderRadius: 9, padding: '9px 10px' }}><X size={15} /></button>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {filters.map((f) => { const on = filter === f.k; return <button key={f.k} onClick={() => setFilter(f.k)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${on ? c.ink : c.line}`, background: on ? c.ink : c.surface, color: on ? '#fff' : c.muted }}>{f.label}</button>; })}
      </div>
      {clientChoisi && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: c.blueSoft, borderRadius: 11, padding: '10px 13px', marginBottom: 14 }}>
        <span style={{ fontSize: 13.5, color: c.ink }}>Historique de <b>{clientChoisi.company}</b> · {shown.length} mission{shown.length > 1 ? 's' : ''}</span>
        <button onClick={() => setClientFilter('')} style={{ border: 'none', background: 'transparent', color: c.blue, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><X size={14} /> Effacer</button>
      </div>}
      {prestataires.length === 0 && <div style={{ background: c.amberSoft, border: `1px solid ${c.hazard}`, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: c.ink, marginBottom: 14 }}>Astuce : créez un compte prestataire pour répartir, ou prenez la mission en charge vous-même.</div>}
      {shown.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '40px 0' }}>Aucune mission ne correspond à ces filtres.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((m) => <MissionAdminCard key={m.id} m={m} prestataires={prestataires} onAssign={onAssign} onTakeCharge={onTakeCharge} onDecline={onDecline} />)}
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

function AccountsView({ accounts, invites, onOpen, onCopy, onStatus, onDelete, stock = [], clientStock = [], onToggleAuth, onRegenLink, champsConfig = {}, onSaveChamps, parcClients = [], onToggleParc }) {
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState('');
  const [pneusClient, setPneusClient] = useState(null);
  const [champsClient, setChampsClient] = useState(null);
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
        {shown.map((a) => <AccountCard key={a.id} a={a} inviteLink={invites[a.id]} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} onManagePneus={setPneusClient} nbPneus={a.type === 'client' ? authIdsFor(a.id).length : 0} onRegenLink={onRegenLink} onManageChamps={setChampsClient} nbChamps={a.type === 'client' ? (champsConfig[a.id]?.length || 0) : 0} parcActif={parcClients.includes(a.id)} onToggleParc={onToggleParc} />)}
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
      {champsClient && (
        <ChampsModal
          client={champsClient}
          champs={champsConfig[champsClient.id] || []}
          onSave={onSaveChamps}
          onClose={() => setChampsClient(null)}
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

/* ================================================================== */
/*  FACTURES                                                          */
/* ================================================================== */
function FacturesAdmin({ factures, accounts, onUpload, onDelete, onOpen }) {
  const clients = accounts.filter((a) => a.type === 'client').sort((a, b) => (a.company || '').localeCompare(b.company || ''));
  const [clientId, setClientId] = useState('');
  const [numero, setNumero] = useState('');
  const [dateF, setDateF] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [filtreClient, setFiltreClient] = useState('');
  const valid = clientId && numero.trim() && dateF && file;

  const submit = async () => {
    setBusy(true); setErr('');
    const res = await onUpload({ clientId, numero: numero.trim(), dateF, file });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setNumero(''); setFile(null); setClientId('');
    const input = document.getElementById('facture-file'); if (input) input.value = '';
  };

  const liste = factures
    .filter((f) => !filtreClient || f.clientId === filtreClient)
    .sort((a, b) => b.createdAt - a.createdAt);
  const nomClient = (id) => { const c2 = clients.find((x) => x.id === id); return c2 ? c2.company : '—'; };

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 23, fontWeight: 800, color: c.ink, letterSpacing: '-0.02em' }}>Factures</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>Déposer une facture</div>
        <div><label style={labelStyle}>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={fieldStyle}>
            <option value="">Choisir un client…</option>
            {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.company} — {cl.name}</option>)}
          </select></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>N° de facture</label><input style={fieldStyle} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex. 2026-042" /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Date</label><input type="date" style={fieldStyle} value={dateF} onChange={(e) => setDateF(e.target.value)} /></div>
        </div>
        <div><label style={labelStyle}>Fichier PDF</label>
          <input id="facture-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...fieldStyle, padding: '9px 10px' }} /></div>
        {err && <div style={{ color: c.red, fontSize: 13 }}>{err}</div>}
        <button onClick={submit} disabled={!valid || busy} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: valid && !busy ? c.amber : c.line, color: valid && !busy ? '#fff' : c.muted, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FileText size={17} /> {busy ? 'Dépôt en cours…' : 'Déposer la facture'}</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color={c.muted} /> Filtrer par client</label>
        <select value={filtreClient} onChange={(e) => setFiltreClient(e.target.value)} style={fieldStyle}>
          <option value="">Tous les clients</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.company}</option>)}
        </select>
      </div>
      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '30px 0' }}>Aucune facture déposée.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {liste.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: c.surface, border: `1px solid ${c.line}`, borderRadius: 13, padding: '12px 14px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: c.redSoft, color: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={19} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Facture {f.numero}</div>
                <div style={{ fontSize: 12.5, color: c.muted }}>{nomClient(f.clientId)} · {new Date(f.dateFacture).toLocaleDateString('fr-FR')}</div>
              </div>
              <button onClick={() => onOpen(f)} aria-label="Ouvrir" style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.ink, borderRadius: 9, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700 }}><Eye size={15} /> Voir</button>
              <button onClick={() => onDelete(f)} aria-label="Supprimer" style={{ border: `1px solid ${c.line}`, background: c.surface, color: c.red, borderRadius: 9, padding: '8px 10px', display: 'flex', alignItems: 'center' }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacturesClient({ factures, onOpen }) {
  const liste = [...factures].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: c.ink }}>Mes factures</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13.5, color: c.muted }}>Retrouvez et téléchargez vos factures Guido.</p>
      {liste.length === 0 ? (
        <div style={{ textAlign: 'center', color: c.muted, fontSize: 14, padding: '40px 0', background: c.surface, borderRadius: 14, border: `1px dashed ${c.line}` }}>Aucune facture disponible pour le moment.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {liste.map((f) => (
            <button key={f.id} onClick={() => onOpen(f)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', background: c.surface, border: `1px solid ${c.line}`, borderRadius: 14, padding: '14px 15px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: c.redSoft, color: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={21} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: c.ink }}>Facture {f.numero}</div>
                <div style={{ fontSize: 12.5, color: c.muted }}>{new Date(f.dateFacture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <Download size={18} color={c.amber} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminShell({ profile, accounts, missions, invites, onCreate, onCopy, onStatus, onDelete, onAssign, onLogout, toast, onEnableAlerts, alertsState, stock, onStockCreate, onStockUpdate, onStockDelete, onStockAdjust, clientStock, onToggleAuth, onTakeCharge, onAdvance, onRegenLink, contact, onSaveContact, onDecline, factures, onFactureUpload, onFactureDelete, onFactureOpen, champsConfig, onSaveChamps, parcClients, onToggleParc, vehicules, onVehiculeAdd, onVehiculeDelete, pneusVeh, onPneuConfig, onPneuSave, onPneuDelete }) {
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
    { k: 'parc', label: 'Suivi de parc', Icon: Truck },
    { k: 'factures', label: 'Factures', Icon: FileText },
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
          : tab === 'missions' ? <AdminMissions missions={missions} accounts={accounts} onAssign={onAssign} onTakeCharge={onTakeCharge} stock={stock} onDecline={onDecline} />
          : tab === 'interventions' ? <MyInterventions missions={missions} profileId={profile.id} onAdvance={onAdvance} />
          : tab === 'stock' ? <StockView stock={stock} onCreate={onStockCreate} onUpdate={onStockUpdate} onDelete={onStockDelete} onAdjust={onStockAdjust} />
          : tab === 'parc' ? <ParcAdmin accounts={accounts} parcClients={parcClients} vehicules={vehicules} pneus={pneusVeh} onAdd={onVehiculeAdd} onDelete={onVehiculeDelete} onSaveConfig={onPneuConfig} onSaveTyre={onPneuSave} onDeleteTyre={onPneuDelete} />
          : tab === 'factures' ? <FacturesAdmin factures={factures} accounts={accounts} onUpload={onFactureUpload} onDelete={onFactureDelete} onOpen={onFactureOpen} />
          : tab === 'contact' ? <AdminContact contact={contact} onSave={onSaveContact} />
          : <AccountsView accounts={accounts} invites={invites} onOpen={() => setModal(true)} onCopy={onCopy} onStatus={onStatus} onDelete={onDelete} stock={stock} clientStock={clientStock} onToggleAuth={onToggleAuth} onRegenLink={onRegenLink} champsConfig={champsConfig} onSaveChamps={onSaveChamps} parcClients={parcClients} onToggleParc={onToggleParc} />}
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
  const [factures, setFactures] = useState([]);
  const [champsConfig, setChampsConfig] = useState({});
  const [parcClients, setParcClients] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [pneusVeh, setPneusVeh] = useState([]);
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

  /* Factures (admin : toutes ; client : les siennes via RLS) */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('factures').select('*').order('created_at', { ascending: false });
      if (active && data) setFactures(data.map(mapFacture));
    };
    load();
    const ch = supabase.channel('factures-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Champs personnalisés par client */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('client_champs').select('*');
      if (active && data) {
        const map = {};
        data.forEach((r) => { map[r.client_id] = r.champs || []; });
        setChampsConfig(map);
      }
    };
    load();
    const ch = supabase.channel('champs-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_champs' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Suivi de parc : clients autorisés */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('parc_clients').select('client_id');
      if (active && data) setParcClients(data.map((r) => r.client_id));
    };
    load();
    const ch = supabase.channel('parc-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parc_clients' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Véhicules (admin : tous ; client : les siens via RLS) */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('vehicules').select('*');
      if (active && data) setVehicules(data.map(mapVehicule));
    };
    load();
    const ch = supabase.channel('vehic-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicules' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [profile]);

  /* Pneus par véhicule (admin : tous ; client : les siens via RLS) */
  useEffect(() => {
    if (profile?.type !== 'admin' && profile?.type !== 'client') return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('pneus_vehicule').select('*');
      if (active && data) setPneusVeh(data.map(mapPneu));
    };
    load();
    const ch = supabase.channel('pneusveh-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pneus_vehicule' }, load)
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
      champs_perso: p.champsPerso || null,
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
  const decline = async (m) => {
    if (!window.confirm(`Décliner la demande de ${m.clientCompany} (${m.immat}) ?\nLe client en sera informé et la mission n'apparaîtra plus dans vos interventions.`)) return;
    await supabase.from('missions').update({ status: 'declinee' }).eq('id', m.id);
    flash('Demande déclinée');
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

  const factureUpload = async ({ clientId, numero, dateF, file }) => {
    try {
      if (file.type !== 'application/pdf') return { error: 'Le fichier doit être un PDF.' };
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${clientId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('factures').upload(path, file, { contentType: 'application/pdf' });
      if (upErr) return { error: upErr.message };
      const { error: insErr } = await supabase.from('factures').insert({ client_id: clientId, numero, date_facture: dateF, fichier_path: path });
      if (insErr) { await supabase.storage.from('factures').remove([path]); return { error: insErr.message }; }
      flash('Facture déposée');
      return { ok: true };
    } catch (e) { return { error: String(e) }; }
  };
  const factureDelete = async (f) => {
    if (!window.confirm(`Supprimer la facture ${f.numero} ? Cette action est définitive.`)) return;
    await supabase.storage.from('factures').remove([f.path]);
    await supabase.from('factures').delete().eq('id', f.id);
    flash('Facture supprimée');
  };
  const factureOpen = async (f) => {
    const { data, error } = await supabase.storage.from('factures').createSignedUrl(f.path, 120);
    if (error || !data?.signedUrl) { flash('Impossible d\'ouvrir la facture'); return; }
    window.open(data.signedUrl, '_blank');
  };
  const saveChamps = async (clientId, champs) => {
    await supabase.from('client_champs').upsert({ client_id: clientId, champs }, { onConflict: 'client_id' });
    flash('Champs enregistrés');
  };
  const toggleParc = async (client, actif) => {
    if (actif) await supabase.from('parc_clients').insert({ client_id: client.id });
    else await supabase.from('parc_clients').delete().eq('client_id', client.id);
    flash(actif ? 'Suivi de parc activé' : 'Suivi de parc désactivé');
  };
  const vehiculeAdd = async ({ clientId, immat, vtype }) => {
    const { error } = await supabase.from('vehicules').insert({ client_id: clientId, immat, vtype });
    if (error) flash('Erreur : ' + error.message); else flash('Véhicule ajouté');
  };
  const vehiculeDelete = async (v) => {
    if (!window.confirm(`Supprimer le véhicule ${v.immat} ? Cette action est définitive.`)) return;
    await supabase.from('vehicules').delete().eq('id', v.id);
    flash('Véhicule supprimé');
  };
  const vehiculeConfigSave = async (vehiculeId, essieux, removeEssieuNum) => {
    const { error } = await supabase.from('vehicules').update({ essieux }).eq('id', vehiculeId);
    if (error) { flash('Erreur : ' + error.message); return; }
    if (removeEssieuNum) await supabase.from('pneus_vehicule').delete().eq('vehicule_id', vehiculeId).eq('essieu', removeEssieuNum);
  };
  const pneuSave = async ({ vehiculeId, clientId, essieu, pos, marque, dimension, profondeur, etat, nature }) => {
    const { error } = await supabase.from('pneus_vehicule').upsert(
      { vehicule_id: vehiculeId, client_id: clientId, essieu, pos, marque, dimension, profondeur, etat, nature },
      { onConflict: 'vehicule_id,essieu,pos' }
    );
    if (error) flash('Erreur : ' + error.message); else flash('Pneu enregistré');
  };
  const pneuDelete = async (p) => {
    await supabase.from('pneus_vehicule').delete().eq('id', p.id);
    flash('Pneu retiré');
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
  if (profile.status === 'invite') {
    return <><GlobalStyle /><div style={{ minHeight: '100dvh', background: c.asphalt, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <Clock size={40} color={c.amber} />
      <div style={{ fontSize: 17, fontWeight: 700 }}>Compte en attente de validation</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 300, lineHeight: 1.5 }}>Votre inscription a bien été reçue. Vous pourrez accéder à Guido dès qu'elle aura été validée.</div>
      <button onClick={logout} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600 }}>Se déconnecter</button>
    </div></>;
  }

  if (profile.type === 'admin') {
    return <><GlobalStyle /><AdminShell profile={profile} accounts={accounts} missions={missions} invites={invites}
      onCreate={createAccount} onCopy={copy} onStatus={setStatus} onDelete={removeAccount} onAssign={assign} onLogout={logout} toast={toast}
      onEnableAlerts={enableAlerts} alertsState={alertsState}
      stock={stock} onStockCreate={stockCreate} onStockUpdate={stockUpdate} onStockDelete={stockDelete} onStockAdjust={stockAdjust}
      clientStock={clientStock} onToggleAuth={authToggle} onTakeCharge={takeCharge} onAdvance={advance} onRegenLink={regenLink} contact={contact} onSaveContact={saveContact} onDecline={decline}
      factures={factures} onFactureUpload={factureUpload} onFactureDelete={factureDelete} onFactureOpen={factureOpen}
      champsConfig={champsConfig} onSaveChamps={saveChamps}
      parcClients={parcClients} onToggleParc={toggleParc}
      vehicules={vehicules} onVehiculeAdd={vehiculeAdd} onVehiculeDelete={vehiculeDelete}
      pneusVeh={pneusVeh} onPneuConfig={vehiculeConfigSave} onPneuSave={pneuSave} onPneuDelete={pneuDelete} />
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
      <FieldShell user={profile} onLogout={logout} contact={contact} factures={factures} onFactureOpen={factureOpen} parcAutorise={parcClients.includes(profile.id)} vehicules={vehicules} pneusVeh={pneusVeh}>
        {profile.type === 'client'
          ? <ClientView missions={missions} onSend={createMission} stock={stock.filter((s) => clientStock.some((r) => r.stock_id === s.id))} onEnableAlerts={enableAlerts} alertsState={alertsState} champs={champsConfig[profile.id] || []} />
          : <PrestataireView missions={missions} onAdvance={advance} alertMission={alertMission} onDismissAlert={() => setAlertMission(null)} onEnableAlerts={enableAlerts} alertsState={alertsState} />}
      </FieldShell>
      {toast && <div className="pop" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: c.ink, color: '#fff', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, zIndex: 60 }}>{toast}</div>}
    </>
  );
}
