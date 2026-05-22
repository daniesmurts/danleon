import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { getArticleBySlug, getAllArticleSlugs, urlFor } from '@/lib/sanity';
import type { ArticleCategory } from '@/lib/types';

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  roasting: 'Обжарка',
  brewing: 'Заваривание',
  origin: 'Происхождение',
  news: 'Новости',
};

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: { url?: string; asset?: unknown; caption?: string } }) => {
      const src = value.url ?? (value.asset ? urlFor(value.asset).url() : null);
      if (!src) return null;
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#F5F5F5]">
            <Image src={src} alt={value.caption ?? ''} fill className="object-cover" />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center font-body text-xs text-espresso/40">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-heading text-xl font-black text-espresso uppercase tracking-wide mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-heading text-base font-bold text-espresso uppercase tracking-wide mt-8 mb-3">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="font-body text-base text-espresso/80 leading-relaxed mb-5">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-crimson pl-5 my-6 font-body text-base italic text-espresso/60">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-espresso">{children}</strong>,
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
    link: ({ value, children }: { value?: { href?: string }; children?: React.ReactNode }) => (
      <a href={value?.href} className="text-crimson underline underline-offset-2 hover:no-underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-outside ml-5 mb-5 space-y-1 font-body text-base text-espresso/80">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-outside ml-5 mb-5 space-y-1 font-body text-base text-espresso/80">{children}</ol>
    ),
  },
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const date = new Date(article.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-linen pt-20">
      {/* Cover */}
      {article.coverImage && (
        <div className="relative w-full h-[40vh] md:h-[55vh] overflow-hidden bg-espresso">
          <Image src={article.coverImage} alt={article.title} fill className="object-cover opacity-70" priority />
        </div>
      )}

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {article.category && (
            <span className="font-heading text-[9px] uppercase tracking-widest text-crimson border border-crimson/30 px-2 py-0.5">
              {CATEGORY_LABEL[article.category]}
            </span>
          )}
          <span className="font-body text-xs text-espresso/40">{date}</span>
          <span className="text-espresso/20">·</span>
          <span className="font-body text-xs text-espresso/40">{article.author}</span>
        </div>

        <h1 className="font-heading text-3xl md:text-4xl font-black text-espresso uppercase tracking-wide leading-tight mb-8">
          {article.title}
        </h1>

        <p className="font-body text-lg text-espresso/60 leading-relaxed mb-10 border-b border-espresso/10 pb-10">
          {article.excerpt}
        </p>

        {/* Body */}
        {article.body && (
          <div>
            <PortableText value={article.body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-espresso/10">
          <Link href="/blog" className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
            ← Все статьи
          </Link>
        </div>
      </article>
    </div>
  );
}
