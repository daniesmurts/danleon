# Bug Tracker

Fix UI/layout issues first, then address these in order.

---

## Critical (runtime / wrong data)

- [ ] **Broken product links in cart** — `app/cart/page.tsx:117,136`
  Links use `/product/${id}` but the route is `/catalog/${id}`. Returns 404 on click.

- [ ] **Hardcoded tags in ProductCard** — `components/ui/ProductCard.tsx:51-56`
  Every card shows "МЫТАЯ" and "СРЕДНЯЯ" regardless of the product's actual `process` and `roast`. Should use `product.process` / `product.roast`.

- [ ] **Weight selection ignored when adding to cart** — `app/catalog/[id]/page.tsx:150`
  250g / 500g / 1kg selection changes the displayed price but is never passed to `addItem`. Cart always receives the base 250g product.

- [ ] **`lastName` never collected in checkout** — `app/checkout/page.tsx:185-188`
  The "ИМЯ И ФАМИЛИЯ" field only writes into `firstName`. `lastName` has no input and always submits empty.

- [ ] **Delivery label hardcoded as "СДЭК"** — `app/checkout/page.tsx:227`
  Order summary always reads "ДОСТАВКА (СДЭК)" even when Courier or Pickup is selected.

---

## Logic / UX

- [ ] **Hardcoded 156 ₽ discount** — `app/checkout/page.tsx:71`
  `const discount = 156` is a dummy value subtracted from every order regardless of whether a subscription is active.

- [ ] **Radar chart values hardcoded** — `app/catalog/[id]/page.tsx:234`
  `<RadarChart values={[2, 3, 1, 5, 4, 4]} />` is the same for every product. Should be derived from the product's flavor/roast data.

- [ ] **`className` prop silently dropped on `FormInput`** — `app/checkout/page.tsx:187`
  Email field passes `className="sm:col-span-2"` but `FormInput` never applies it. The field won't span 2 columns.

- [ ] **`alert()` in subscription form** — `app/page.tsx:220`
  Uses `alert('Спасибо за подписку!')` — should use an inline success state like the contact form.

---

## TypeScript / Imports

- [ ] **Unused import `useMemo`** — `app/catalog/[id]/page.tsx:3`

- [ ] **Unused import `products`** — `app/catalog/[id]/page.tsx:7`

- [ ] **Unused import `products`** — `app/page.tsx:5`

- [ ] **`FormInput` typed as `any`** — `app/checkout/page.tsx:25`
  Loses all prop type safety.

- [ ] **`deliveryMethod` type has `'cdek'` but component uses `'sdek'`** — `lib/types.ts:38`
  Dead/inconsistent value in the union type.
