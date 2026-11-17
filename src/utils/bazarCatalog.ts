export interface CatalogItem {
  key: string;
  name: string;
  bn: string;
  aliases: string[];
  category: 'protein' | 'vegetable' | 'staple' | 'spice' | 'dairy' | 'utility';
  defaultUnit: string;
}

export const ITEM_CATALOG: CatalogItem[] = [
  // Protein
  { key: 'chicken', name: 'Chicken', bn: 'মুরগি', aliases: ['chicken', 'murgi', 'মুরগি', 'broiler'], category: 'protein', defaultUnit: 'kg' },
  { key: 'beef', name: 'Beef', bn: 'গরুর মাংস', aliases: ['beef', 'goru', 'গরু', 'গরুর মাংস', 'mangsho'], category: 'protein', defaultUnit: 'kg' },
  { key: 'mutton', name: 'Mutton', bn: 'খাসির মাংস', aliases: ['mutton', 'khashi', 'খাসি', 'খাসির মাংস'], category: 'protein', defaultUnit: 'kg' },
  { key: 'egg', name: 'Egg', bn: 'ডিম', aliases: ['egg', 'dim', 'ডিম', 'eggs'], category: 'protein', defaultUnit: 'pcs' },
  { key: 'fish_rui', name: 'Rui Fish', bn: 'রুই মাছ', aliases: ['rui', 'rohu', 'রুই', 'রুই মাছ'], category: 'protein', defaultUnit: 'kg' },
  { key: 'fish_pangash', name: 'Pangash Fish', bn: 'পাঙ্গাশ', aliases: ['pangash', 'পাঙ্গাশ', 'pangas'], category: 'protein', defaultUnit: 'kg' },
  { key: 'fish_tilapia', name: 'Tilapia', bn: 'তেলাপিয়া', aliases: ['tilapia', 'তেলাপিয়া', 'telapia'], category: 'protein', defaultUnit: 'kg' },
  { key: 'fish_ilish', name: 'Ilish Fish', bn: 'ইলিশ', aliases: ['ilish', 'hilsa', 'ইলিশ'], category: 'protein', defaultUnit: 'kg' },
  { key: 'fish_katla', name: 'Katla Fish', bn: 'কাতলা', aliases: ['katla', 'কাতলা'], category: 'protein', defaultUnit: 'kg' },
  { key: 'dal_masur', name: 'Masur Dal', bn: 'মসুর ডাল', aliases: ['masur', 'masoor', 'মসুর', 'মসুর ডাল', 'red lentil'], category: 'protein', defaultUnit: 'kg' },
  { key: 'dal_mug', name: 'Mug Dal', bn: 'মুগ ডাল', aliases: ['mug', 'moong', 'মুগ', 'মুগ ডাল'], category: 'protein', defaultUnit: 'kg' },

  // Vegetables
  { key: 'potato', name: 'Potato', bn: 'আলু', aliases: ['potato', 'alu', 'আলু', 'potatoes'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'onion', name: 'Onion', bn: 'পেঁয়াজ', aliases: ['onion', 'peyaj', 'পেঁয়াজ', 'pyaj'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'garlic', name: 'Garlic', bn: 'রসুন', aliases: ['garlic', 'roshun', 'রসুন', 'rosun'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'ginger', name: 'Ginger', bn: 'আদা', aliases: ['ginger', 'ada', 'আদা'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'tomato', name: 'Tomato', bn: 'টমেটো', aliases: ['tomato', 'tometo', 'টমেটো'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'green_chili', name: 'Green Chili', bn: 'কাঁচা মরিচ', aliases: ['green chili', 'kacha morich', 'কাঁচা মরিচ', 'morich'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'eggplant', name: 'Eggplant', bn: 'বেগুন', aliases: ['eggplant', 'begun', 'বেগুন', 'brinjal'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'pointed_gourd', name: 'Pointed Gourd', bn: 'পটল', aliases: ['pointed gourd', 'potol', 'পটল', 'parwal'], category: 'vegetable', defaultUnit: 'kg' },
  { key: 'cauliflower', name: 'Cauliflower', bn: 'ফুলকপি', aliases: ['cauliflower', 'fulkopi', 'ফুলকপি'], category: 'vegetable', defaultUnit: 'pcs' },
  { key: 'cabbage', name: 'Cabbage', bn: 'বাঁধাকপি', aliases: ['cabbage', 'badhakopi', 'বাঁধাকপি'], category: 'vegetable', defaultUnit: 'pcs' },
  { key: 'spinach', name: 'Spinach', bn: 'পালং শাক', aliases: ['spinach', 'palong', 'পালং', 'পালং শাক', 'shak'], category: 'vegetable', defaultUnit: 'pcs' },
  { key: 'coriander', name: 'Coriander Leaves', bn: 'ধনেপাতা', aliases: ['coriander', 'dhonepata', 'ধনেপাতা', 'dhania'], category: 'vegetable', defaultUnit: 'pcs' },
  { key: 'vegetable_mixed', name: 'Mixed Vegetables', bn: 'সবজি', aliases: ['vegetables', 'sobji', 'সবজি', 'mixed veg'], category: 'vegetable', defaultUnit: 'kg' },

  // Staples
  { key: 'rice', name: 'Rice', bn: 'চাল', aliases: ['rice', 'chal', 'চাল', 'miniket', 'nazirshail'], category: 'staple', defaultUnit: 'kg' },
  { key: 'soybean_oil', name: 'Soybean Oil', bn: 'সয়াবিন তেল', aliases: ['soybean oil', 'soyabin tel', 'সয়াবিন তেল', 'tel', 'তেল', 'oil'], category: 'staple', defaultUnit: 'litre' },
  { key: 'mustard_oil', name: 'Mustard Oil', bn: 'সরিষার তেল', aliases: ['mustard oil', 'sorishar tel', 'সরিষার তেল'], category: 'staple', defaultUnit: 'litre' },
  { key: 'flour', name: 'Flour (Atta)', bn: 'আটা', aliases: ['flour', 'atta', 'আটা', 'maida', 'ময়দা'], category: 'staple', defaultUnit: 'kg' },
  { key: 'sugar', name: 'Sugar', bn: 'চিনি', aliases: ['sugar', 'chini', 'চিনি'], category: 'staple', defaultUnit: 'kg' },
  { key: 'salt', name: 'Salt', bn: 'লবণ', aliases: ['salt', 'lobon', 'লবণ'], category: 'staple', defaultUnit: 'kg' },

  // Spices & Dairy & Utilities
  { key: 'turmeric', name: 'Turmeric', bn: 'হলুদ', aliases: ['turmeric', 'holud', 'হলুদ'], category: 'spice', defaultUnit: 'kg' },
  { key: 'cumin', name: 'Cumin', bn: 'জিরা', aliases: ['cumin', 'jeera', 'jira', 'জিরা'], category: 'spice', defaultUnit: 'kg' },
  { key: 'spice_mixed', name: 'Spices (Mixed)', bn: 'মশলা', aliases: ['spice', 'moshla', 'মশলা', 'masala'], category: 'spice', defaultUnit: 'packet' },
  { key: 'milk', name: 'Milk', bn: 'দুধ', aliases: ['milk', 'dudh', 'দুধ'], category: 'dairy', defaultUnit: 'litre' },
  { key: 'water', name: 'Water Jar', bn: 'পানির জার', aliases: ['water', 'pani', 'পানি', 'jar'], category: 'utility', defaultUnit: 'pcs' },
  { key: 'gas_cylinder', name: 'Gas Cylinder', bn: 'গ্যাস সিলিন্ডার', aliases: ['gas', 'cylinder', 'গ্যাস', 'সিলিন্ডার'], category: 'utility', defaultUnit: 'pcs' },
  { key: 'cleaning', name: 'Cleaning Supplies', bn: 'পরিষ্কার সামগ্রী', aliases: ['cleaning', 'parishkar', 'dish wash', 'vim', 'soap', 'সাবান'], category: 'utility', defaultUnit: 'pcs' },
];

export function searchCatalog(query: string, limit = 6): CatalogItem[] {
  if (!query || query.trim().length === 0) return ITEM_CATALOG.slice(0, limit);
  const q = query.toLowerCase().trim();

  const prefixMatches: CatalogItem[] = [];
  const containsMatches: CatalogItem[] = [];

  for (const item of ITEM_CATALOG) {
    const isPrefix =
      item.name.toLowerCase().startsWith(q) ||
      item.aliases.some((a) => a.toLowerCase().startsWith(q));
    const isContains =
      !isPrefix &&
      (item.name.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.toLowerCase().includes(q)));

    if (isPrefix) prefixMatches.push(item);
    else if (isContains) containsMatches.push(item);
  }

  return [...prefixMatches, ...containsMatches].slice(0, limit);
}

export function normalizeItemName(rawName: string): { normalizedName: string; category: string } | null {
  const q = rawName.toLowerCase().trim();
  if (!q) return null;

  for (const item of ITEM_CATALOG) {
    if (
      item.name.toLowerCase() === q ||
      item.key === q ||
      item.aliases.some((a) => a.toLowerCase() === q)
    ) {
      return { normalizedName: item.key, category: item.category };
    }
  }

  for (const item of ITEM_CATALOG) {
    if (item.aliases.some((a) => q.includes(a.toLowerCase()) || a.toLowerCase().includes(q))) {
      return { normalizedName: item.key, category: item.category };
    }
  }

  return null;
}
