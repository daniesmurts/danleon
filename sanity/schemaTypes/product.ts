import { defineField, defineType } from 'sanity';

export const productSchema = defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  fields: [
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
      title: 'Обжарка',
      type: 'string',
      options: {
        list: [
          { title: 'Светлая', value: 'светлая' },
          { title: 'Средняя', value: 'средняя' },
          { title: 'Тёмная', value: 'тёмная' },
        ],
      },
      validation: (r) => r.required(),
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
      title: 'Обычная цена (₽, за 250г)',
      type: 'number',
      validation: (r) => r.required().positive(),
    }),
    defineField({
      name: 'subscriptionPrice',
      title: 'Цена по подписке (₽, за 250г)',
      description: 'Оставьте пустым, если скидка по подписке не предусмотрена',
      type: 'number',
    }),
    defineField({
      name: 'weight',
      title: 'Вес (г)',
      type: 'number',
      initialValue: 250,
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
