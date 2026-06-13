interface Props {
  className?: string;
  showText?: boolean;
}

// BookJunky — composed mark: stacked book pages with a sparkle accent.
export default function BrandLogo({ className = "", showText = true }: Props) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm ring-1 ring-primary/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M9 7h6" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-accent shadow ring-2 ring-background" />
      </span>
      {showText && (
        <span className="font-heading text-xl font-bold tracking-tight">
          Book<span className="text-primary">Junky</span>
        </span>
      )}
    </span>
  );
}
