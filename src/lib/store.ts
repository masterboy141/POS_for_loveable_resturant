// Shared application state for Harvest POS.
// Single source of truth for menu, tables, carts (per-channel) and orders.
import { create } from "zustand";
import { menu as seedMenu, tables as seedTables, type MenuItem } from "./pos-data";

export type EditableMenuItem = MenuItem & {
  description?: string;
  gst: number; // percentage
  inStock: boolean;
};

export type TableStatus = "available" | "occupied" | "reserved";
export type TableState = {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  occupied: number;
  reservedAt?: string; // ISO datetime-local string for reservation
  reservedName?: string;
};

export type OrderStatus = "Preparing" | "Ready" | "Served" | "Paid";
export type PayMethod = "upi" | "card" | "cash";

export type OrderLine = { itemId: string; name: string; emoji: string; price: number; gst: number; qty: number };
export type Order = {
  id: string;
  channel: string; // tableId or "Takeaway" / "Delivery"
  type: "Dine-in" | "Takeaway" | "Delivery";
  lines: OrderLine[];
  note?: string;
  discountPct: number;
  status: OrderStatus;
  placedAt: number; // epoch ms
  paidAt?: number;
  payMethod?: PayMethod;
  totals: { subtotal: number; discount: number; tax: number; total: number };
};

// ----- helpers -----
export function computeTotals(lines: OrderLine[], discountPct: number) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discount = Math.round((subtotal * discountPct) / 100);
  const taxable = subtotal - discount;
  // weighted GST per line
  const tax = Math.round(
    lines.reduce((s, l) => {
      const lineTaxable = l.price * l.qty - (l.price * l.qty * discountPct) / 100;
      return s + (lineTaxable * (l.gst || 5)) / 100;
    }, 0),
  );
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

let orderSeq = 2045;
const newOrderId = () => `ORD-${orderSeq++}`;

// ----- store -----
type Store = {
  menu: EditableMenuItem[];
  tables: TableState[];
  // per-channel draft carts (channel = tableId or "Takeaway"/"Delivery")
  carts: Record<string, { lines: OrderLine[]; note: string; discountPct: number }>;
  orders: Order[];

  // menu
  updateMenuItem: (id: string, patch: Partial<EditableMenuItem>) => void;
  addMenuItem: (item: Omit<EditableMenuItem, "id">) => void;
  removeMenuItem: (id: string) => void;

  // tables
  setTableStatus: (id: string, status: TableStatus) => void;
  setTableOccupied: (id: string, n: number) => void;
  setTableReservation: (id: string, reservedAt?: string, reservedName?: string) => void;

  // carts
  ensureCart: (channel: string) => void;
  addToCart: (channel: string, item: EditableMenuItem) => void;
  changeQty: (channel: string, itemId: string, delta: number) => void;
  removeFromCart: (channel: string, itemId: string) => void;
  setNote: (channel: string, note: string) => void;
  setDiscount: (channel: string, pct: number) => void;
  clearCart: (channel: string) => void;

  // orders
  createOrder: (channel: string) => Order | null;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  payOrder: (id: string, method: PayMethod) => void;
};

