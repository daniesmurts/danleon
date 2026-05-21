import { createHash } from 'crypto';

const BASE_URL = 'https://securepay.tinkoff.ru/v2';
const TERMINAL_KEY = process.env.TBANK_TERMINAL_KEY!;
const SECRET_KEY = process.env.TBANK_SECRET_KEY!;

export function generateToken(params: Record<string, string | number | boolean>): string {
  const withPassword: Record<string, string | number | boolean> = {
    ...params,
    Password: SECRET_KEY,
  };

  const sorted = Object.keys(withPassword)
    .sort()
    .map((key) => String(withPassword[key]))
    .join('');

  return createHash('sha256').update(sorted, 'utf8').digest('hex');
}

export function verifyToken(params: Record<string, string | number | boolean>): boolean {
  const { Token, ...rest } = params;
  return generateToken(rest) === Token;
}

export interface TBankInitParams {
  orderId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  successUrl: string;
  failUrl: string;
  notificationUrl: string;
}

export interface TBankInitResult {
  paymentId: string;
  paymentUrl: string;
  status: string;
}

export async function initPayment(params: TBankInitParams): Promise<TBankInitResult> {
  const body: Record<string, string | number> = {
    TerminalKey: TERMINAL_KEY,
    Amount: params.amount,
    OrderId: params.orderId,
    Description: params.description,
    SuccessURL: params.successUrl,
    FailURL: params.failUrl,
    NotificationURL: params.notificationUrl,
  };

  body.Token = generateToken(body as Record<string, string | number | boolean>);

  const response = await fetch(`${BASE_URL}/Init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.Success) {
    throw new Error(`TBank Init failed: ${data.Message} (${data.ErrorCode})`);
  }

  return {
    paymentId: String(data.PaymentId),
    paymentUrl: data.PaymentURL,
    status: data.Status,
  };
}
