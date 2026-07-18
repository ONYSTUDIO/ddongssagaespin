import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { paymentKey, orderId, amount, userId } =
      await req.json() as { paymentKey: string; orderId: string; amount: number; userId: string | null };

    // 1. 토스페이먼츠 최종 승인 확인
    const secretKey  = Deno.env.get('TOSS_SECRET_KEY') ?? '';
    const authHeader = 'Basic ' + btoa(`${secretKey}:`);

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `Toss API error ${tossRes.status}`);
    }

    // 2. DB 업데이트 (service role 사용 — RLS 우회)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('support_transactions').upsert({
      order_id:         orderId,
      user_id:          userId ?? null,
      amount,
      payment_provider: 'toss',
      payment_status:   'paid',
      payment_id:       paymentKey,
    }, { onConflict: 'order_id' });

    if (error) throw new Error(`DB error: ${error.message}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
