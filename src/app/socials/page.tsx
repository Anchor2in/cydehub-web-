function formatKes(value: number): string {
  return new Intl.NumberFormat("en-KE").format(value);
}

function buildOrderLink(label: string, quantity: number, price: number): string {
  const query = new URLSearchParams({
    label,
    quantity: String(quantity),
    price: String(price),
  });
  return `/socials/checkout?${query.toString()}`;
}

const followerPackages = Array.from({ length: 40 }, (_, index) => {
  const followers = (index + 1) * 500;
  const price = (index + 1) * 250;
  return { price, followers };
});

const likePackages = Array.from({ length: 20 }, (_, index) => {
  const likes = (index + 1) * 100;
  const price = (index + 1) * 100;
  return { price, likes };
});

const paymentMethods = [
  {
    name: "M-Pesa",
    note: "Send payment to mobile number 0116210895",
    availability: "Instant confirmation",
  },
  {
    name: "PayPal",
    note: "International online payments",
    availability: "Instant confirmation",
  },
];

export default function SocialsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Social Media Services Price List</h1>
        <p className="mt-2 text-sm text-white/70 md:text-base">
          Instagram packages for followers and likes. Contact us on chat to place an order.
        </p>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Instagram</h2>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white">Followers Packages</h3>
          <p className="mt-1 text-sm text-white/70">Rate: 500 Followers @ KSh 250</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {followerPackages.map((item) => (
              <div
                key={item.followers}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <div className="text-xs uppercase tracking-wide text-white/55">Price</div>
                <div className="mt-1 text-lg font-semibold text-white">KSh {formatKes(item.price)}</div>
                <div className="mt-3 text-xs uppercase tracking-wide text-white/55">Followers</div>
                <div className="mt-1 text-base font-medium text-[color:var(--cyber)]">{formatKes(item.followers)}</div>
                <a
                  href={buildOrderLink("Instagram followers", item.followers, item.price)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Buy now
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white">Likes Packages</h3>
          <p className="mt-1 text-sm text-white/70">Rate: 100 Likes @ KSh 100</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {likePackages.map((item) => (
              <div
                key={item.likes}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <div className="text-xs uppercase tracking-wide text-white/55">Price</div>
                <div className="mt-1 text-lg font-semibold text-white">KSh {formatKes(item.price)}</div>
                <div className="mt-3 text-xs uppercase tracking-wide text-white/55">Likes</div>
                <div className="mt-1 text-base font-medium text-[color:var(--cyber)]">{formatKes(item.likes)}</div>
                <a
                  href={buildOrderLink("Instagram likes", item.likes, item.price)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Buy now
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Need TikTok, YouTube, or Snapchat packages? Message us in <a className="underline" href="/chat">Chat</a> for custom pricing.
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
          <p className="mt-1 text-sm text-white/70">
            Choose your package, then complete payment using any method below.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {paymentMethods.map((method) => (
              <div key={method.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-base font-semibold text-white">{method.name}</div>
                <div className="mt-2 text-sm text-white/70">{method.note}</div>
                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-[color:var(--cyber)]">
                  {method.availability}
                </div>
                <a
                  href={`/socials/checkout?payment=${encodeURIComponent(method.name)}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-black/30 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Use this method
                </a>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
            To place an order, send your selected package and preferred payment method in <a className="underline" href="/chat">Chat</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
