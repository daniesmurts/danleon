# Bug Tracker

All bugs resolved. ✓

---

## Critical (runtime / wrong data)

- [x] **Broken product links in cart** — fixed in `app/cart/page.tsx`: `/product/` → `/catalog/`
- [x] **Hardcoded tags in ProductCard** — fixed in `components/ui/ProductCard.tsx`: now uses `product.process` / `product.roast`
- [x] **Weight selection ignored when adding to cart** — fixed: added `weight` + `unitPrice` to `CartItem`, cart context, and all callers
- [x] **`lastName` never collected in checkout** — fixed in checkout rewrite: separate firstName/lastName fields
- [x] **Delivery label hardcoded as "СДЭК"** — fixed in checkout rewrite: uses `selectedDelivery.label`

---

## Logic / UX

- [x] **Hardcoded 156 ₽ discount** — removed in checkout rewrite
- [x] **Radar chart values hardcoded** — fixed: added `profile` field to `Product` type and each product in `lib/products.ts`
- [x] **`className` prop silently dropped on `FormInput`** — fixed in checkout rewrite: replaced `FormInput` with typed `FormField` that applies className
- [x] **`alert()` in subscription form** — fixed in `app/page.tsx`: replaced with inline success state

---

## TypeScript / Imports

- [x] **Unused import `useMemo`** — removed from `app/catalog/[id]/page.tsx`
- [x] **Unused import `products`** — removed from `app/catalog/[id]/page.tsx` and `app/page.tsx`
- [x] **`FormInput` typed as `any`** — fixed in checkout rewrite: typed `FormField` component
- [x] **`deliveryMethod` type has `'cdek'`** — removed from `lib/types.ts`
