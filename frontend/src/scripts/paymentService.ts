import { loadTossPayments } from '@tosspayments/payment-sdk';

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string;

export interface PendingPayment {
  orderId: string;
  amount: number;
  productName: string;
  userId: string | null;
}

export function getPendingPayment(): PendingPayment | null {
  const raw = sessionStorage.getItem('pendingPayment');
  return raw ? (JSON.parse(raw) as PendingPayment) : null;
}

export function clearPendingPayment(): void {
  sessionStorage.removeItem('pendingPayment');
}

function savePendingPayment(data: PendingPayment): void {
  sessionStorage.setItem('pendingPayment', JSON.stringify(data));
}

function generateOrderId(): string {
  return `support-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function initiateTossPayment(
  amount: number,
  productName: string,
  userId: string | null,
): Promise<void> {
  const orderId = generateOrderId();

  savePendingPayment({ orderId, amount, productName, userId });

  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

  await tossPayments.requestPayment('카드', {
    amount,
    orderId,
    orderName: `황금똥: ${productName}`,
    successUrl: `${window.location.origin}/`,
    failUrl: `${window.location.origin}/?paymentFail=toss`,
  });
}
