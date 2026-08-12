import { useEffect, useSyncExternalStore } from 'react';

type InstallStatus = 'already-installed' | 'native-install-available' | 'ios-manual-install' | 'browser-manual-install' | 'unsupported';
type ManualInstallKind = 'ios-safari' | 'ios-other' | 'android-yandex' | 'browser' | 'unsupported';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallSnapshot {
  status: InstallStatus;
  isInstalled: boolean;
  canNativeInstall: boolean;
  canShowInstallUi: boolean;
  manualKind: ManualInstallKind;
  shouldShowSoftPrompt: boolean;
  lastOutcome: 'idle' | 'accepted' | 'dismissed';
}

const DISMISS_DAYS = 5;
const DISMISS_KEY = 'motogde.install.dismissedUntil';
const VISITS_KEY = 'motogde.install.visits';
const VISIT_SESSION_KEY = 'motogde.install.visitTracked';
const INTERACTIONS_KEY = 'motogde.install.interactions';

let promptEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
let initialized = false;
let lastOutcome: InstallSnapshot['lastOutcome'] = 'idle';
const listeners = new Set<() => void>();
let cachedSnapshot: InstallSnapshot | null = null;
let cachedSnapshotKey = '';

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function getStandalone() {
  if (!isBrowser()) return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone);
}

function getPlatform() {
  if (!isBrowser()) return { ios: false, safari: false, yandexAndroid: false, installCapable: false };
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const ios = /iPad|iPhone|iPod/.test(ua) || touchMac;
  const safari = /^((?!CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|Chrome|Android).)*Safari/i.test(ua);
  const yandexAndroid = /Android/i.test(ua) && /YaBrowser/i.test(ua);
  const installCapable = 'serviceWorker' in navigator && window.isSecureContext;
  return { ios, safari, yandexAndroid, installCapable };
}

function readNumber(key: string) {
  if (!isBrowser()) return 0;
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDismissedUntil() {
  return readNumber(DISMISS_KEY);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function buildSnapshot(): InstallSnapshot {
  const platform = getPlatform();
  const isInstalled = installed || getStandalone();
  const dismissed = getDismissedUntil() > Date.now();
  const visits = readNumber(VISITS_KEY);
  const interactions = readNumber(INTERACTIONS_KEY);
  let status: InstallStatus = 'unsupported';
  let manualKind: ManualInstallKind = 'unsupported';

  if (isInstalled) {
    status = 'already-installed';
  } else if (platform.ios) {
    status = 'ios-manual-install';
    manualKind = platform.safari ? 'ios-safari' : 'ios-other';
  } else if (promptEvent) {
    status = 'native-install-available';
  } else if (platform.installCapable) {
    status = 'browser-manual-install';
    manualKind = platform.yandexAndroid ? 'android-yandex' : 'browser';
  }

  return {
    status,
    isInstalled,
    canNativeInstall: Boolean(promptEvent) && !isInstalled && !platform.ios,
    canShowInstallUi: status !== 'already-installed' && status !== 'unsupported',
    manualKind,
    shouldShowSoftPrompt: status !== 'already-installed' && status !== 'unsupported' && !dismissed && (visits >= 2 || interactions >= 3),
    lastOutcome,
  };
}

function initInstallController() {
  if (!isBrowser() || initialized) return;
  initialized = true;
  installed = getStandalone();

  if (!window.sessionStorage.getItem(VISIT_SESSION_KEY)) {
    window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    window.localStorage.setItem(VISITS_KEY, String(readNumber(VISITS_KEY) + 1));
  }

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    lastOutcome = 'idle';
    notify();
  };

  const handleInstalled = () => {
    installed = true;
    promptEvent = null;
    lastOutcome = 'accepted';
    notify();
  };

  const handleInteraction = () => {
    const next = Math.min(readNumber(INTERACTIONS_KEY) + 1, 99);
    window.localStorage.setItem(INTERACTIONS_KEY, String(next));
    if (next === 3) notify();
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleInstalled);
  window.addEventListener('click', handleInteraction, { passive: true });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => {
    installed = getStandalone();
    notify();
  });
}

function subscribe(listener: () => void) {
  initInstallController();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initInstallController();
  const next = buildSnapshot();
  const key = JSON.stringify(next);
  if (cachedSnapshot && cachedSnapshotKey === key) return cachedSnapshot;
  cachedSnapshot = next;
  cachedSnapshotKey = key;
  return next;
}

function getServerSnapshot(): InstallSnapshot {
  return {
    status: 'unsupported',
    isInstalled: false,
    canNativeInstall: false,
    canShowInstallUi: false,
    manualKind: 'unsupported',
    shouldShowSoftPrompt: false,
    lastOutcome: 'idle',
  };
}

export function dismissInstallSoftPrompt() {
  if (!isBrowser()) return;
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(DISMISS_KEY, String(until));
  notify();
}

export function resetInstallDismissal() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(DISMISS_KEY);
  notify();
}

export function useInstallPrompt() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    initInstallController();
  }, []);

  async function install() {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    lastOutcome = choice.outcome;
    if (choice.outcome === 'accepted') installed = true;
    promptEvent = null;
    notify();
    return choice.outcome === 'accepted';
  }

  async function copyInstallLink() {
    if (!isBrowser()) return false;
    try {
      await navigator.clipboard?.writeText(window.location.href);
      return true;
    } catch {
      return false;
    }
  }

  return {
    ...snapshot,
    canInstall: snapshot.canNativeInstall,
    install,
    copyInstallLink,
    dismissSoftPrompt: dismissInstallSoftPrompt,
  };
}


