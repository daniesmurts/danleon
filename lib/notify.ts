/**
 * Email notifications via Mailgun REST API.
 *
 * Required env vars:
 *   MAILGUN_API_KEY   — Mailgun → Account → API Keys
 *   MAILGUN_DOMAIN    — sending domain, e.g. mg.danleon.ru
 *   ADMIN_EMAIL       — admin inbox
 * Optional:
 *   MAILGUN_REGION    — 'eu' (default) or 'us'
 */

// ── Transport ──────────────────────────────────────────────────────────────────

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    console.warn('notify: MAILGUN_API_KEY or MAILGUN_DOMAIN not set — skipping');
    return;
  }

  const region  = (process.env.MAILGUN_REGION ?? 'eu').toLowerCase();
  const baseUrl = region === 'us' ? 'https://api.mailgun.net' : 'https://api.eu.mailgun.net';
  const auth    = Buffer.from(`api:${apiKey}`).toString('base64');

  const body = new URLSearchParams({
    from:    `ДАНЛЕОН <noreply@${domain}>`,
    to,
    subject,
    html,
  });

  try {
    const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method:  'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`notify: Mailgun ${res.status} — ${text}`);
    }
  } catch (err) {
    console.error('notify: send failed:', err);
  }
}

async function sendToAdmin(subject: string, html: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) { console.warn('notify: ADMIN_EMAIL not set'); return; }
  await sendMail(adminEmail, subject, html);
}

async function sendToUser(email: string, subject: string, html: string): Promise<void> {
  if (!email) return;
  await sendMail(email, subject, html);
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://danleon.ru';
const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ₽';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;color:#888;font-family:Georgia,serif;
               letter-spacing:0.08em;text-transform:uppercase;width:40%;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#2c1a0e;font-family:Georgia,serif;font-weight:bold;">${value}</td>
  </tr>`;
}
function tbl(...rows: string[]) {
  return `<table width="100%" cellpadding="0" cellspacing="0"
    style="border-top:1px solid #f0ebe0;border-bottom:1px solid #f0ebe0;margin:20px 0;padding:12px 0;">
    ${rows.join('')}</table>`;
}
function h1(text: string, color = '#2c1a0e') {
  return `<p style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:900;
                    letter-spacing:0.08em;color:${color};text-transform:uppercase;">${text}</p>`;
}
function sub(text: string) {
  return `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:13px;color:#888;">${text}</p>`;
}
function btn(label: string, url: string, color = '#2c1a0e') {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;
    background:${color};color:#fff;font-family:Georgia,serif;font-size:12px;font-weight:bold;
    letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">${label}</a>`;
}

/** Admin-style layout (dark espresso header, "Уведомление администратора") */
function wrapAdmin(title: string, accent: string, body: string) {
  return layout(title, accent, 'Уведомление администратора', body);
}

/** User-style layout (same look, but "Премиальный угандийский кофе" tagline + unsubscribe hint) */
function wrapUser(title: string, accent: string, body: string) {
  return layout(title, accent, 'Премиальный угандийский кофе', body, true);
}

