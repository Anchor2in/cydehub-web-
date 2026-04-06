"use client";

import { useState } from "react";

type MpesaPinPromptProps = {
  phoneNumber: string;
};

export function MpesaPinPrompt({ phoneNumber }: MpesaPinPromptProps) {
  const [showNumber, setShowNumber] = useState(false);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-sm font-semibold text-white">Pay with M-Pesa</div>
      <p className="mt-1 text-xs text-white/65">Click pay to view the number to send payment.</p>

      <button
        type="button"
        onClick={() => setShowNumber(true)}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
      >
        Pay
      </button>

      {showNumber ? (
        <p className="mt-3 text-xs text-[color:var(--cyber)]">Send payment to {phoneNumber}.</p>
      ) : null}
    </div>
  );
}
