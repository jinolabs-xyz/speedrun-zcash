/** Small shield mark used for the decorative sparks on notices and badges. */
export function ShieldGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0.5 1.5 3v4.6c0 3.6 2.6 6.9 6.5 7.9 3.9-1 6.5-4.3 6.5-7.9V3L8 .5Zm0 2.1 4.5 1.7v3.3c0 2.6-1.8 5-4.5 5.9-2.7-.9-4.5-3.3-4.5-5.9V4.3L8 2.6Z" />
    </svg>
  );
}
