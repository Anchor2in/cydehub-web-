import Link from "next/link";
import { MpesaPinPrompt } from "./MpesaPinPrompt";

type PaymentMethod = {
  name: string;
  note: string;
  details: string[];
};

const paymentMethods: PaymentMethod[] = [
  {
    name: "M-Pesa",
    note: "Send payment to mobile number 0116210895",
    details: ["Mobile Number: 0116210895", "Account Name: CYDEHUB", "Confirmation: Instant"],
  },
  {
    name: "PayPal",
    note: "International online payments",
    details: ["PayPal Email: payments@cydehub.com", "Type: Friends & Family or Goods & Services", "Confirmation: Instant"],
  },
];

function formatKes(value: number): string {
  return new Intl.NumberFormat("en-KE").format(value);
}

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildCheckoutLink(
  label: string,
  quantity: number,
  price: number,
  payment: string,
): string {
  const query = new URLSearchParams({
    label,
    quantity: String(quantity),
    price: String(price),
    payment,
  });
  return `/socials/checkout?${query.toString()}`;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SocialsCheckoutPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const label = readQueryValue(resolvedSearchParams.label) || "Socials package";
  const quantity = Number.parseInt(readQueryValue(resolvedSearchParams.quantity) || "0", 10);
  const price = Number.parseInt(readQueryValue(resolvedSearchParams.price) || "0", 10);
  const selectedPayment = readQueryValue(resolvedSearchParams.payment) || "M-Pesa";
  const selectedMethod = paymentMethods.find((m) => m.name === selectedPayment) ?? paymentMethods[0];

  const qtyText = quantity > 0 ? `${formatKes(quantity)}` : "custom quantity";
  const totalText = price > 0 ? `KSh ${formatKes(price)}` : "custom amount";
  const orderMessage = `Order request: ${label} - ${qtyText} - ${totalText}. Payment method: ${selectedMethod.name}.`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft md:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Complete Your Payment</h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            Review your package and use the designated payment option below.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wide text-white/55">Selected package</div>
            <div className="mt-1 text-lg font-semibold text-white">{label}</div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs uppercase tracking-wide text-white/55">Quantity</div>
                <div className="mt-1 text-base font-medium text-white">
                  {quantity > 0 ? formatKes(quantity) : "Custom"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs uppercase tracking-wide text-white/55">Total</div>
                <div className="mt-1 text-base font-medium text-[color:var(--cyber)]">
                  {price > 0 ? `KSh ${formatKes(price)}` : "Custom amount"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/chat?order=${encodeURIComponent(orderMessage)}`}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
            >
              Confirm in chat
            </Link>
            <Link
              href="/socials"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to socials
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Payment Options</h2>
          <p className="mt-2 text-sm text-white/70">Select your preferred payment method.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => {
              const active = method.name === selectedMethod.name;
              return (
                <Link
                  key={method.name}
                  href={buildCheckoutLink(label, quantity, price, method.name)}
                  className={
                    active
                      ? "rounded-2xl border border-[color:var(--cyber)]/40 bg-[color:var(--cyber)]/10 p-4 text-left"
                      : "rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                  }
                >
                  <div className="text-base font-semibold text-white">{method.name}</div>
                  <div className="mt-1 text-sm text-white/70">{method.note}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm font-semibold text-white">Designated details: {selectedMethod.name}</div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              {selectedMethod.details.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
            {selectedMethod.name === "M-Pesa" ? <MpesaPinPrompt phoneNumber="0116210895" /> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
