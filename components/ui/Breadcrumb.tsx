import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Навигация" className="mb-6">
      <ol className="flex items-center gap-2 text-sm font-body text-espresso/50">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-espresso/30" aria-hidden="true">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-crimson transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-espresso font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
