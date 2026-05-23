import { defineField, defineType } from 'sanity';

export const productSchema = defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  fields: [
    defineField({
      name: 'category',
      title: 'Категория',
      type: 'string',
      options: {
        list: [
          { title: 'Кофе', value: 'coffee' },
          { title: 'Еда и напитки', value: 'food' },
          { title: 'Аксессуары', value: 'accessories' },
          { title: 'Другое', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'coffee',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Название (рус)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'nameEn',
      title: 'Название (eng)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'nameEn', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'origin',
      title: 'Страна происхождения',
      type: 'string',
      initialValue: 'Уганда',
    }),
    defineField({
      name: 'region',
      title: 'Регион',
      type: 'string',
    }),
    defineField({
      name: 'altitude',
      title: 'Высота над уровнем моря',
      type: 'string',
    }),
    defineField({
      name: 'process',
      title: 'Обработка',
      type: 'string',
    }),
    defineField({
      name: 'roast',
      title: 'Обжарка (только для кофе)',
      type: 'string',
      options: {
        list: [
          { title: 'Светлая', value: 'светлая' },
          { title: 'Средняя', value: 'средняя' },
          { title: 'Тёмная', value: 'тёмная' },
        ],
      },
    }),
    defineField({
      name: 'flavor',
      title: 'Вкусовые ноты',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'description',
      title: 'Краткое описание',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'longDescription',
      title: 'Полное описание',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'price',
      title: 'Цена 250г (₽)',
      description: 'Для кофе — обязательно. Для товаров с вариантами — можно оставить пустым (цены задаются в вариантах).',
      type: 'number',
      validation: (r) =>
        r.custom((val, ctx) => {
          const cat = (ctx.document as { category?: string })?.category;
          if (!cat || cat === 'coffee') {
            return val !== undefined && val !== null ? true : 'Обязательное поле для кофе';
          }
          return true;
        }),
    }),
    defineField({
      name: 'price500',
      title: 'Цена 500г (₽)',
      description: 'Если не заполнено — рассчитывается автоматически (×1.9 от цены 250г)',
      type: 'number',
    }),
    defineField({
      name: 'price1000',
      title: 'Цена 1кг (₽)',
      description: 'Если не заполнено — рассчитывается автоматически (×3.5 от цены 250г)',
      type: 'number',
    }),
    defineField({
      name: 'subscriptionPrice',
      title: 'Цена по подписке 250г (₽)',
      description: 'Оставьте пустым, если скидка по подписке не предусмотрена',
      type: 'number',
    }),
    defineField({
      name: 'subscriptionPrice500',
      title: 'Цена по подписке 500г (₽)',
      type: 'number',
    }),
    defineField({
      name: 'subscriptionPrice1000',
      title: 'Цена по подписке 1кг (₽)',
      type: 'number',
    }),
    defineField({
      name: 'weight',
      title: 'Вес (г)',
      type: 'number',
      initialValue: 250,
    }),
    defineField({
      name: 'variants',
      title: 'Варианты объёма (для не-кофейных товаров)',
      description: 'Добавьте варианты, если у товара несколько объёмов/весов с разными ценами. Для кофе используйте поля price500/price1000.',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Вариант',
          fields: [
            defineField({ name: 'label', title: 'Подпись (напр. 100Г)', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'grams', title: 'Граммов', type: 'number', validation: (r) => r.required().positive() }),
            defineField({ name: 'price', title: 'Цена (₽)', type: 'number', validation: (r) => r.required().positive() }),
            defineField({ name: 'subscriptionPrice', title: 'Цена по подписке (₽)', type: 'number' }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'price' },
            prepare: ({ title, subtitle }) => ({
              title,
              subtitle: subtitle ? `${subtitle} ₽` : '',
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'image',
      title: 'Фото',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'badge',
      title: 'Бейдж',
      type: 'string',
      options: {
        list: [
          { title: 'Новинка', value: 'НОВИНКА' },
          { title: 'Бестселлер', value: 'БЕСТСЕЛЛЕР' },
          { title: 'Лимитированный', value: 'ЛИМИТИРОВАННЫЙ' },
        ],
      },
    }),
    defineField({
      name: 'inStock',
      title: 'В наличии',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'profile',
      title: 'Вкусовой профиль (1–5)',
      type: 'object',
      fields: [
        { name: 'bitterness', title: 'Горчинка', type: 'number' },
        { name: 'roastIntensity', title: 'Обжарка', type: 'number' },
        { name: 'acidity', title: 'Кислинка', type: 'number' },
        { name: 'body', title: 'Насыщенность', type: 'number' },
        { name: 'sweetness', title: 'Сладость', type: 'number' },
        { name: 'balance', title: 'Баланс', type: 'number' },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Порядок сортировки',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'roast', media: 'image' },
  },
  orderings: [
    { title: 'Порядок', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
});
