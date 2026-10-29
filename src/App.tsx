import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './data/products';
import { Product, CartItem, CustomerDetails, CompletedOrder, SheepCustomization } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { SidebarFilter, SortOption } from './components/SidebarFilter';
import { ProductCard } from './components/ProductCard';
import { WeightModal } from './components/WeightModal';
import { CustomizerModal } from './components/CustomizerModal';
import { CartPage } from './components/CartPage';
import { PaymentPage } from './components/PaymentPage';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { UserAccountModal } from './components/UserAccountModal';
import { InfoPages } from './components/InfoPages';
import { testConnection, saveOrderToFirestore, saveCustomerToFirestore } from './lib/firebase';
import { 
  Search, 
  ShoppingBag, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('cartepage') || path.includes('cart')) return 'cart';
    if (path.includes('card-payment') || path.includes('payment')) return 'payment';
    if (path.includes('how-to-order')) return 'how-to-order';
    if (path.includes('terms')) return 'terms';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('returns')) return 'returns';
    return 'home';
  });

  // Cart State (stored in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('delmon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('delmon_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('delmon_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('delmon_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Listen to popstate and hash changes to keep currentTab in sync
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('cartepage') || path.includes('cart')) {
        setCurrentTab('cart');
      } else if (path.includes('card-payment') || path.includes('payment')) {
        setCurrentTab('payment');
      } else if (path.includes('how-to-order')) {
        setCurrentTab('how-to-order');
      } else if (path.includes('terms')) {
        setCurrentTab('terms');
      } else if (path.includes('privacy')) {
        setCurrentTab('privacy');
      } else if (path.includes('returns')) {
        setCurrentTab('returns');
      } else {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  // Sync browser URL with tab
  const navigateTo = (tab: string) => {
    setCurrentTab(tab);
    let newPath = '/';
    if (tab === 'cart') newPath = '/cartepage.html';
    else if (tab === 'payment') newPath = '/card-payment.html';
    else if (tab === 'how-to-order') newPath = '/how-to-order.html';
    else if (tab === 'terms') newPath = '/terms.html';
    else if (tab === 'privacy') newPath = '/privacy.html';
    else if (tab === 'returns') newPath = '/returns.html';
    else if (tab === 'home') newPath = '/';

    window.history.pushState({}, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Modals & Payment State
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [sheepModalProduct, setSheepModalProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState<{
    customerDetails: CustomerDetails;
    amountToPay: number;
    originalSubtotal: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('delmon_payment_pending');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart calculations
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Cart Handlers
  const handleAddWeightToCart = (
    product: Product,
    selectedWeight: string,
    price: number,
    qty: number
  ) => {
    const itemKey = `${product.id}-${selectedWeight}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          selectedWeight,
          price,
          qty
        }
      ];
    });
  };

  const handleCartItemQty = (itemKey: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.id !== itemKey);
      }
      return prev.map((i) =>
        i.id === itemKey ? { ...i, qty: newQty } : i
      );
    });
  };

  const handleRemoveCartItem = (itemKey: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemKey));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleConfirmCustomization = (
    product: Product,
    customization: SheepCustomization,
    qty: number
  ) => {
    const itemKey = `${product.id}-${customization.condition}-${customization.cuttingType}-${Date.now()}`;
    setCart((prev) => [
      ...prev,
      {
        id: itemKey,
        product,
        selectedWeight: customization.condition,
        price: product.price,
        qty,
        customization
      }
    ]);
  };

  const handleProceedToPayment = (
    customerDetails: CustomerDetails,
    amountToPay: number,
    originalSubtotal: number
  ) => {
    const pData = { customerDetails, amountToPay, originalSubtotal };
    setPaymentData(pData);
    localStorage.setItem('delmon_payment_pending', JSON.stringify(pData));
    // Persist customer profile to Firestore
    saveCustomerToFirestore(customerDetails).catch((err) => {
      console.warn('Customer persist error:', err);
    });
    navigateTo('payment');
  };

  const handlePaymentSuccess = (order: CompletedOrder) => {
    setCompletedOrder(order);
    setCart([]);
    setPaymentData(null);
    localStorage.removeItem('delmon_payment_pending');
    // Persist finalized order to Firestore
    saveOrderToFirestore(order).catch((err) => {
      console.warn('Order persist error:', err);
    });
    navigateTo('home');
  };

  // Add Aryaf special offer directly to cart
  const handleAddAryafSpecialOffer = () => {
    const aryafProduct = PRODUCTS.find((p) => p.id === 'delmon-bundle-saver') || {
      id: 'delmon-bundle-saver',
      name: 'باقة التوفير الكبرى (عرض أرياف دلمون الشامل)',
      desc: 'بوكس دجاج دلمون 10 حبات (900 غرام) + 5 صحون صدور دجاج (500 غرام) + كيس أرز بسمتي فاخر 10 كيلو شامل التوصيل المبرد المجاني.',
      baseWeight: 'باقة عائلية متكاملة',
      price: 5.000,
      priceFormatted: '5.000',
      img: '/assets/aistudio/photo_5895582972092551142_w_745e482e.jpg',
      category: 'special-deals',
      categoryLabel: 'عروض التوفير وباقات العائلة',
      isAvailable: true,
      weights: [{ weight: 'باقة عائلية متكاملة', price: 5.000, priceFormatted: '5.000' }]
    };
    handleAddWeightToCart(aryafProduct as any, 'باقة عائلية متكاملة', 5.000, 1);
    navigateTo('cart');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSortBy('latest');
    setMinPrice('');
    setMaxPrice('');
    setOnlyOffers(false);
    setOnlyInStock(false);
    setSearchQuery('');
  };

  // Filter & Sort Logic — Focus strictly on fresh daily poultry in the main catalog
  const filteredProducts = PRODUCTS.filter((p) => {
    // Exclude livestock from the fresh poultry grid as requested
    if (p.isLivestock || p.category === 'livestock') return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const inName = p.name.toLowerCase().includes(q);
      const inDesc = p.desc.toLowerCase().includes(q);
      if (!inName && !inDesc) return false;
    }

    // Only in stock
    if (onlyInStock && !p.isAvailable) return false;

    // Only offers
    if (onlyOffers && !p.isOffer) return false;

    // Min price
    if (minPrice && p.price < parseFloat(minPrice)) return false;

    // Max price
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'ar');
    return 0; // latest/default
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-gray-900" dir="rtl">
      
      {/* 1. Header (Exact design with red rooster logo, icons, cart badge, auth) */}
      <Header
        currentTab={currentTab}
        onNavigate={navigateTo}
        cartCount={cartCount}
        wishlistCount={favorites.length}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenCart={() => navigateTo('cart')}
        onOpenAccount={() => setIsAccountModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 pb-24">
        
        {/* VIEW 1: HOME / SHOP */}
        {currentTab === 'home' && (
          <div>
            
            {/* Authentic Original Delmon Hero Banner */}
            <HeroBanner
              onShopClick={() => {
                const el = document.getElementById('shop-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Shop Section with Sidebar Filter & Product Grid (Matching Screenshot 2 & 3) */}
            <section id="shop-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Product Grid Area (9 cols on lg) */}
                <div className="lg:col-span-9 space-y-4">
                  
                  {/* Top Bar with Product Count */}
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-sm font-extrabold text-gray-700">
                      {filteredProducts.length} منتج
                    </span>
                    <span className="text-xs text-gray-400">
                      توصيل مبرد خلال 40 دقيقة لجميع مناطق البحرين
                    </span>
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center space-y-3">
                      <p className="text-gray-500 font-bold text-sm">لا توجد منتجات مطابقة لخيارات التصفية المحددة.</p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-[#c8102e] text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        مسح التصفية وعرض الكل
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isFavorite={favorites.includes(product.id)}
                          onToggleFavorite={toggleFavorite}
                          onSelectWeight={(p) => {
                            if (p.isLivestock) {
                              setSheepModalProduct(p);
                            } else {
                              setWeightModalProduct(p);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                </div>

                {/* Right Sidebar Filter (3 cols on lg) */}
                <div className="lg:col-span-3">
                  <SidebarFilter
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onMinPriceChange={setMinPrice}
                    onMaxPriceChange={setMaxPrice}
                    onlyOffers={onlyOffers}
                    onOnlyOffersChange={setOnlyOffers}
                    onlyInStock={onlyInStock}
                    onOnlyInStockChange={setOnlyInStock}
                    onReset={handleResetFilters}
                  />
                </div>

              </div>

            </section>

          </div>
        )}

        {/* VIEW 2: CART PAGE */}
        {currentTab === 'cart' && (
          <CartPage
            items={cart}
            onUpdateQty={handleCartItemQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToPayment={handleProceedToPayment}
            onContinueShopping={() => navigateTo('home')}
          />
        )}

        {/* VIEW 3: BENEFIT PAYMENT GATEWAY */}
        {currentTab === 'payment' && (
          paymentData ? (
            <PaymentPage
              amount={paymentData.amountToPay}
              originalSubtotal={paymentData.originalSubtotal}
              customerDetails={paymentData.customerDetails}
              items={cart}
              onCancel={() => navigateTo('cart')}
              onSuccess={handlePaymentSuccess}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 px-4 text-center">
              <h3 className="font-bold text-lg text-gray-900 mb-2">لا يوجد طلب معلق للدفع</h3>
              <p className="text-gray-500 text-xs mb-4">يرجى الذهاب للسلة وتحديد بيانات الطلب أولاً.</p>
              <button
                onClick={() => navigateTo('cart')}
                className="bg-[#c8102e] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
              >
                الذهاب لسلة الطلبات
              </button>
            </div>
          )
        )}

        {/* VIEW 4: INFO PAGES (How to Order, Terms, Privacy, Returns) */}
        {(currentTab === 'how-to-order' ||
          currentTab === 'terms' ||
          currentTab === 'privacy' ||
          currentTab === 'returns' ||
          currentTab === 'about' ||
          currentTab === 'contact' ||
          currentTab === 'categories' ||
          currentTab === 'products') && (
          <InfoPages
            type={
              currentTab === 'how-to-order' || currentTab === 'categories' || currentTab === 'products'
                ? 'how-to-order'
                : currentTab === 'terms' || currentTab === 'about'
                ? 'terms'
                : currentTab === 'privacy'
                ? 'privacy'
                : 'returns'
            }
            onGoToStore={() => navigateTo('home')}
          />
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && currentTab === 'home' && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => navigateTo('cart')}
              className="w-full bg-[#c8102e] hover:bg-[#a60b24] text-white rounded-full p-3.5 shadow-2xl flex items-center justify-between border border-red-400/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
                  {cartCount}
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">سلة الطلبات</div>
                  <div className="text-[10px] text-white/80">توصيل مبرد خلال 40 دقيقة</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">
                  {cartTotal.toFixed(3)} د.ب
                </span>
                <ChevronRight className="w-5 h-5 rotate-180" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Weight Selector Modal */}
      {weightModalProduct && (
        <WeightModal
          product={weightModalProduct}
          isOpen={!!weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
          onAddToCart={handleAddWeightToCart}
        />
      )}

      {/* Customizer Modal for Livestock */}
      {sheepModalProduct && (
        <CustomizerModal
          product={sheepModalProduct}
          isOpen={!!sheepModalProduct}
          onClose={() => setSheepModalProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Order Confirmation Receipt Modal */}
      {completedOrder && (
        <OrderConfirmationModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {/* User Profile & Order History Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onViewReceipt={(order) => setCompletedOrder(order)}
      />

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-start justify-center pt-24 px-4" dir="rtl">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-gray-150 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-gray-150 pb-3 mb-4">
              <Search className="w-5 h-5 text-[#c8102e]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج، دجاج كامل، شرائح صدر، أجنحة..."
                className="w-full text-sm font-bold focus:outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                إغلاق
              </button>
            </div>
            <p className="text-xs text-gray-400">
              اضغط على المنتج أو اضغط خارج النافذة لإغلاق البحث
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white text-gray-700 border-t border-gray-200 text-xs py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-right">
          
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/brand/delmon-lockup.png"
                alt="دلمون للدواجن"
                className="h-10 object-contain"
              />
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              شركة دلمون للدواجن (ش.م.ب) — Delmon Poultry Company (B.S.C). الشركة الوطنية الرائدة لإنتاج وتوزيع الدواجن الطازجة في مملكة البحرين منذ عام 1980.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-sm mb-3">أقسام المتجر</h4>
            <div>
              <button onClick={() => navigateTo('home')} className="hover:text-[#c8102e] transition">
                جميع المنتجات والعروض
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('cart')} className="hover:text-[#c8102e] transition">
                سلة المشتريات
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('how-to-order')} className="hover:text-[#c8102e] transition">
                طريقة الطلب
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('returns')} className="hover:text-[#c8102e] transition">
                سياسة الاسترجاع
              </button>
            </div>
          </div>

          {/* Col 3: Legal & Trust */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-sm mb-3">السياسات والشروط</h4>
            <div>
              <button onClick={() => navigateTo('terms')} className="hover:text-[#c8102e] transition">
                الشروط والأحكام
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('privacy')} className="hover:text-[#c8102e] transition">
                سياسة الخصوصية
              </button>
            </div>
            <div className="text-gray-400 text-[11px] pt-1 leading-relaxed">
              جميع المدفوعات مؤمنة وتتم عبر بوابة بنفت المعتمدة من مصرف البحرين المركزي.
            </div>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm">خدمة العملاء والتواصل</h4>
            <div className="space-y-1.5 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#c8102e]" />
                <a href="tel:+97317608282" className="hover:text-[#c8102e] transition" dir="ltr">
                  +973 17608282
                </a>
              </div>
              <div className="text-[11px] text-gray-500">
                البريد: <a href="mailto:support@dawajen.bh" className="hover:text-[#c8102e] text-[#c8102e]">support@dawajen.bh</a>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-[#c8102e]" />
                <span>صندوق بريد 20535، حَمَلة، مملكة البحرين</span>
              </div>
            </div>

            {/* Payment Badges */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 block mb-1.5">وسائل الدفع المعتمدة:</span>
              <div className="flex items-center gap-2">
                <div className="bg-white border border-gray-200 p-1 rounded-md h-6 w-10 flex items-center justify-center">
                  <img src="/assets/aistudio/enefiti_6b081bdf.webp" alt="Benefit" className="max-h-full object-contain" />
                </div>
                <span className="bg-[#1a1f71] text-white text-[9px] font-black px-2 py-1 rounded">
                  VISA
                </span>
                <span className="bg-linear-to-r from-red-600 to-amber-500 text-white text-[9px] font-black px-1.5 py-1 rounded">
                  Mastercard
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-gray-150 text-center text-gray-400 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} شركة دلمون للدواجن (ش.م.ب) — Delmon Poultry Company (dawajen.bh)
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigateTo('terms')} className="hover:text-gray-600">الشروط</button>
            <button onClick={() => navigateTo('privacy')} className="hover:text-gray-600">الخصوصية</button>
            <button onClick={() => navigateTo('returns')} className="hover:text-gray-600">الاسترجاع</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
