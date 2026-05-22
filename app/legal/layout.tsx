import LegalNav from './LegalNav';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-linen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sidebar */}
          <aside className="mb-8 lg:mb-0">
            <p className="font-heading text-[9px] uppercase tracking-[0.3em] text-espresso/30 mb-3 px-4">
              Правовые документы
            </p>
            <LegalNav />
          </aside>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
