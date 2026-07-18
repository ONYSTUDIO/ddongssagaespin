import { getPendingPayment, clearPendingPayment } from './paymentService';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface PaymentResultInfo {
  success: boolean;
  message: string;
}

function cleanUrl(): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export async function checkPaymentResult(): Promise<PaymentResultInfo | null> {
  const params = new URLSearchParams(window.location.search);

  // ── 토스페이먼츠 성공 (paymentKey 파라미터로 감지) ─────────────────
  const paymentKey = params.get('paymentKey');
  const orderId    = params.get('orderId');
  const amount     = params.get('amount');

  if (paymentKey && orderId && amount) {
    cleanUrl();
    const pending = getPendingPayment();
    clearPendingPayment();

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/payment-confirm-toss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
          userId: pending?.userId ?? null,
        }),
      });

      if (res.ok) {
        return { success: true, message: '💩 황금똥이 개발자에게 전달됐습니다! 감사합니다 🙏' };
      }
      const err = await res.json().catch(() => ({})) as { error?: string };
      return { success: false, message: `결제 확인 실패: ${err.error ?? '알 수 없는 오류'}` };
    } catch {
      return { success: false, message: '결제 확인 중 오류가 발생했습니다.' };
    }
  }

  // ── 결제 실패 / 취소 ────────────────────────────────────────────────
  if (params.has('paymentFail')) {
    cleanUrl();
    clearPendingPayment();
    return { success: false, message: '결제가 취소되었습니다.' };
  }

  return null;
}

export function showPaymentResultToast(info: PaymentResultInfo): void {
  const el = document.getElementById('metaToast');
  if (!el) return;
  el.textContent = info.message;
  el.classList.add('meta-toast--visible');
  setTimeout(() => el.classList.remove('meta-toast--visible'), info.success ? 4000 : 3000);
}
