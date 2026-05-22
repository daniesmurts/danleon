import Link from 'next/link';
import Image from 'next/image';
import { getAllArticles } from '@/lib/sanity';
import type { Article, ArticleCategory } from '@/lib/types';

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  roasting: 'Обжарка',
  brewing: 'Заваривание',
  origin: 'Происхождение',
  news: 'Новости',
};

function ArticleCard({ article }: { article: Article }) {
  const date = new Date(article.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link href={`/blog/${article.slug}`} className="group block bg-white border border-cream/40 hover:border-espresso/30 transition-colors">
      {article.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[#F5F5F5]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-espresso/5 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-espresso/10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          {article.category && (
            <span className="font-heading text-[9px] uppercase tracking-widest text-crimson border border-crimson/30 px-2 py-0.5">
              {CATEGORY_LABEL[article.category]}
            </span>
          )}
          <span className="font-body text-[10px] text-espresso/40">{date}</span>
        </div>
        <h2 className="font-heading text-base font-black text-espresso uppercase tracking-wide leading-snug mb-2 group-hover:text-crimson transition-colors">
          {article.title}
        </h2>
        <p className="font-body text-sm text-espresso/60 leading-relaxed line-clamp-3">{article.excerpt}</p>
        <p className="mt-4 font-heading text-[10px] uppercase tracking-widest text-espresso/40 group-hover:text-crimson transition-colors">
          Читать →
        </p>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const articles = await getAllArticles();

  return (
    <div className="min-h-screen bg-linen pt-20">
      {/* Hero */}
      <section className="bg-espresso py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-heading text-[10px] tracking-[0.4em] text-cream/40 uppercase mb-4">Блог</p>
          <h1 className="font-heading text-4xl md:text-5xl font-black text-cream uppercase tracking-widest leading-none mb-4">
            О кофе
          </h1>
          <p className="font-body text-sm text-cream/55 max-w-md mx-auto leading-relaxed">
            Истории об обжарке, заваривании и кофейной культуре Уганды
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {articles.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-heading text-sm font-bold text-espresso/20 uppercase tracking-widest mb-3">
              Статьи скоро появятся
            </p>
            <p className="font-body text-sm text-espresso/40 mb-8">
              Мы готовим материалы об угандийском кофе, обжарке и способах заваривания.
            </p>
            <Link
              href="/prepare"
              className="inline-block font-heading text-[10px] uppercase tracking-widest text-cream bg-espresso px-8 py-3 hover:bg-espresso/90 transition-colors"
            >
              Читать: Как варить кофе
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
