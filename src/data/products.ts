import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'delmon-whole-chicken-600',
    name: 'دجاج كامل',
    desc: 'دجاج دلمون كامل طازج ومبرد، مذبوح ومجهز محلياً 100% في مزارع ومسالخ دلمون بمملكة البحرين تحت إشراف بيطري كامل.',
    baseWeight: '600 جم',
    price: 9.450,
    priceFormatted: '9.450',
    img: '/assets/products/whole-chicken.png',
    category: 'whole-chicken',
    categoryLabel: 'دجاج كامل طازج',
    isAvailable: true,
    weights: [
      { weight: '600 جم', price: 9.450, priceFormatted: '9.450' },
      { weight: '700 جم', price: 11.025, priceFormatted: '11.025' },
      { weight: '800 جم', price: 12.600, priceFormatted: '12.600' },
      { weight: '900 جم', price: 14.175, priceFormatted: '14.175' },
      { weight: '1000 جم (1 كجم)', price: 15.750, priceFormatted: '15.750' },
      { weight: '1100 جم', price: 17.325, priceFormatted: '17.325' },
      { weight: '1200 جم', price: 18.900, priceFormatted: '18.900' },
      { weight: '1300 جم', price: 20.475, priceFormatted: '20.475' },
      { weight: '1400 جم', price: 22.050, priceFormatted: '22.050' },
    ]
  },
  {
    id: 'delmon-breast-strips-400',
    name: 'شرائح صدر',
    desc: 'شرائح صدور دجاج طازجة بدون عظم أو جلد، مقطعة ومجهزة بعناية في طبق حفظ صحي أصفر.',
    baseWeight: '400 جم',
    price: 19.800,
    priceFormatted: '19.800',
    img: '/assets/products/strips.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '400 جم', price: 19.800, priceFormatted: '19.800' },
      { weight: '500 جم', price: 24.750, priceFormatted: '24.750' },
      { weight: '1000 جم (1 كجم)', price: 49.500, priceFormatted: '49.500' },
    ]
  },
  {
    id: 'delmon-drumsticks-500',
    name: 'أرجل صغيرة',
    desc: 'أفخاذ وسيقان دجاج طازجة ناعمة ولذيذة، مثالية للقلي والشواء والكبسات العائلية.',
    baseWeight: '500 جم',
    price: 11.130,
    priceFormatted: '11.130',
    img: '/assets/products/drumsticks.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 11.130, priceFormatted: '11.130' },
      { weight: '1000 جم (1 كجم)', price: 22.260, priceFormatted: '22.260' },
    ]
  },
  {
    id: 'delmon-whole-legs-400',
    name: 'أفخاذ كاملة',
    desc: 'أفخاذ دجاج كاملة بالعظم طازجة من مزارع دلمون، غنية بالبروتين ومجهزة يومياً.',
    baseWeight: '400 جم',
    price: 8.775,
    priceFormatted: '8.775',
    img: '/assets/products/whole-legs.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '400 جم', price: 8.775, priceFormatted: '8.775' },
      { weight: '500 جم', price: 10.960, priceFormatted: '10.960' },
      { weight: '1000 جم (1 كجم)', price: 21.930, priceFormatted: '21.930' },
    ]
  },
  {
    id: 'delmon-thigh-strips-500',
    name: 'شرائح فخذ',
    desc: 'شرائح لحم أفخاذ دجاج مخلية من العظم والجلد تماماً، طرية جداً ونكهة مميزة.',
    baseWeight: '500 جم',
    price: 25.140,
    priceFormatted: '25.140',
    img: '/assets/products/breast-fillet.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: false, // نفد المخزون as in the user screenshot
    weights: [
      { weight: '500 جم', price: 25.140, priceFormatted: '25.140' }
    ]
  },
  {
    id: 'delmon-wings-500',
    name: 'أجنحة',
    desc: 'أجنحة دجاج كاملة طازجة ونظيفة، مقطعة وجاهزة للطهي والشواء بالفرن أو المقلاة الهوائية.',
    baseWeight: '500 جم',
    price: 11.130,
    priceFormatted: '11.130',
    img: '/assets/products/wings.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 11.130, priceFormatted: '11.130' },
      { weight: '1000 جم (1 كجم)', price: 22.260, priceFormatted: '22.260' },
    ]
  },
  {
    id: 'delmon-minced-500',
    name: 'مفروم',
    desc: 'لحم دجاج طازج مفروم ناعم نخب أول، بدون أي إضافات صناعية أو مواد حافظة.',
    baseWeight: '500 جم',
    price: 7.025,
    priceFormatted: '7.025',
    img: '/assets/products/minced.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 7.025, priceFormatted: '7.025' },
      { weight: '1000 جم (1 كجم)', price: 14.050, priceFormatted: '14.050' },
    ]
  },
  {
    id: 'delmon-thighs-500',
    name: 'فخذ',
    desc: 'أفخاذ دجاج عليا طازجة ومختارة بعناية في طبق حفظ محكم لضمان الطزاجة القصوى.',
    baseWeight: '500 جم',
    price: 8.775,
    priceFormatted: '8.775',
    img: '/assets/products/thighs.png',
    category: 'wings-legs',
    categoryLabel: 'أفخاذ وأجنحة',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 8.775, priceFormatted: '8.775' },
      { weight: '1000 جم (1 كجم)', price: 17.550, priceFormatted: '17.550' },
    ]
  },
  {
    id: 'delmon-breast-fillet-500',
    name: 'فيليه صدور دجاج',
    desc: 'فيليه صدور دجاج طازج مخلي من الجلد والعظم، طري وغني بالبروتين، مثالي للدايت والأطباق الصحية.',
    baseWeight: '500 جم',
    price: 26.500,
    priceFormatted: '26.500',
    img: '/assets/products/breast-fillet.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    badge: 'الأكثر طلباً 🔥',
    weights: [
      { weight: '500 جم', price: 26.500, priceFormatted: '26.500' },
      { weight: '1000 جم (1 كجم)', price: 53.000, priceFormatted: '53.000' },
    ]
  },
  {
    id: 'delmon-breast-cubes-500',
    name: 'مكعبات صدور دجاج',
    desc: 'مكعبات دجاج طازجة مقطعة بأحجام متساوية للشيش طاووق والشوربات والصلصات.',
    baseWeight: '500 جم',
    price: 27.000,
    priceFormatted: '27.000',
    img: '/assets/products/cubes.png',
    category: 'cuts-fillet',
    categoryLabel: 'صدور وفيليه',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 27.000, priceFormatted: '27.000' },
      { weight: '1000 جم (1 كجم)', price: 54.000, priceFormatted: '54.000' },
    ]
  },
  {
    id: 'delmon-shish-tawook-500',
    name: 'شيش طاووق متبل فاخر',
    desc: 'مكعبات صدور دجاج متبلة بخلطة بهارات دلمون الخاصة مع الليمون وزيت الزيتون، جاهزة للشوي مباشرة.',
    baseWeight: '500 جم',
    price: 25.000,
    priceFormatted: '25.000',
    img: '/assets/products/shish-tawook.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    isNew: true, // جديد badge as in screenshot
    weights: [
      { weight: '500 جم', price: 25.000, priceFormatted: '25.000' },
      { weight: '1000 جم (1 كجم)', price: 50.000, priceFormatted: '50.000' },
    ]
  },
  {
    id: 'delmon-livers-500',
    name: 'كبدة دجاج طازجة',
    desc: 'كبدة دجاج طازجة نخب أول غنية بالحديد والمعادن، مفحوصة ومنظفة بعناية.',
    baseWeight: '500 جم',
    price: 13.750,
    priceFormatted: '13.750',
    img: '/assets/products/livers.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 13.750, priceFormatted: '13.750' },
      { weight: '1000 جم (1 كجم)', price: 27.500, priceFormatted: '27.500' },
    ]
  },
  {
    id: 'delmon-hearts-500',
    name: 'قلوب دجاج طازجة',
    desc: 'قلوب دجاج طازجة ونظيفة من مزارع دلمون، ممتازة للتشويح مع البصل والبهارات.',
    baseWeight: '500 جم',
    price: 12.750,
    priceFormatted: '12.750',
    img: '/assets/products/hearts.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 12.750, priceFormatted: '12.750' },
    ]
  },
  {
    id: 'delmon-gizzards-500',
    name: 'قوانص دجاج طازجة',
    desc: 'قوانص دجاج طازجة منظفة تماماً وخالية من أي شوائب، ومغلفة بطريقة صحية.',
    baseWeight: '500 جم',
    price: 11.750,
    priceFormatted: '11.750',
    img: '/assets/products/gizzards.png',
    category: 'giblets',
    categoryLabel: 'كبدة وأحشاء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 11.750, priceFormatted: '11.750' },
    ]
  },
  {
    id: 'delmon-marinated-bbq',
    name: 'دجاج متبل باربكيو مدخن',
    desc: 'نصف دجاجة متبلة بصلصة الباربكيو المدخنة اللذيذة، مغلفة ومستعدة للشوي الفوري بالفرن أو الفحم.',
    baseWeight: '500 جم',
    price: 14.000,
    priceFormatted: '14.000',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Barbecue_Marinated_Half_Chicken_500g.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 14.000, priceFormatted: '14.000' }
    ]
  },
  {
    id: 'delmon-marinated-madhbi',
    name: 'دجاج متبل مدبي حضرمي',
    desc: 'نصف دجاجة متبلة ببهارات المدبي الحضرمي الأصيلة لنكهة الشواء التقليدي الشهي.',
    baseWeight: '500 جم',
    price: 14.000,
    priceFormatted: '14.000',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Madhbi_Marinated_Half_Chicken_500g.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 14.000, priceFormatted: '14.000' }
    ]
  },
  {
    id: 'delmon-marinated-biryani',
    name: 'دجاج متبل بهارات برياني',
    desc: 'نصف دجاجة متبلة بخلطة البرياني الهندي العطرة مع الزعفران والقرنفل والهيل.',
    baseWeight: '500 جم',
    price: 14.250,
    priceFormatted: '14.250',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Biryani_Marinated_Half_Chicken_500g.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 14.250, priceFormatted: '14.250' }
    ]
  },
  {
    id: 'delmon-marinated-tandoori',
    name: 'دجاج متبل تندوري أحمر',
    desc: 'نصف دجاجة متبلة ببهارات التندوري الهندي الحارة والزبادي لنكهة حيوية مقرمشة.',
    baseWeight: '500 جم',
    price: 14.250,
    priceFormatted: '14.250',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Tandoori_Marinated_Half_Chicken_500g.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 14.250, priceFormatted: '14.250' }
    ]
  },
  {
    id: 'delmon-marinated-spicy',
    name: 'دجاج متبل حار (سبايسي)',
    desc: 'نصف دجاجة بخلطة الفلفل الحار والبابريكا، مناسبة لعشاق النكهات القوية.',
    baseWeight: '500 جم',
    price: 14.000,
    priceFormatted: '14.000',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Spicy_Marinated_Half_500g.png',
    category: 'marinated',
    categoryLabel: 'دجاج متبل وشواء',
    isAvailable: true,
    weights: [
      { weight: '500 جم', price: 14.000, priceFormatted: '14.000' }
    ]
  },
  {
    id: 'delmon-free-range-1000',
    name: 'دجاج بلدي حر طازج (Free Range)',
    desc: 'دجاج بلدي حر ومربى بطريقة طبيعية في المزارع المفتوحة بدون مضادات حيوية.',
    baseWeight: '1000 جم',
    price: 65.000,
    priceFormatted: '65.000',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/__Barcode_-_0796554432687_-_Free_Range_Fresh_Whole_Chicken_-1000g_Tdhjbaz.png',
    category: 'special-free-range',
    categoryLabel: 'دجاج حر ومدخن',
    isAvailable: true,
    badge: 'طبيعي 100% 🌿',
    weights: [
      { weight: '800 جم', price: 52.000, priceFormatted: '52.000' },
      { weight: '900 جم', price: 58.500, priceFormatted: '58.500' },
      { weight: '1000 جم (1 كجم)', price: 65.000, priceFormatted: '65.000' },
      { weight: '1100 جم', price: 71.500, priceFormatted: '71.500' },
    ]
  },
  {
    id: 'delmon-smoked-1000',
    name: 'دجاج كامل مدخن جاهز للأكل',
    desc: 'دجاج كامل مطهو ومكتمل النضج ومدخن طبيعياً على خشب شجر الزان، جاهز للتقديم البارد أو الساخن.',
    baseWeight: '1000 جم',
    price: 34.200,
    priceFormatted: '34.200',
    img: 'https://www.mazzratyhomedelivery.com/media/media/media/Mazzraty_Smoked_Whole_Chicken_-1000g_QzoXOsy.png',
    category: 'special-free-range',
    categoryLabel: 'دجاج حر ومدخن',
    isAvailable: true,
    badge: 'مدخن خشب طبيعي',
    weights: [
      { weight: '800 جم', price: 27.550, priceFormatted: '27.550' },
      { weight: '1000 جم (1 كجم)', price: 34.200, priceFormatted: '34.200' },
      { weight: '1100 جم', price: 37.050, priceFormatted: '37.050' },
    ]
  },
  {
    id: 'delmon-bundle-saver',
    name: 'باقة التوفير الكبرى (دجاج دلمون + أرز بسمتي)',
    desc: 'بوكس دجاج دلمون 10 حبات كاملة (كل حبة 900 غرام) + 5 صحون صدور دجاج طازجة (كل صحن 500 غرام) + كيس أرز بسمتي فاخر 10 كيلو، شامل التوصيل المبرد المجاني لجميع مناطق مملكة البحرين.',
    baseWeight: 'باقة عائلية متكاملة',
    price: 5.000,
    priceFormatted: '5.000',
    img: '/assets/aistudio/photo_5895582972092551142_w_745e482e.jpg',
    category: 'special-deals',
    categoryLabel: 'عروض التوفير وباقات العائلة',
    isAvailable: true,
    isOffer: true,
    badge: 'عرض حصري 💥',
    weights: [
      { weight: 'باقة عائلية متكاملة', price: 5.000, priceFormatted: '5.000' }
    ]
  },
  {
    id: 'delmon-naemi-1',
    name: 'خروف نعيمي أهوازي طازج (ذبح محلي)',
    desc: 'خروف نعيمي حي أو مذبوح طازج تحت إشراف طبيب بيطري، صافي وزن 15 إلى 18 كجم، شامل الذبح والتقطيع والتوصيل مع إمكانية الذبح في منزلك.',
    baseWeight: 'ذبيحة كاملة 15-18 كجم',
    price: 70.000,
    priceFormatted: '70.000',
    img: '/assets/aistudio/australian-sheep_079e7736.jpg',
    category: 'livestock',
    categoryLabel: 'ذبائح وخراف ومواشي',
    isAvailable: true,
    isLivestock: true,
    badge: 'ذبح محلي 🐑',
    weights: [
      { weight: 'ذبيحة كاملة', price: 70.000, priceFormatted: '70.000' }
    ]
  }
];

export const BAHRAIN_AREAS = [
  'المنامة - Manama',
  'المحرق - Muharraq',
  'الرفاع الشرقي - East Riffa',
  'الرفاع الغربي - West Riffa',
  'سترة - Sitra',
  'مدينة عيسى - Isa Town',
  'مدينة حمد - Hamad Town',
  'البديع - Budaiya',
  'سار - Saar',
  'الجنبية - Janabiya',
  'أم الحصم - Umm Al Hassam',
  'الجفير - Juffair',
  'السيف - Seef',
  'توبلي - Tubli',
  'سند - Sanad',
  'الحد - Hidd',
  'قلالي - Qalali',
  'البسيتين - Busaiteen',
  'الزلاق - Zallaq',
  'عالي - A\'ali',
  'مدينة سلمان - Salman City',
  'حَمَلة - Hamala',
  'ديار المحرق - Diyar Al Muharraq'
];
