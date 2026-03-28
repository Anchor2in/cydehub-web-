import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

function classes(variant: Variant, size: Size) {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const v =
    variant === "primary"
      ? "bg-cyber-500 text-black shadow-cyber hover:bg-cyber-400 hover:shadow-cyber-strong hover:-translate-y-[1px]"
      : variant === "secondary"
        ? "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:-translate-y-[1px]"
        : "text-white/80 hover:text-white hover:bg-white/5";

  const s =
    size === "sm"
      ? "h-9 px-4 text-sm"
      : size === "lg"
        ? "h-12 px-6 text-base"
        : "h-10 px-5 text-sm";

  return `${base} ${v} ${s}`;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps,
) {
  const {
    variant = "primary",
    size = "md",
    className,
    type = "button",
    ...rest
  } = props;

  return (
    <button
      type={type}
      className={`${classes(variant, size)} ${className ?? ""}`}
      {...rest}
    />
  );
}

export function ButtonLink(
  props: React.ComponentProps<typeof Link> & CommonProps,
) {
  const { variant = "primary", size = "md", className, ...rest } = props;

  return (
    <Link
      className={`${classes(variant, size)} ${className ?? ""}`}
      {...rest}
    />
  );
}
