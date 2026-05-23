import { createClient } from 'next-sanity';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import type { Product, Article } from './types';

// Guard: if projectId is not set (e.g. during Docker build without the secret),
// keep client as null so queries return empty data instead of crashing.
export const sanityClient = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null;

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) throw new Error('Sanity not configured');
  return builder.image(source);
}

// ─── GROQ Queries ───────────────────────────────────────────────────────────

const PRODUCT_FIELDS = /* groq */ `
  "id": slug.current,
  category, name, nameEn, origin, region, altitude, process, roast,
  flavor, description, longDescription,
  price, price500, price1000,
  subscriptionPrice, subscriptionPrice500, subscriptionPrice1000,
  weight,
  variants[]{ label, grams, price, subscriptionPrice },
  "image": image.asset->url,
  badge, inStock,
  "profile": [
    coalesce(profile.bitterness, 3),
    coalesce(profile.roastIntensity, 3),
    coalesce(profile.acidity, 3),
    coalesce(profile.body, 3),
    coalesce(profile.sweetness, 3),
    coalesce(profile.balance, 3)
  ]
`;

export async function getAllProducts(): Promise<Product[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    /* groq */ `*[_type == "product"] | order(order asc, _createdAt asc) { ${PRODUCT_FIELDS} }`
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    /* groq */ `*[_type == "product" && defined(badge)] | order(order asc) { ${PRODUCT_FIELDS} }`
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch(
    /* groq */ `*[_type == "product" && slug.current == $slug][0] { ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

export async function getAllProductSlugs(): Promise<string[]> {
  if (!sanityClient) return [];
  const results = await sanityClient.fetch<{ slug: string }[]>(
    /* groq */ `*[_type == "product"] { "slug": slug.current }`
  );
  return results.map((r) => r.slug);
}

// ─── Article Queries ─────────────────────────────────────────────────────────

const ARTICLE_FIELDS = /* groq */ `
  "slug": slug.current,
  title, publishedAt, category, author, excerpt,
  "coverImage": coverImage.asset->url
`;

export async function getAllArticles(): Promise<Article[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    /* groq */ `*[_type == "article"] | order(publishedAt desc) { ${ARTICLE_FIELDS} }`
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch(
    /* groq */ `*[_type == "article" && slug.current == $slug][0] {
      ${ARTICLE_FIELDS},
      body[] {
        ...,
        _type == "image" => {
          ...,
          "url": asset->url
        }
      }
    }`,
    { slug }
  );
}

export async function getAllArticleSlugs(): Promise<string[]> {
  if (!sanityClient) return [];
  const results = await sanityClient.fetch<{ slug: string }[]>(
    /* groq */ `*[_type == "article"] { "slug": slug.current }`
  );
  return results.map((r) => r.slug);
}
