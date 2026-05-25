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
  recurrent?: boolean; // true for the first subscription payment
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
  if (params.recurrent) body.Recurrent = 'Y';

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

// ── Recurring charge ──────────────────────────────────────────────────────────
// Used for monthly billing: Init a new payment then immediately Charge it
// against the stored RebillId (no user interaction needed).

export interface TBankChargeResult {
  success: boolean;
  paymentId: string;
  status: string;
  errorCode?: string;
  message?: string;
}

export async function chargeRecurring(
  orderId: string,
  amount: number,       // kopecks
  description: string,
  rebillId: string,
  notificationUrl: string,
): Promise<TBankChargeResult> {
  // Step 1: Init (creates a new PaymentId; no payment URL needed)
  const initBody: Record<string, string | number> = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount,
    OrderId: orderId,
    Description: description,
    // No SuccessURL/FailURL — recurring charge bypasses the payment page
  };
  initBody.Token = generateToken(initBody as Record<string, string | number | boolean>);

  const initRes = await fetch(`${BASE_URL}/Init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initBody),
  });
  const initData = await initRes.json();

  if (!initData.Success) {
    return { success: false, paymentId: '', status: 'INIT_FAILED', errorCode: initData.ErrorCode, message: initData.Message };
  }

  const paymentId = String(initData.PaymentId);

  // Step 2: Charge using stored RebillId
  const chargeBody: Record<string, string | number> = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: paymentId,
    RebillId: rebillId,
  };
  chargeBody.Token = generateToken(chargeBody as Record<string, string | number | boolean>);

  const chargeRes = await fetch(`${BASE_URL}/Charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chargeBody),
  });
  const chargeData = await chargeRes.json();

  return {
    success: chargeData.Success === true,
    paymentId,
    status: chargeData.Status ?? 'UNKNOWN',
    errorCode: chargeData.ErrorCode,
    message: chargeData.Message,
  };
}
