import { useState, type CSSProperties } from "react";
import { srcSet, imgUrl, type Photo } from "../data/images";

type Props = {
  photo: Photo;
  sizes: string;
  className?: string;
  eager?: boolean;
  alt?: string;
  style?: CSSProperties;
  q?: number;
};

/** Responsive, lazy image with a graceful (never broken) failure state. */
export function Img({ photo, sizes, className = "img-cover", eager, alt, style, q }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className={`${className} img-fallback`} role="img" aria-label={alt ?? photo.alt} style={style} />;
  }
  return (
    <img
      className={className}
      src={imgUrl(photo, 960, q)}
      srcSet={srcSet(photo, q)}
      sizes={sizes}
      alt={alt ?? photo.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      draggable={false}
      onError={() => setFailed(true)}
      style={{ objectPosition: photo.focus, ...style }}
    />
  );
}
