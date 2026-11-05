"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
/** Empties the cart after a successful order — needed when Paytm returns the customer via a redirect instead of the in-page popup. */
export function ClearCart() { const clear = useCart((s) => s.clear); useEffect(() => { clear(); }, [clear]); return null; }
