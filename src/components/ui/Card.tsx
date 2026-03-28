type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-cyber-soft ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