export const useStore = create<Store>((set, get) => ({
  menu: seedMenu.map((m) => ({ ...m, gst: 5, inStock: true })),
  tables: seedTables.map((t) => ({
    ...t,
    occupied: t.status === "occupied" ? Math.min(2, t.seats) : 0,
  })),
  carts: {},
  orders: [
    {
      id: "ORD-2041",
      channel: "T5",
      type: "Dine-in",
      lines: [
        { itemId: "m5", name: "Paneer Butter Masala", emoji: "🍛", price: 260, gst: 5, qty: 2 },
        { itemId: "m9", name: "Butter Naan", emoji: "🫓", price: 60, gst: 5, qty: 4 },
        { itemId: "m13", name: "Jeera Rice", emoji: "🍚", price: 150, gst: 5, qty: 1 },
      ],
      note: "Extra butter on naan",
      discountPct: 0,
      status: "Preparing",
      placedAt: Date.now() - 4 * 60_000,
      totals: { subtotal: 910, discount: 0, tax: 46, total: 956 },
    },
    {
      id: "ORD-2042",
      channel: "T2",
      type: "Dine-in",
      lines: [
        { itemId: "m12", name: "Veg Biryani", emoji: "🍚", price: 240, gst: 5, qty: 1 },
        { itemId: "m16", name: "Mango Lassi", emoji: "🥭", price: 120, gst: 5, qty: 2 },
      ],
      discountPct: 0,
      status: "Ready",
      placedAt: Date.now() - 9 * 60_000,
      totals: { subtotal: 480, discount: 0, tax: 24, total: 504 },
    },
    {
      id: "ORD-2040",
      channel: "T8",
      type: "Dine-in",
      lines: [
        { itemId: "m6", name: "Dal Makhani", emoji: "🫘", price: 220, gst: 5, qty: 1 },
        { itemId: "m11", name: "Tandoori Roti", emoji: "🌾", price: 35, gst: 5, qty: 4 },
      ],
      discountPct: 5,
      status: "Paid",
      placedAt: Date.now() - 90 * 60_000,
      paidAt: Date.now() - 60 * 60_000,
      payMethod: "upi",
      totals: { subtotal: 360, discount: 18, tax: 17, total: 359 },
    },
  ],

  updateMenuItem: (id, patch) =>
    set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  addMenuItem: (item) =>
    set((s) => ({ menu: [{ ...item, id: "m" + Math.random().toString(36).slice(2, 7) }, ...s.menu] })),
  removeMenuItem: (id) => set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

  setTableStatus: (id, status) =>
    set((s) => ({
      tables: s.tables.map((t) => {
        if (t.id !== id) return t;
        if (status === "occupied") return { ...t, status, occupied: t.occupied || 1 };
        if (status === "available") return { ...t, status, occupied: 0, reservedAt: undefined, reservedName: undefined };
        return { ...t, status, occupied: 0 };
      }),
    })),
  setTableOccupied: (id, n) =>
    set((s) => ({
      tables: s.tables.map((t) => {
        if (t.id !== id) return t;
        const next = Math.max(0, Math.min(t.seats, n));
        let status: TableStatus = t.status;
        if (next === 0 && t.status === "occupied") status = "available";
        if (next > 0 && t.status === "available") status = "occupied";
        return { ...t, occupied: next, status };
      }),
    })),
  setTableReservation: (id, reservedAt, reservedName) =>
    set((s) => ({
      tables: s.tables.map((t) =>
        t.id === id ? { ...t, status: "reserved", occupied: 0, reservedAt, reservedName } : t,
      ),
    })),

  ensureCart: (channel) =>
    set((s) => (s.carts[channel] ? s : { carts: { ...s.carts, [channel]: { lines: [], note: "", discountPct: 0 } } })),
  addToCart: (channel, item) =>
    set((s) => {
      const cart = s.carts[channel] ?? { lines: [], note: "", discountPct: 0 };
      const found = cart.lines.find((l) => l.itemId === item.id);
      const lines = found
        ? cart.lines.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l))
        : [...cart.lines, { itemId: item.id, name: item.name, emoji: item.emoji, price: item.price, gst: item.gst, qty: 1 }];
      return { carts: { ...s.carts, [channel]: { ...cart, lines } } };
    }),
  changeQty: (channel, itemId, delta) =>
    set((s) => {
      const cart = s.carts[channel];
      if (!cart) return s;
      const lines = cart.lines
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0);
      return { carts: { ...s.carts, [channel]: { ...cart, lines } } };
    }),
  removeFromCart: (channel, itemId) =>
    set((s) => {
      const cart = s.carts[channel];
      if (!cart) return s;
      return { carts: { ...s.carts, [channel]: { ...cart, lines: cart.lines.filter((l) => l.itemId !== itemId) } } };
    }),
  setNote: (channel, note) =>
    set((s) => {
      const cart = s.carts[channel] ?? { lines: [], note: "", discountPct: 0 };
      return { carts: { ...s.carts, [channel]: { ...cart, note } } };
    }),
  setDiscount: (channel, pct) =>
    set((s) => {
      const cart = s.carts[channel] ?? { lines: [], note: "", discountPct: 0 };
      return { carts: { ...s.carts, [channel]: { ...cart, discountPct: Math.max(0, Math.min(100, pct)) } } };
    }),
  clearCart: (channel) =>
    set((s) => ({ carts: { ...s.carts, [channel]: { lines: [], note: "", discountPct: 0 } } })),

  createOrder: (channel) => {
    const state = get();
    const cart = state.carts[channel];
    if (!cart || cart.lines.length === 0) return null;
    const type: Order["type"] = channel === "Takeaway" ? "Takeaway" : channel === "Delivery" ? "Delivery" : "Dine-in";
    const totals = computeTotals(cart.lines, cart.discountPct);
    const order: Order = {
      id: newOrderId(),
      channel,
      type,
      lines: cart.lines,
      note: cart.note || undefined,
      discountPct: cart.discountPct,
      status: "Preparing",
      placedAt: Date.now(),
      totals,
    };
    set((s) => ({
      orders: [order, ...s.orders],
      carts: { ...s.carts, [channel]: { lines: [], note: "", discountPct: 0 } },
    }));
    return order;
  },
  setOrderStatus: (id, status) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
  payOrder: (id, method) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, status: "Paid", payMethod: method, paidAt: Date.now() } : o,
      ),
    })),
}));
