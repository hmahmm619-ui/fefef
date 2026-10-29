import React from 'react';
import { ShieldCheck, Truck, Clock, HelpCircle, FileText, Lock, RotateCcw, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

interface InfoPageProps {
  type: 'how-to-order' | 'terms' | 'privacy' | 'returns';
  onGoToStore: () => void;
}

export const InfoPages: React.FC<InfoPageProps> = ({ type, onGoToStore }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Return to Store button */}
      <div className="mb-6">
        <button
          onClick={onGoToStore}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d8212a] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" /> العودة لمتجر دلمون للدواجن
        </button>
      </div>

      {/* HOW TO ORDER */}
      {type === 'how-to-order' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">دليل الشراء السريع</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">كيف تطلب من دلمون البحرين؟</h1>
            <p className="text-xs text-gray-500 mt-1">
              خطوات سهلة ومباشرة لطلب الدواجن الطازجة والمتبلة واستلامها مبردة عند باب منزلك.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '١',
                title: 'اختر منتجات الدواجن المفضلة',
                desc: 'تصفح تشكيلة منتجات دلمون (الدجاج الكامل بأوزان مختلفة، فيليه الصدور، الشيش طاووق، الدجاج المتبل، أو باقات التوفير الكبرى).'
              },
              {
                step: '٢',
                title: 'راجع سلة المشتريات',
                desc: 'تحقق من الكميات والأوزان والأسعار بالدينار البحريني قبل المتابعة.'
              },
              {
                step: '٣',
                title: 'أدخل بيانات التواصل والتوصيل',
                desc: 'أدخل اسمك ورقم هاتفك (البحرين +973) وعنوانك بالتفصيل داخل مملكة البحرين.'
              },
              {
                step: '٤',
                title: 'اختر طريقة السداد المناسبة',
                desc: 'سداد إلكتروني فوري عبر بوابة بنفت (Benefit Pay)، أو البطاقات المصرفية، أو خيار دفع عربون 1 د.ب والمتبقي عند الاستلام.'
              },
              {
                step: '٥',
                title: 'استلام الطلب طازجاً ومبرداً',
                desc: 'يصلك طلبك خلال 40 دقيقة في سيارات نقل مبردة مخصصة لحفظ درجة الحرارة والجودة.'
              }
            ].map((s) => (
              <div key={s.step} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 items-start">
                <div className="w-9 h-9 rounded-xl bg-[#d8212a] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={onGoToStore}
              className="bg-[#d8212a] hover:bg-[#b8141d] text-white px-8 py-3 rounded-xl font-black text-sm shadow-md transition cursor-pointer"
            >
              تصفح منتجات دلمون الآن 🐔
            </button>
          </div>
        </div>
      )}

      {/* TERMS & CONDITIONS */}
      {type === 'terms' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">الشروط والأحكام المعتمدة</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">الشروط والأحكام — دلمون البحرين</h1>
            <p className="text-xs text-gray-500 mt-1">
              شركة دلمون للدواجن (ش.م.ب) — ص.ب 20535، حَمَلة، مملكة البحرين
            </p>
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. المنتجات والأسعار والعروض</h3>
              <p>
                تُعرض المنتجات وأسعارها بالدينار البحريني (د.ب / BHD). تعتمد تفاصيل المنتج والسعر والتوفر على المعلومات المعروضة وقت تقديم الطلب. تُطبق شروط العروض الترويجية كما تظهر مع كل منتج.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. التوفر ومناطق التوصيل</h3>
              <p>
                تخضع المنتجات لمدى توفرها اليومي الطازج من مزارع ومسالخ دلمون. نوفر خدمة التوصيل المبرد لكافة محافظات ومناطق مملكة البحرين دون رسوم توصيل إضافية.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. معايير السلامة والرقابة البيطرية</h3>
              <p>
                تلتزم شركة دلمون للدواجن بأعلى معايير السلامة الغذائية والذبح الحلال المعتمد 100% وتحت إشراف بيطري كامل ورقابة وزارة الصحة بمملكة البحرين.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٤. التواصل وخدمة المستهلك</h3>
              <p>
                لأي استفسار، يرجى التواصل مع مركز خدمة عملاء شركة دلمون للدواجن: <a href="tel:+97317608282" className="text-[#d8212a] font-bold underline" dir="ltr">+973 17608282</a> أو عبر البريد الإلكتروني: <a href="mailto:support@dawajen.bh" className="text-[#d8212a] font-bold underline">support@dawajen.bh</a>.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {type === 'privacy' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">حماية وسرية البيانات</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">سياسة الخصوصية — دلمون البحرين</h1>
            <p className="text-xs text-gray-500 mt-1">
              شركة دلمون للدواجن (ش.م.ب) — dawajen.bh
            </p>
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. المعلومات المرتبطة بالطلب</h3>
              <p>
                تقتصر المعلومات التي نجمعها على البيانات الضرورية لمعالجة طلبك وإيصاله (الاسم، ورقم هاتف البحرين، وعنوان التوصيل).
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. أمن المدفوعات والبطاقات</h3>
              <p>
                تتم عمليات الدفع الإلكتروني عبر بوابة بنفت (Benefit Gateway) المعتمدة من مصرف البحرين المركزي، ولا نقوم بتخزين أرقام بطاقتك أو بياناتك السرية.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. سرية البيانات</h3>
              <p>
                نلتزم بالمحافظة التامة على سرية بيانات العملاء وعدم إفشائها أو مشاركتها مع أي أطراف تجارية أخرى.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* RETURNS POLICY */}
      {type === 'returns' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#d8212a] font-bold text-xs">ضمان الجودة والرضا التام</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">سياسة الاستبدال والاسترجاع</h1>
            <p className="text-xs text-gray-500 mt-1">
              دلمون البحرين — رضاكم وسلامتكم أولويتنا
            </p>
          </div>

          <div className="bg-red-50 border-r-4 border-[#d8212a] p-4 rounded-xl text-red-900 font-bold text-xs leading-relaxed">
            ✅ رضاك أولويتنا: إذا وصلك منتج تالف أو غير مطابق لطلبك، نستبدله فوراً أو نعيد لك قيمته دون أي تأخير.
          </div>

          <div className="space-y-5 text-xs text-gray-700 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">١. الفحص عند الاستلام</h3>
              <p>
                لطبيعة منتجات الدواجن الطازجة والمبردة، نرجو منك فحص المنتجات أمام مندوب التوصيل عند التسليم مباشرة لضمان سلامتها ومطابقتها.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٢. الحالات المشمولة بالاستبدال الفوري</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>وصول منتج تالف أو بجودة لا تطابق معايير دلمون المعتمدة.</li>
                <li>وصول منتج أو وزن مختلف عما تم تحديده في السلة.</li>
                <li>نقص في أحد أصناف الطلب.</li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-black text-gray-900">٣. آلية استرداد المبالغ</h3>
              <p>
                في حال الدفع ببطاقة بنفت، يُعاد المبلغ لنفس الحساب المصرفي خلال 1 إلى 3 أيام عمل. وفي حال الدفع عند الاستلام، يُعاد المبلغ نقداً أو يتم الاستبدال بنفس اليوم.
              </p>
            </section>
          </div>
        </div>
      )}

    </div>
  );
};
