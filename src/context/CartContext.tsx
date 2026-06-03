import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/data/products";

export type Size = "P" | "M" | "G";

const SIZE_MULTIPLIER: Record<Size, number> = { P: 0.8, M: 1, G: 1.25 };

export interface CartItem {
  key: string;
  product: Product;
  size: Size;
  quantity: number;
  unitPrice: number;
  notes?: string; // Observações do item (ex: "sem cebola, ponto bem passado")
  extras?: { name: string; price: number }[];
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, size: Size, qty?: number, notes?: string, extras?: { name: string; price: number }[], customPrice?: number) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  priceForSize: (product: Product, size: Size) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const priceForSize = (product: Product, size: Size) =>
    Math.round(product.price * SIZE_MULTIPLIER[size] * 100) / 100;

  const addItem: CartContextValue["addItem"] = (product, size, qty = 1, notes = "", extras = [], customPrice) => {
    setItems((prev) => {
      const extrasId = extras.map(e => e.name).sort().join(",");
      const key = `${product.id}-${size}-${extrasId}`;
      const existing = prev.find((i) => i.key === key && i.notes === notes);
      
      if (existing) {
        return prev.map((i) =>
          i.key === key && i.notes === notes ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      
      const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
      return [
        ...prev,
        { 
          key, 
          product, 
          size, 
          quantity: qty, 
          unitPrice: (customPrice !== undefined ? customPrice : priceForSize(product, size)) + extrasTotal, 
          notes,
          extras 
        },
      ];
    });
  };

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const updateQty = (key: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity: qty } : i))
    );

  const clear = () => setItems([]);

  const { totalItems, totalPrice } = useMemo(() => {
    let qty = 0;
    let price = 0;
    items.forEach((i) => {
      qty += i.quantity;
      price += i.quantity * i.unitPrice;
    });
    return { totalItems: qty, totalPrice: Math.round(price * 100) / 100 };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQty,
        clear,
        totalItems,
        totalPrice,
        priceForSize,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

