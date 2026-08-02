import Link from 'next/link';

/**
 * Primary call to action that navigates. On hover the label fades and the
 * chevron's plate expands across the button, so the whole surface becomes
 * the affordance.
 *
 * An anchor rather than a button because it changes the page; it borrows
 * HeroUI's button styling through the library's BEM classes.
 */
export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="button button--primary button--lg cta">
      <span className="cta__label">{children}</span>
      <span className="cta__plate" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
}