function layout(title: string, accent: string, tagline: string, body: string, isUser = false) {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <tr><td style="background:#2c1a0e;padding:28px 36px;border-bottom:3px solid ${accent};">
      <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:900;
                letter-spacing:0.2em;color:#f5f0e8;text-transform:uppercase;">ДАНЛЕОН</p>
      <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:11px;
                letter-spacing:0.25em;color:rgba(245,240,232,0.4);text-transform:uppercase;">${tagline}</p>
    </td></tr>
    <tr><td style="background:#fff;padding:32px 36px;">${body}</td></tr>
    <tr><td style="background:#2c1a0e;padding:16px 36px;text-align:center;">
      <p style="margin:0;font-family:Georgia,serif;font-size:11px;
                color:rgba(245,240,232,0.3);letter-spacing:0.1em;">
        ${isUser
          ? `<a href="${APP}" style="color:rgba(245,240,232,0.4);text-decoration:none;">danleon.ru</a>`
          : 'danleon.ru · Только для администратора'}
      </p>
    </td></tr>
  </table>
  </td></tr>
</table></body></html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

/** Admin: new paid order */
export async function notifyAdminNewOrder(params: {
  orderId: string;
  docId: string;
  grandTotal: number;
  items: Array<{ productName: string; quantity: number; weight: number }>;
  customer: { firstName?: string; lastName?: string; phone?: string; email?: string; city?: string };
  deliveryMethod: string;
}) {
  const { orderId, docId, grandTotal, items, customer, deliveryMethod } = params;
  const itemList = items.map((i) => `${i.productName} × ${i.quantity} (${i.weight}г)`).join('<br>');

  const html = wrapAdmin('Новый заказ', '#16a34a', `
    ${h1('Новый заказ оплачен ✓', '#16a34a')}
    ${sub(`Заказ ${orderId} успешно оплачен и ждёт обработки.`)}
    ${tbl(
      row('Сумма',     fmt(grandTotal)),
      row('Клиент',    `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || '—'),
      row('Телефон',   customer.phone   || '—'),
      row('Email',     customer.email   || '—'),
      row('Город',     customer.city    || '—'),
      row('Доставка',  deliveryMethod),
      row('Состав',    itemList),
    )}
    ${btn('Открыть заказ', `${APP}/admin/orders/${docId}`)}
  `);

  await sendToAdmin(`Новый заказ ${orderId} — ${fmt(grandTotal)}`, html);
}

/** Admin: order payment failed */
export async function notifyAdminPaymentFailed(params: {
  orderId: string; docId: string; grandTotal: number; customerEmail?: string;
}) {
  const { orderId, docId, grandTotal, customerEmail } = params;
  const html = wrapAdmin('Оплата не прошла', '#b91c1c', `
    ${h1('Оплата не прошла', '#b91c1c')}
    ${sub(`Клиент не завершил оплату заказа ${orderId}.`)}
    ${tbl(row('Заказ', orderId), row('Сумма', fmt(grandTotal)), row('Email', customerEmail || '—'))}
    ${btn('Открыть заказ', `${APP}/admin/orders/${docId}`, '#b91c1c')}
  `);
  await sendToAdmin(`Оплата не прошла — заказ ${orderId}`, html);
}

/** Admin: refund or reversal */
export async function notifyAdminRefund(params: { orderId: string; docId: string; status: string }) {
  const { orderId, docId, status } = params;
  const label = status === 'refunded' ? 'возврат средств' : 'отмена';
  const html = wrapAdmin('Возврат / отмена', '#b91c1c', `
    ${h1('Возврат или отмена заказа', '#b91c1c')}
    ${sub(`По заказу ${orderId} инициирован ${label}.`)}
    ${tbl(row('Заказ', orderId), row('Статус', status))}
    ${btn('Открыть заказ', `${APP}/admin/orders/${docId}`, '#b91c1c')}
  `);
  await sendToAdmin(`Возврат — заказ ${orderId}`, html);
}

/** Admin: new subscriber */
export async function notifyAdminNewSubscription(params: {
  subDocId: string; userId: string; frequency: string; unitPrice: number;
}) {
  const { userId, frequency, unitPrice } = params;
  const freqLabel = frequency === 'biweekly' ? 'раз в 2 недели' : 'раз в месяц';
  const html = wrapAdmin('Новый подписчик', '#2c1a0e', `
    ${h1('Новый подписчик! 🎉')}
    ${sub('Пользователь оформил подписку и первый платёж прошёл успешно.')}
    ${tbl(
      row('Пользователь',  userId.slice(0, 14) + '…'),
      row('Периодичность', freqLabel),
      row('Стоимость',     fmt(unitPrice) + ' / период'),
    )}
    ${btn('Подписки', `${APP}/admin/subscriptions`)}
  `);
  await sendToAdmin('Новый подписчик — ДАНЛЕОН', html);
}

/** Admin: renewal charged */
export async function notifyAdminRenewalCharged(params: {
  subDocId: string; userId: string; amount: number; nextBillingDate: string;
}) {
  const { userId, amount, nextBillingDate } = params;
  const html = wrapAdmin('Автоплатёж прошёл', '#16a34a', `
    ${h1('Автоплатёж подписки ✓', '#16a34a')}
    ${sub('Регулярный платёж по подписке успешно списан.')}
    ${tbl(
      row('Пользователь',     userId.slice(0, 14) + '…'),
      row('Сумма',            fmt(amount)),
      row('Следующий платёж', fmtDate(nextBillingDate)),
    )}
    ${btn('Подписки', `${APP}/admin/subscriptions`)}
  `);
  await sendToAdmin(`Автоплатёж подписки — ${fmt(amount)}`, html);
}

/** Admin: renewal failed */
export async function notifyAdminRenewalFailed(params: {
  subDocId: string; userId: string; error?: string;
}) {
  const { userId, error } = params;
  const html = wrapAdmin('Автоплатёж не прошёл', '#b91c1c', `
    ${h1('Автоплатёж подписки не прошёл!', '#b91c1c')}
    ${sub('Не удалось списать средства. Статус изменён на «Просрочена».')}
    ${tbl(row('Пользователь', userId.slice(0, 14) + '…'), row('Ошибка', error || 'неизвестно'))}
    ${btn('Открыть подписки', `${APP}/admin/subscriptions`, '#b91c1c')}
  `);
  await sendToAdmin('⚠️ Автоплатёж подписки не прошёл', html);
}

/** Admin: subscription cancelled */
export async function notifyAdminSubscriptionCancelled(params: {
  subDocId: string; userId: string; cancelledBy: 'admin' | 'user';
}) {
  const { userId, cancelledBy } = params;
  const html = wrapAdmin('Подписка отменена', '#78716c', `
    ${h1('Подписка отменена', '#78716c')}
    ${sub(cancelledBy === 'user' ? 'Пользователь самостоятельно отменил подписку.' : 'Подписка отменена администратором.')}
    ${tbl(
      row('Пользователь', userId.slice(0, 14) + '…'),
      row('Отменил',      cancelledBy === 'user' ? 'Пользователь' : 'Администратор'),
    )}
    ${btn('Подписки', `${APP}/admin/subscriptions`)}
  `);
  await sendToAdmin('Подписка отменена', html);
}

/** Admin: daily cron summary */
export async function notifyAdminCronSummary(params: {
  charged: number; failed: number; skipped: number; totalRevenue: number;
}) {
  const { charged, failed, skipped, totalRevenue } = params;
  if (charged === 0 && failed === 0) return;

  const accent = failed > 0 ? '#b91c1c' : '#16a34a';
  const title  = failed > 0 ? `⚠️ Автоплатежи: ${charged} ✓ ${failed} ✗` : `Автоплатежи: ${charged} списано`;

  const html = wrapAdmin('Сводка автоплатежей', accent, `
    ${h1('Ежедневная сводка автоплатежей')}
    ${sub('Результаты запуска планировщика подписок.')}
    ${tbl(
      row('Успешно списано', String(charged)),
      row('Ошибки',         failed > 0 ? `<span style="color:#b91c1c;font-weight:bold;">${failed}</span>` : '0'),
      row('Пропущено',      String(skipped)),
      row('Выручка',        fmt(totalRevenue)),
    )}
    ${failed > 0 ? btn('Проверить просроченные', `${APP}/admin/subscriptions`, '#b91c1c') : ''}
  `);
  await sendToAdmin(title, html);
}

// ══════════════════════════════════════════════════════════════════════════════
//  USER NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

/** User: order confirmation */
export async function notifyUserOrderConfirmed(params: {
  email: string;
  firstName: string;
  orderId: string;
  grandTotal: number;
  items: Array<{ productName: string; quantity: number; weight: number }>;
  deliveryMethod: string;
}) {
  const { email, firstName, orderId, grandTotal, items, deliveryMethod } = params;
  const itemList = items.map((i) => `${i.productName} × ${i.quantity} (${i.weight}г)`).join('<br>');
  const deliveryLabel: Record<string, string> = {
    courier: 'Курьер', pickup: 'Самовывоз', sdek: 'СДЭК', yandex_market: 'ПВЗ Яндекс Маркет',
  };

  const html = wrapUser('Заказ подтверждён', '#16a34a', `
    ${h1('Заказ принят ✓', '#16a34a')}
    ${sub(`${firstName}, спасибо за покупку! Мы уже готовим ваш заказ.`)}
    ${tbl(
      row('Номер заказа', orderId),
      row('Сумма',        fmt(grandTotal)),
      row('Состав',       itemList),
      row('Доставка',     deliveryLabel[deliveryMethod] ?? deliveryMethod),
    )}
    <p style="margin:20px 0 0;font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;">
      Мы свяжемся с вами для уточнения деталей доставки. Если у вас есть вопросы — пишите на
      <a href="mailto:daniel@boadtech.com" style="color:#b91c1c;">daniel@boadtech.com</a>
      или звоните <a href="tel:+79179040998" style="color:#b91c1c;">+7 917 904-09-98</a>.
    </p>
    ${btn('Перейти на сайт', APP)}
  `);
  await sendToUser(email, `Заказ ${orderId} подтверждён — ДАНЛЕОН`, html);
}

/** User: subscription activated */
export async function notifyUserSubscriptionActivated(params: {
  email: string;
  firstName: string;
  frequency: string;
  unitPrice: number;
  nextBillingDate: string;
}) {
  const { email, firstName, frequency, unitPrice, nextBillingDate } = params;
  const freqLabel = frequency === 'biweekly' ? 'каждые 2 недели' : 'каждый месяц';

  const html = wrapUser('Подписка активна', '#2c1a0e', `
    ${h1('Подписка активирована ✓')}
    ${sub(`${firstName}, добро пожаловать в клуб подписчиков ДАНЛЕОН!`)}
    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;color:#2c1a0e;line-height:1.7;">
      Теперь вам доступны специальные цены на весь ассортимент. Оплата ${freqLabel} — ${fmt(unitPrice)}.
    </p>
    ${tbl(
      row('Стоимость',        fmt(unitPrice) + ' / период'),
      row('Периодичность',    freqLabel),
      row('Следующий платёж', fmtDate(nextBillingDate)),
    )}
    <p style="margin:20px 0 0;font-family:Georgia,serif;font-size:12px;color:#aaa;line-height:1.6;">
      Управлять подпиской можно в личном кабинете. Отменить можно в любой момент.
    </p>
    ${btn('Личный кабинет', `${APP}/account/subscription`)}
  `);
  await sendToUser(email, 'Подписка ДАНЛЕОН активирована', html);
}

/** User: subscription renewal charged */
export async function notifyUserRenewalCharged(params: {
  email: string;
  firstName: string;
  amount: number;
  nextBillingDate: string;
}) {
  const { email, firstName, amount, nextBillingDate } = params;

  const html = wrapUser('Автоплатёж списан', '#2c1a0e', `
    ${h1('Подписка продлена ✓')}
    ${sub(`${firstName}, ваша подписка ДАНЛЕОН успешно продлена.`)}
    ${tbl(
      row('Списано',          fmt(amount)),
      row('Следующий платёж', fmtDate(nextBillingDate)),
    )}
    <p style="margin:20px 0 0;font-family:Georgia,serif;font-size:12px;color:#aaa;line-height:1.6;">
      Чтобы приостановить или отменить подписку — перейдите в личный кабинет.
    </p>
    ${btn('Личный кабинет', `${APP}/account/subscription`)}
  `);
  await sendToUser(email, `Подписка ДАНЛЕОН продлена — ${fmt(amount)}`, html);
}

/** User: upcoming renewal reminder (send 3 days before billing) */
export async function notifyUserRenewalReminder(params: {
  email: string;
  firstName: string;
  amount: number;
  billingDate: string;
}) {
  const { email, firstName, amount, billingDate } = params;

  const html = wrapUser('Напоминание о платеже', '#2c1a0e', `
    ${h1('Напоминание о продлении подписки')}
    ${sub(`${firstName}, через 3 дня спишем оплату за следующий период.`)}
    ${tbl(
      row('Дата списания', fmtDate(billingDate)),
      row('Сумма',         fmt(amount)),
    )}
    <p style="margin:20px 0 0;font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;">
      Убедитесь, что на карте достаточно средств. Если хотите отменить подписку до списания — сделайте это в личном кабинете.
    </p>
    ${btn('Управление подпиской', `${APP}/account/subscription`)}
  `);
  await sendToUser(email, 'Напоминание: продление подписки ДАНЛЕОН через 3 дня', html);
}

/** User: renewal failed — card issue */
export async function notifyUserRenewalFailed(params: {
  email: string;
  firstName: string;
}) {
  const { email, firstName } = params;

  const html = wrapUser('Проблема с оплатой', '#b91c1c', `
    ${h1('Не удалось продлить подписку', '#b91c1c')}
    ${sub(`${firstName}, к сожалению, автоплатёж не прошёл.`)}
    <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;color:#2c1a0e;line-height:1.7;">
      Возможно, на карте недостаточно средств или истёк срок её действия. Наш менеджер свяжется с вами для уточнения деталей.
    </p>
    <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;">
      Если у вас вопросы — напишите на
      <a href="mailto:daniel@boadtech.com" style="color:#b91c1c;">daniel@boadtech.com</a>
      или позвоните <a href="tel:+79179040998" style="color:#b91c1c;">+7 917 904-09-98</a>.
    </p>
    ${btn('Личный кабинет', `${APP}/account/subscription`, '#b91c1c')}
  `);
  await sendToUser(email, 'Проблема с оплатой подписки ДАНЛЕОН', html);
}

/** User: order status changed (shipped, delivered, etc.) */
export async function notifyUserOrderStatus(params: {
  email: string;
  firstName: string;
  orderId: string;
  status: string;
}) {
  const { email, firstName, orderId, status } = params;

  const statusMap: Record<string, { label: string; detail: string; color: string }> = {
    paid:      { label: 'Оплачен',         detail: 'Мы получили оплату и приступаем к сборке.',          color: '#16a34a' },
    shipped:   { label: 'Отправлен',        detail: 'Ваш заказ передан в доставку.',                     color: '#2563eb' },
    delivered: { label: 'Доставлен',        detail: 'Ваш заказ доставлен. Приятного кофе!',              color: '#16a34a' },
    cancelled: { label: 'Отменён',          detail: 'Ваш заказ был отменён. Если это ошибка — свяжитесь с нами.', color: '#b91c1c' },
    refunded:  { label: 'Возврат оформлен', detail: 'Средства будут возвращены на карту в течение 3–5 дней.', color: '#78716c' },
  };

  const info = statusMap[status] ?? { label: status, detail: '', color: '#2c1a0e' };

  const html = wrapUser(`Статус заказа: ${info.label}`, info.color, `
    ${h1(`Заказ ${orderId}: ${info.label}`, info.color)}
    ${sub(`${firstName}, статус вашего заказа обновлён.`)}
    ${info.detail ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:14px;color:#2c1a0e;line-height:1.7;">${info.detail}</p>` : ''}
    <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;">
      Вопросы? Пишите на
      <a href="mailto:daniel@boadtech.com" style="color:#b91c1c;">daniel@boadtech.com</a>
      или звоните <a href="tel:+79179040998" style="color:#b91c1c;">+7 917 904-09-98</a>.
    </p>
    ${btn('Перейти на сайт', APP)}
  `);
  await sendToUser(email, `Заказ ${orderId} — ${info.label} · ДАНЛЕОН`, html);
}
