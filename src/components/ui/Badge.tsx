type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
