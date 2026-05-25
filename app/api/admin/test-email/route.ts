// Temporary test endpoint — sends a test email to ADMIN_EMAIL.
// Hit GET /api/admin/test-email from the browser while logged in as admin.

import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const adminEmail = process.env.ADMIN_EMAIL;
  const region = (process.env.MAILGUN_REGION ?? 'us').toLowerCase();

  // Report missing vars
  const missing = ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'ADMIN_EMAIL'].filter(
    (k) => !process.env[k]
  );
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing env vars: ${missing.join(', ')}` }, { status: 500 });
  }

  const baseUrl = region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
  const auth = Buffer.from(`api:${apiKey}`).toString('base64');

  const body = new URLSearchParams({
    from: `ДАНЛЕОН Test <noreply@${domain}>`,
    to: adminEmail!,
    subject: '✅ Тест уведомлений ДАНЛЕОН',
    html: `
      <div style="font-family:Georgia,serif;padding:32px;background:#f5f0e8;">
        <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border-top:3px solid #2c1a0e;">
          <p style="font-size:22px;font-weight:900;letter-spacing:0.2em;color:#2c1a0e;text-transform:uppercase;margin:0 0 8px;">ДАНЛЕОН</p>
          <p style="font-size:11px;color:#aaa;letter-spacing:0.2em;margin:0 0 24px;">ТЕСТ EMAIL-УВЕДОМЛЕНИЙ</p>
          <p style="font-size:15px;color:#2c1a0e;line-height:1.7;">
            Если вы видите это письмо — Mailgun настроен правильно и уведомления работают. 🎉
          </p>
          <p style="font-size:12px;color:#aaa;margin-top:24px;">
            Регион: <strong>${region.toUpperCase()}</strong> · Домен: <strong>${domain}</strong>
          </p>
        </div>
      </div>
    `,
  });

  try {
    const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        status: res.status,
        response: text,
        hint: res.status === 401
          ? 'API key is invalid'
          : res.status === 404
          ? 'Domain not found — check MAILGUN_DOMAIN and that it is verified'
          : undefined,
      });
    }

    return NextResponse.json({ success: true, to: adminEmail, region, domain, response: text });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}
