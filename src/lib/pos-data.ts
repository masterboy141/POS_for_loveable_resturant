// Centralized mock data for the POS demo. Replace with real API later.
export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  veg: true;
  emoji: string;
  description?: string;
};

export const categories = [
  { id: "all", name: "All", emoji: "🌿" },
  { id: "starters", name: "Starters", emoji: "🥗" },
  { id: "mains", name: "Mains", emoji: "🍲" },
  { id: "breads", name: "Breads", emoji: "🫓" },
  { id: "rice", name: "Rice", emoji: "🍚" },
  { id: "drinks", name: "Drinks", emoji: "🥤" },
  { id: "desserts", name: "Desserts", emoji: "🍮" },
];

export const menu: MenuItem[] = [
  { id: "m1", name: "Paneer Tikka", category: "starters", price: 220, veg: true, emoji: "🧀", description: "Charcoal-grilled cottage cheese, mint chutney" },
  { id: "m2", name: "Hara Bhara Kebab", category: "starters", price: 180, veg: true, emoji: "🥬" },
  { id: "m3", name: "Crispy Corn", category: "starters", price: 160, veg: true, emoji: "🌽" },
  { id: "m4", name: "Veg Manchurian", category: "starters", price: 190, veg: true, emoji: "🥦" },
  { id: "m5", name: "Paneer Butter Masala", category: "mains", price: 260, veg: true, emoji: "🍛" },
  { id: "m6", name: "Dal Makhani", category: "mains", price: 220, veg: true, emoji: "🫘" },
  { id: "m7", name: "Veg Kofta", category: "mains", price: 240, veg: true, emoji: "🥔" },
  { id: "m8", name: "Palak Paneer", category: "mains", price: 250, veg: true, emoji: "🥬" },
  { id: "m9", name: "Butter Naan", category: "breads", price: 60, veg: true, emoji: "🫓" },
  { id: "m10", name: "Garlic Naan", category: "breads", price: 70, veg: true, emoji: "🧄" },
  { id: "m11", name: "Tandoori Roti", category: "breads", price: 35, veg: true, emoji: "🌾" },
  { id: "m12", name: "Veg Biryani", category: "rice", price: 240, veg: true, emoji: "🍚" },
  { id: "m13", name: "Jeera Rice", category: "rice", price: 150, veg: true, emoji: "🍚" },
  { id: "m14", name: "Masala Chai", category: "drinks", price: 40, veg: true, emoji: "🍵" },
  { id: "m15", name: "Fresh Lime Soda", category: "drinks", price: 80, veg: true, emoji: "🍋" },
  { id: "m16", name: "Mango Lassi", category: "drinks", price: 120, veg: true, emoji: "🥭" },
  { id: "m17", name: "Gulab Jamun", category: "desserts", price: 90, veg: true, emoji: "🍯" },
  { id: "m18", name: "Rasmalai", category: "desserts", price: 110, veg: true, emoji: "🍮" },
];

export const tables = Array.from({ length: 12 }, (_, i) => ({
  id: `T${i + 1}`,
  number: i + 1,
  seats: [2, 2, 4, 4, 4, 6, 6, 2, 4, 8, 4, 6][i],
  status: (["available", "occupied", "available", "reserved", "occupied", "available", "occupied", "available", "available", "reserved", "occupied", "available"] as const)[i],
}));

export const salesWeek = [
  { day: "Mon", revenue: 14200, orders: 62 },
  { day: "Tue", revenue: 15800, orders: 71 },
  { day: "Wed", revenue: 12900, orders: 55 },
  { day: "Thu", revenue: 18400, orders: 84 },
  { day: "Fri", revenue: 24600, orders: 112 },
  { day: "Sat", revenue: 31200, orders: 138 },
  { day: "Sun", revenue: 27500, orders: 121 },
];

export const categoryShare = [
  { name: "Mains", value: 42 },
  { name: "Starters", value: 22 },
  { name: "Breads", value: 14 },
  { name: "Rice", value: 12 },
  { name: "Drinks", value: 6 },
  { name: "Desserts", value: 4 },
];

export const topItems = [
  { name: "Paneer Butter Masala", sold: 84, revenue: 21840 },
  { name: "Veg Biryani", sold: 71, revenue: 17040 },
  { name: "Butter Naan", sold: 196, revenue: 11760 },
  { name: "Dal Makhani", sold: 58, revenue: 12760 },
  { name: "Masala Chai", sold: 142, revenue: 5680 },
];

export type KdsOrder = {
  id: string;
  table: string;
  type: "Dine-in" | "Takeaway" | "Delivery";
  items: { name: string; qty: number; note?: string }[];
  status: "Preparing" | "Ready" | "Served";
  placedAt: number; // ms ago
};

export const initialKdsOrders: KdsOrder[] = [
  {
    id: "ORD-2041",
    table: "T5",
    type: "Dine-in",
    items: [
      { name: "Paneer Butter Masala", qty: 2 },
      { name: "Butter Naan", qty: 4, note: "Extra butter" },
      { name: "Jeera Rice", qty: 1 },
    ],
    status: "Preparing",
    placedAt: 4 * 60_000,
  },
  {
    id: "ORD-2042",
    table: "T2",
    type: "Dine-in",
    items: [
      { name: "Veg Biryani", qty: 1 },
      { name: "Mango Lassi", qty: 2 },
    ],
    status: "Preparing",
    placedAt: 9 * 60_000,
  },
  {
    id: "ORD-2043",
    table: "—",
    type: "Takeaway",
    items: [
      { name: "Hara Bhara Kebab", qty: 2 },
      { name: "Garlic Naan", qty: 3 },
      { name: "Palak Paneer", qty: 1 },
    ],
    status: "Ready",
    placedAt: 14 * 60_000,
  },
  {
    id: "ORD-2044",
    table: "—",
    type: "Delivery",
    items: [
      { name: "Dal Makhani", qty: 1 },
      { name: "Tandoori Roti", qty: 4 },
    ],
    status: "Preparing",
    placedAt: 18 * 60_000,
  },
];
