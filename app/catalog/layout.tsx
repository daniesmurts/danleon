import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог',
  description:
    'Каталог премиального угандийского кофе ДАНЛЕОН. Светлая, средняя и тёмная обжарка. Свежая обжарка, прямые поставки с плантаций.',
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
