// Local Order & Customer State + Direct Telegram Integration (Database removed as requested)
import { CompletedOrder, CustomerDetails } from '../types';
import { sendTelegramNotification } from './esfgdrFirebase';

export interface LocalUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Lightweight local auth state (no external Firebase database required)
export const auth: { currentUser: LocalUser | null } = {
  currentUser: null
};

const ORDERS_STORAGE_KEY = 'delmon_store_orders_list';
const CUSTOMERS_STORAGE_KEY = 'delmon_store_customers_list';
const STORE_SYNC_EVENT = 'delmon_store_local_sync';

function readStoreList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoreList<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event(STORE_SYNC_EVENT));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
}

export async function testConnection(): Promise<boolean> {
  return true;
}

/**
 * Persist placed order locally and notify Telegram
 */
export async function saveOrderToFirestore(order: CompletedOrder): Promise<void> {
  const payload: FirestoreOrderRecord = {
    orderId: order.orderId.slice(0, 64),
    customerName: (order.customer.name || 'عميل دلمون').slice(0, 100),
    customerPhone: (order.customer.phone || '').slice(0, 30),
    customerAddress: `${order.customer.governorate || ''} ${order.customer.street || ''} ${order.customer.building || ''}`.trim().slice(0, 255),
    customerNotes: (order.customer.notes || '').slice(0, 500),
    subtotal: Number(order.subtotal || 0),
    depositPaid: Number(order.depositPaid || 0),
    remainingDue: Number(order.remainingDue || 0),
    total: Number(order.total || 0),
    paymentMethod: (order.paymentMethod || 'بنفت — Benefit').slice(0, 60),
    cardLast4: (order.cardLast4 || '').slice(0, 10),
    cardBank: (order.cardBank || '').slice(0, 100),
    status: (order.status || 'تم الاستلام').slice(0, 30),
    createdAt: new Date().toISOString(),
    itemCount: Number(order.items.reduce((acc, it) => acc + it.qty, 0)),
    userId: auth.currentUser?.uid || null,
    userEmail: auth.currentUser?.email || null,
    itemsSummary: order.items.map((it) => `${it.product.name} (${it.selectedWeight}) × ${it.qty}`)
  };

  const existingOrders = readStoreList<FirestoreOrderRecord>(ORDERS_STORAGE_KEY);
  writeStoreList(ORDERS_STORAGE_KEY, [
    payload,
    ...existingOrders.filter((o) => o.orderId !== payload.orderId)
  ]);

  try {
    const existingStr = localStorage.getItem('delmon_orders_ids');
    const existing: string[] = existingStr ? JSON.parse(existingStr) : [];
    if (!existing.includes(order.orderId)) {
      existing.unshift(order.orderId);
      localStorage.setItem('delmon_orders_ids', JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('Failed to update local order IDs:', e);
  }
}

/**
 * Fetch a single order by ID from local storage
 */
export async function getOrderById(orderId: string): Promise<CompletedOrder | null> {
  const cleanId = orderId.trim();
  if (!cleanId) return null;
  const all = readStoreList<FirestoreOrderRecord>(ORDERS_STORAGE_KEY);
  const data = all.find((o) => o.orderId.toUpperCase() === cleanId.toUpperCase());
  if (!data) return null;

  return {
    orderId: data.orderId,
    date: data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('ar-BH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '',
    customer: {
      name: data.customerName,
      phone: data.customerPhone,
      governorate: data.customerAddress,
      street: '',
      building: '',
      paymentOption: data.remainingDue > 0 ? 'partial' : 'full',
      paymentMethod: 'benefit'
    },
    items: [],
    subtotal: data.subtotal,
    depositPaid: data.depositPaid,
    remainingDue: data.remainingDue,
    total: data.total,
    paymentMethod: data.paymentMethod,
    cardLast4: data.cardLast4,
    cardBank: data.cardBank,
    status: data.status
  };
}

/**
 * Fetch multiple orders by their IDs
 */
export async function getOrdersByIds(orderIds: string[]): Promise<CompletedOrder[]> {
  const results: CompletedOrder[] = [];
  for (const id of orderIds) {
    const order = await getOrderById(id);
    if (order) results.push(order);
  }
  return results;
}

/**
 * Save customer contact information locally
 */
export async function saveCustomerToFirestore(customer: CustomerDetails): Promise<void> {
  const phoneClean = customer.phone.replace(/\D/g, '') || `cust_${Date.now()}`;
  const payload: FirestoreCustomerRecord = {
    customerId: phoneClean.slice(0, 64),
    name: (customer.name || '').slice(0, 100),
    phone: (customer.phone || '').slice(0, 30),
    address: `${customer.governorate || ''} ${customer.street || ''} ${customer.building || ''}`.trim().slice(0, 255),
    lastSeen: new Date().toISOString(),
    userId: auth.currentUser?.uid || null
  };

  const existing = readStoreList<FirestoreCustomerRecord>(CUSTOMERS_STORAGE_KEY);
  writeStoreList(CUSTOMERS_STORAGE_KEY, [
    payload,
    ...existing.filter((c) => c.customerId !== payload.customerId)
  ]);
}

export async function loginWithGoogle(): Promise<LocalUser> {
  const mockUser: LocalUser = {
    uid: `user_${Date.now()}`,
    displayName: localStorage.getItem('cust_name') || 'عميل دلمون',
    email: null,
    photoURL: null
  };
  auth.currentUser = mockUser;
  return mockUser;
}

export async function logoutUser(): Promise<void> {
  auth.currentUser = null;
}

export interface FirestoreOrderRecord {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  subtotal: number;
  depositPaid: number;
  remainingDue: number;
  total: number;
  paymentMethod: string;
  cardLast4?: string;
  cardBank?: string;
  status: string;
  createdAt: string;
  itemCount: number;
  userId?: string | null;
  userEmail?: string | null;
  itemsSummary?: string[];
}

export interface FirestoreCustomerRecord {
  customerId: string;
  name: string;
  phone: string;
  address: string;
  lastSeen: string;
  userId?: string | null;
}

export function subscribeToOrders(
  onUpdate: (orders: FirestoreOrderRecord[]) => void,
  _onError?: (err: Error) => void
): () => void {
  const load = () => {
    const list = readStoreList<FirestoreOrderRecord>(ORDERS_STORAGE_KEY);
    onUpdate(list);
  };
  load();
  if (typeof window !== 'undefined') {
    window.addEventListener(STORE_SYNC_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(STORE_SYNC_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }
  return () => {};
}

export function subscribeToCustomers(
  onUpdate: (customers: FirestoreCustomerRecord[]) => void,
  _onError?: (err: Error) => void
): () => void {
  const load = () => {
    const list = readStoreList<FirestoreCustomerRecord>(CUSTOMERS_STORAGE_KEY);
    onUpdate(list);
  };
  load();
  if (typeof window !== 'undefined') {
    window.addEventListener(STORE_SYNC_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(STORE_SYNC_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }
  return () => {};
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const list = readStoreList<FirestoreOrderRecord>(ORDERS_STORAGE_KEY);
  const updated = list.map((o) => (o.orderId === orderId ? { ...o, status } : o));
  writeStoreList(ORDERS_STORAGE_KEY, updated);
}

export async function deleteOrder(orderId: string): Promise<void> {
  const list = readStoreList<FirestoreOrderRecord>(ORDERS_STORAGE_KEY);
  writeStoreList(
    ORDERS_STORAGE_KEY,
    list.filter((o) => o.orderId !== orderId)
  );
}

export async function seedSampleOrder(): Promise<void> {
  const sampleId = `BH-${Math.floor(100000 + Math.random() * 900000)}`;
  const sampleOrder: CompletedOrder = {
    orderId: sampleId,
    date: new Date().toLocaleDateString('ar-BH'),
    customer: {
      name: 'علي حسن السعيد',
      phone: '39448822',
      governorate: 'محافظة العاصمة - المنامة',
      street: 'طريق 2804',
      building: 'مبنى 142، شقة 12',
      notes: 'يرجى الاتصال قبل الوصول بـ 10 دقائق',
      paymentOption: 'partial',
      paymentMethod: 'benefit'
    },
    items: [],
    subtotal: 18.9,
    depositPaid: 1.0,
    remainingDue: 17.9,
    total: 18.9,
    paymentMethod: 'Benefit Payment Gateway (بنفت البحرين)',
    cardLast4: '3244',
    cardBank: 'بنك البحرين الوطني (NBB) — شبكة بنفت',
    status: 'تم الاستلام'
  };

  await saveOrderToFirestore(sampleOrder);
  await saveCustomerToFirestore(sampleOrder.customer);
  await sendTelegramNotification(
    `📦 <b>طلب تجريبي جديد — دلمون البحرين</b>\n` +
      `🆔 <b>رقم الطلب:</b> <code>${sampleId}</code>\n` +
      `👤 <b>العميل:</b> ${sampleOrder.customer.name}\n` +
      `📞 <b>الهاتف:</b> ${sampleOrder.customer.phone}\n` +
      `💰 <b>الإجمالي:</b> ${sampleOrder.total.toFixed(3)} د.ب`
  );
}
