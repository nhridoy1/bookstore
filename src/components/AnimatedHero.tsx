import { BookOpen, BookMarked, Library, Bookmark, Feather, Glasses } from "lucide-react";

/**
 * Animated, image-free hero background:
 * - Warm editorial gradient base
 * - Slow-drifting blurred color blobs (mesh gradient feel)
 * - Floating book/feather icons with varied speeds
 * - Soft grain + vignette
 */
export default function AnimatedHero() {
  const floaters = [
    { Icon: BookOpen, top: "12%", left: "8%", size: 64, delay: 0, dur: 14 },
    { Icon: BookMarked, top: "22%", left: "82%", size: 52, delay: 2, dur: 18 },
    { Icon: Library, top: "68%", left: "12%", size: 72, delay: 1, dur: 20 },
    { Icon: Bookmark, top: "78%", left: "70%", size: 48, delay: 3, dur: 16 },
    { Icon: Feather, top: "38%", left: "55%", size: 56, delay: 0.5, dur: 22 },
    { Icon: Glasses, top: "55%", left: "88%", size: 50, delay: 2.5, dur: 19 },
    { Icon: BookOpen, top: "82%", left: "40%", size: 44, delay: 4, dur: 17 },
    { Icon: BookMarked, top: "8%", left: "45%", size: 40, delay: 1.5, dur: 21 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base warm gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, hsl(24 70% 28%) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, hsl(14 60% 22%) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, hsl(36 40% 18%) 0%, transparent 60%), linear-gradient(135deg, hsl(20 25% 10%) 0%, hsl(24 30% 14%) 100%)",
        }}
      />

      {/* Drifting color blobs */}
      <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl animate-blob-1"
        style={{ background: "radial-gradient(circle, hsl(24 80% 50%) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl animate-blob-2"
        style={{ background: "radial-gradient(circle, hsl(150 50% 45%) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 right-1/4 h-[360px] w-[360px] rounded-full opacity-35 blur-3xl animate-blob-3"
        style={{ background: "radial-gradient(circle, hsl(36 80% 55%) 0%, transparent 70%)" }} />

      {/* Floating book icons */}
      {floaters.map(({ Icon, top, left, size, delay, dur }, i) => (
        <div
          key={i}
          className="absolute text-primary-foreground/15"
          style={{
            top,
            left,
            animation: `float-y ${dur}s ease-in-out ${delay}s infinite, spin-slow ${dur * 2}s linear ${delay}s infinite`,
          }}
        >
          <Icon style={{ width: size, height: size }} strokeWidth={1.2} />
        </div>
      ))}

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(40 33% 97%) 1px, transparent 1px), linear-gradient(90deg, hsl(40 33% 97%) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blob-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, 60px) scale(1.15); }
          66% { transform: translate(-40px, 100px) scale(0.95); }
        }
        @keyframes blob-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-100px, -50px) scale(1.1); }
          66% { transform: translate(60px, -80px) scale(0.9); }
        }
        @keyframes blob-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-70px, 50px) scale(1.2); }
        }
        .animate-blob-1 { animation: blob-1 22s ease-in-out infinite; }
        .animate-blob-2 { animation: blob-2 26s ease-in-out infinite; }
        .animate-blob-3 { animation: blob-3 20s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
