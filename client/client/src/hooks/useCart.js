import { useEffect, useState } from "react";
import api from "../api/axios.js";

const useCart = ({ enabled = true } = {}) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const getItemProductId = (item) => item.productId?._id || item.productId;

  const broadcastCartCount = (items) => {
    const count = (items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count } }));
  };

  const fetchCart = async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const { data } = await api.get("/buyer/cart");
      const nextCart = data || { items: [] };
      setCart(nextCart);
      broadcastCartCount(nextCart.items);
    } catch (err) {
      setCart({ items: [] });
      broadcastCartCount([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, amount = 1) => {
    if (!enabled) return;
    const normalizedAmount = Math.max(1, Number(amount) || 1);
    const previousCart = cart;

    // Optimistically update the cart immediately
    const existingItem = cart.items.find((item) => getItemProductId(item) === productId);
    const nextQuantity = (existingItem?.quantity || 0) + normalizedAmount;

    const nextItems = existingItem
      ? cart.items.map((item) =>
          getItemProductId(item) === productId
            ? { ...item, quantity: item.quantity + normalizedAmount }
            : item
        )
      : [...cart.items, { productId: { _id: productId }, quantity: normalizedAmount }];

    setCart((prev) => ({ ...prev, items: nextItems }));

    const nextCount = nextItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    broadcastCartCount(nextItems);
    
    try {
      await api.post("/buyer/cart", { productId, quantity: nextQuantity });
      await fetchCart(); // Refresh to get full product details
    } catch (err) {
      // Revert on error
      setCart(previousCart);
      await fetchCart();
      throw err;
    }
  };

  const updateItem = async (productId, quantity) => {
    if (!enabled) return;
    await api.post("/buyer/cart", { productId, quantity, replaceQuantity: true });
    await fetchCart();
    const count = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count } }));
  };

  const clearCart = async () => {
    if (!enabled) return;
    await api.delete("/buyer/cart");
    await fetchCart();
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: 0 } }));
  };

  useEffect(() => { fetchCart(); }, [enabled]);

  return { cart, loading, fetchCart, updateItem, addToCart, clearCart };
};

export default useCart;
