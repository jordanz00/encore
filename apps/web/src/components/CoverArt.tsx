import Image from "next/image";
import { mediaImageUrl } from "@/lib/media";

interface CoverArtProps {
  coverArtKey: string | null | undefined;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: "w-16 h-16", px: 64 },
  md: { box: "aspect-square", px: 400 },
  lg: { box: "aspect-square", px: 800 },
} as const;

/**
 * Release cover art via API redirect, with accessible fallback.
 */
export default function CoverArt({
  coverArtKey,
  title,
  size = "md",
  className = "",
}: CoverArtProps): JSX.Element {
  const src = mediaImageUrl(coverArtKey);
  const s = sizes[size];

  if (!src) {
    return (
      <div
        className={`${s.box} rounded-xl bg-paper-soft dark:bg-white/5 flex items-center justify-center ${className}`}
        role="img"
        aria-label={`No cover art for ${title}`}
      >
        <span className="text-3xl opacity-30" aria-hidden="true">
          ♪
        </span>
      </div>
    );
  }

  return (
    <div className={`${s.box} relative rounded-xl overflow-hidden bg-paper-soft dark:bg-white/5 ${className}`}>
      <Image
        src={src}
        alt={`Cover art for ${title}`}
        width={s.px}
        height={s.px}
        className="object-cover w-full h-full"
        sizes={size === "sm" ? "64px" : "(max-width: 768px) 50vw, 220px"}
        unoptimized
      />
    </div>
  );
}
