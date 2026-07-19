import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

/** Demande l'autorisation, abonne l'appareil et enregistre l'abonnement pour le prestataire connecté. */
export async function activerNotifications(profileId) {
  try {
    // 1) Capacités de base
    if (!('serviceWorker' in navigator)) {
      return { ok: false, msg: "Ce navigateur ne gère pas les notifications. Sur iPhone, ouvrez l'app depuis l'icône de l'écran d'accueil." };
    }
    if (!('Notification' in window)) {
      return { ok: false, msg: "Notifications indisponibles. Sur iPhone : ajoutez d'abord l'app à l'écran d'accueil, puis ouvrez-la par son icône." };
    }
    if (!VAPID_PUBLIC_KEY) {
      return { ok: false, msg: "Configuration incomplète (clé VAPID manquante côté serveur)." };
    }

    // 2) Enregistrer le service worker et ATTENDRE qu'il soit prêt (important sur iOS)
    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;

    // 3) Vérifier le PushManager APRÈS que le SW soit prêt (sur iPhone il n'existe qu'à ce moment)
    if (!('PushManager' in window) && !registration.pushManager) {
      return { ok: false, msg: "Votre appareil ne prend pas encore en charge les notifications web dans cette configuration." };
    }

    // 4) Demander l'autorisation (doit suivre un appui de l'utilisateur)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, msg: "Autorisation refusée. Activez les notifications pour Guido dans les réglages du téléphone." };
    }

    // 5) S'abonner (réutilise un abonnement existant si présent)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 6) Enregistrer l'abonnement dans Supabase
    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        profile_id: profileId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'endpoint' }
    );
    if (error) return { ok: false, msg: error.message };

    return { ok: true, msg: "Alertes activées sur cet appareil." };
  } catch (e) {
    return { ok: false, msg: "Erreur lors de l'activation : " + (e?.message || String(e)) };
  }
}
