import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import type { Product } from './types';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ─── GROQ Queries ───────────────────────────────────────────────────────────

const PRODUCT_FIELDS = /* groq */ `
  "id": slug.current,
  name, nameEn, origin, region, altitude, process, roast,
  flavor, description, longDescription, price, subscriptionPrice, weight,
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
  return sanityClient.fetch(
    /* groq */ `*[_type == "product"] | order(order asc, _createdAt asc) { ${PRODUCT_FIELDS} }`
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return sanityClient.fetch(
    /* groq */ `*[_type == "product" && defined(badge)] | order(order asc) { ${PRODUCT_FIELDS} }`
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return sanityClient.fetch(
    /* groq */ `*[_type == "product" && slug.current == $slug][0] { ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

export async function getAllProductSlugs(): Promise<string[]> {
  const results = await sanityClient.fetch<{ slug: string }[]>(
    /* groq */ `*[_type == "product"] { "slug": slug.current }`
  );
  return results.map((r) => r.slug);
}
