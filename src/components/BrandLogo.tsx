import logoImg from "@/assets/bookjunky-logo.png";

interface Props {
  className?: string;
  showText?: boolean;
}

// BookJunky — AI-generated open-book-with-spark mark.
export default function BrandLogo({ className = "", showText = true }: Props) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="BookJunky logo"
        width={40}
        height={40}
        loading="lazy"
        className="h-10 w-10 object-contain drop-shadow-sm"
      />
      {showText && (
        <span className="font-heading text-xl font-bold tracking-tight leading-none">
          Book<span className="text-primary">Junky</span>
        </span>
      )}
    </span>
  );
}
