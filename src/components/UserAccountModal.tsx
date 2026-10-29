import React, { useState, useEffect } from 'react';
import { 
  User, 
  X, 
  LogOut, 
  ShoppingBag, 
  Receipt, 
  Clock, 
  MapPin, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Truck,
  PackageCheck,
  ChevronLeft,
  Database
} from 'lucide-react';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  getOrderById, 
  getOrdersByIds,
  LocalUser
} from '../lib/firebase';
import { CompletedOrder } from '../types';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: CompletedOrder) => void;
  onOpenAdmin?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
  onOpenAdmin
}) => {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(auth.currentUser);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchError, setSearchError] = useState('');

  // Load orders from Firestore based on local device IDs or user session
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const stored = localStorage.getItem('delmon_orders_ids');
      const orderIds: string[] = stored ? JSON.parse(stored) : [];
      if (orderIds.length > 0) {
        const fetched = await getOrdersByIds(orderIds);
        setOrders(fetched);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Failed to load orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, currentUser]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      await loadOrders();
    } catch (e) {
      console.error('Login failed:', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderId.trim()) return;

    setSearchError('');
    setLoadingOrders(true);
    try {
      let queryId = searchOrderId.trim().toUpperCase();
      if (!queryId.startsWith('BH-')) {
        queryId = `BH-${queryId}`;
      }
      const order = await getOrderById(queryId);
      if (order) {
        // Prepend to current orders view if not already there
        setOrders((prev) => [order, ...prev.filter((o) => o.orderId !== order.orderId)]);
        setSearchOrderId('');
      } else {
        setSearchError('لم يتم العثور على طلب بهذا الرقم. يرجى التأكد من الرمز.');
      }
    } catch (e) {
      setSearchError('تعذر جلب تفاصيل الطلب، تأكد من صحة الرمز.');
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-150 overflow-hidden my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#b91921] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {currentUser ? `أهلاً، ${currentUser.displayName || 'عميل دلمون'}` : 'حسابي وسجل الطلبات'}
              </h3>
              <p className="text-[11px] text-white/80">
                المتجر الرسمي لشركة دلمون للدواجن — مملكة البحرين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* User Profile Card OR Google Sign-In */}
          {currentUser ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'المستخدم'}
                    className="w-12 h-12 rounded-full border-2 border-[#c8102e] object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-100 text-[#c8102e] flex items-center justify-center font-black text-lg">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div>
                  <div className="font-extrabold text-sm text-gray-900">
                    {currentUser.displayName || 'مستخدم مسجل'}
                  </div>
                  <div className="text-xs text-gray-500" dir="ltr">
                    {currentUser.email}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>تم التحقق عبر Google</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 hover:text-red-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-150 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center shadow-xs border border-red-100">
                <ShoppingBag className="w-6 h-6 text-[#c8102e]" />
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-900">تسجيل الدخول السريع</h4>
                <p className="text-xs text-gray-600 mt-1">
                  سجل دخولك بحساب Google لمزامنة فواتيرك وتتبع طلباتك المحفوظة بسهولة.
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full sm:w-auto mx-auto bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {/* Google G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading ? 'جارٍ تسجيل الدخول...' : 'متابعة باستخدام حساب Google'}</span>
              </button>
            </div>
          )}

          {/* Quick Search for Any Order by BH-XXXXXX */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              تتبع أي طلب برقم الفاتورة:
            </label>
            <form onSubmit={handleSearchOrder} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="مثال: BH-481920"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#c8102e]"
                />
              </div>
              <button
                type="submit"
                disabled={loadingOrders}
                className="bg-[#c8102e] hover:bg-[#a60b24] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث</span>
              </button>
            </form>
            {searchError && (
              <p className="text-red-600 text-[11px] font-bold">{searchError}</p>
            )}
          </div>

          {/* Past Orders Section */}
          <div className="space-y-3 pt-2 border-t border-gray-150">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#c8102e]" />
                <span>طلباتي السابقة والفواتير</span>
              </h4>
              <span className="text-[11px] font-bold text-gray-400">
                {orders.length} طلب
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-xs text-gray-400">
                جارٍ تحميل تفاصيل الطلبات من قاعدة البيانات...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">لا توجد طلبات محفوظة حتى الآن</p>
                <p className="text-[11px] text-gray-400">
                  عند إتمام أي طلب عبر بوابة بنفت، سيظهر هنا مع إيصال الدفع وحالة التوصيل.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs hover:border-gray-300 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900" dir="ltr">
                          #{order.orderId}
                        </span>
                        <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full">
                          {order.status || 'تم الاستلام'}
                        </span>
                      </div>

                      <span className="font-black text-base text-[#c8102e]" dir="ltr">
                        {order.total?.toFixed(3)} BD
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                      <span>{order.date}</span>
                      {order.customer?.name && (
                        <span>العميل: {order.customer.name}</span>
                      )}
                      {order.customer?.governorate && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{order.customer.governorate}</span>
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        وسيلة الدفع: {order.paymentMethod || 'بنفت — Benefit Gateway'}
                      </span>

                      <button
                        onClick={() => {
                          onViewReceipt(order);
                          onClose();
                        }}
                        className="text-xs font-extrabold text-[#c8102e] hover:text-[#9e0c24] flex items-center gap-1 transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>عرض الفاتورة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-150 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
