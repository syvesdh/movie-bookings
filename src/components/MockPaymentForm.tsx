"use client";

import { useState } from "react";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

// MOCK payment form. No real card data leaves the browser — on submit we
// derive a fake token (mirroring how a real gateway like Stripe tokenises
// client-side and hands the backend only a token).
//   • Card starting 4000 0000 → "tok_decline" (simulated decline)
//   • Anything else           → "tok_ok_..."   (success)
export function MockPaymentForm({
  disabled,
  onPay,
}: {
  disabled?: boolean;
  onPay: (token: string) => Promise<void> | void;
}) {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const digits = card.replace(/\s+/g, "");
    const token = digits.startsWith("40000000")
      ? "tok_decline"
      : `tok_ok_${Date.now()}`;
    try {
      await onPay(token);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Input
        id="card"
        label="Card Number"
        value={card}
        onChange={(e) => setCard(e.target.value)}
        placeholder="0000 0000 0000 0000"
        inputMode="numeric"
        autoComplete="cc-number"
      />
      <div className="grid grid-cols-2 gap-8">
        <Input
          id="expiry"
          label="Expiry"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          placeholder="MM / YY"
          autoComplete="cc-exp"
        />
        <Input
          id="cvc"
          label="CVC"
          value={cvc}
          onChange={(e) => setCvc(e.target.value)}
          placeholder="123"
          autoComplete="cc-csc"
        />
      </div>

      <Button type="submit" size="lg" disabled={disabled || submitting}>
        {submitting ? "Processing payment…" : "Pay & Confirm"}
      </Button>

      <p className="text-xs leading-relaxed text-[#6c6863]">
        <span className="font-serif italic">Mock gateway —</span> no real charge
        is made. Use any card to succeed, or a number starting{" "}
        <code className="text-[#1a1a1a]">4000 0000</code> to simulate a decline.
      </p>
    </form>
  );
}
