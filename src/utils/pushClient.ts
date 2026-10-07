'use client';
import {publicEnv} from '@/config/public-env';
import {apiUrl} from '@/config';
import {getErrorMessage} from '.';
async function saveSubscription(action: 'subscribe' | 'unsubscribe', body: unknown, token: string) {
  const response = await fetch(`${apiUrl}/notifications/${action}`, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error('Unable to save notification preferences. Please try again.');
}
export async function testDeviceNotification() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) throw new Error('This browser does not support device notifications.');
  if (Notification.permission !== 'granted') throw new Error('Enable push notifications first and allow notifications for Kwonnet in Chrome.');
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) throw new Error('Reload Kwonnet and enable push notifications before testing.');
  await registration.showNotification('Kwonnet notification test', {
    body: 'Notifications can be displayed on this device.',
    tag: `kwonnet-test-${Date.now()}`,
    icon: '/android-chrome-192x192.png',
    data: {url: new URL('/settings', window.location.origin).href},
  });
}
export async function syncExistingPushSubscription(token: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission !== 'granted') return;
  await navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'});
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) await saveSubscription('subscribe', subscription.toJSON(), token);
}
export async function subscribeUserToPush(token?: string, enabled = true) {
  try {
    if (!token) throw new Error('Sign in to manage notifications.');
    if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('Push notifications require a supported browser and HTTPS. On iPhone, install Kwonnet on your Home Screen first.');
    await navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'});
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!enabled) {
      if (subscription) {try {await saveSubscription('unsubscribe', {endpoint: subscription.endpoint}, token);} finally {await subscription.unsubscribe();}}
      return {status: 200, message: 'Notifications disabled'};
    }
    if (await Notification.requestPermission() !== 'granted') throw new Error('Allow notifications in your browser settings to enable them.');
    const publicKey = publicEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    if (!publicKey) throw new Error('Push notifications are not configured yet.');
    const key = urlBase64ToUint8Array(publicKey);
    const existingKey = subscription?.options.applicationServerKey;
    if (subscription && existingKey && Array.from(new Uint8Array(existingKey)).join() !== Array.from(key).join()) {await saveSubscription('unsubscribe', {endpoint: subscription.endpoint}, token); await subscription.unsubscribe(); subscription = null;}
    subscription ??= await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: key});
    await saveSubscription('subscribe', subscription.toJSON(), token);
    return {status: 200, message: 'Notifications enabled'};
  } catch (error) {return {status: 400, message: getErrorMessage(error)};}
}
function urlBase64ToUint8Array(value: string) {
  const raw = window.atob((value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return new Uint8Array([...raw].map(char => char.charCodeAt(0)));
}

export async function clearBrowserPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
}
