import { NextRequest, NextResponse } from 'next/server';
import { notifyAdminContactMessage } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }

    await notifyAdminContactMessage({ name, email, subject: subject || '', message });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 });
  }
}
