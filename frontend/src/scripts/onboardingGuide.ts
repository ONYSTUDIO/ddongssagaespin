import { supabase } from './supabase';

export const GUIDE_STEP = {
  SPIN:     0,
  FORTUNE:  1,
  MINIGAME: 2,
  DONE:     3,
} as const;

export async function fetchGuideStep(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', userId)
    .single();
  return (data as { onboarding_step: number } | null)?.onboarding_step ?? GUIDE_STEP.SPIN;
}

export async function saveGuideStep(userId: string, step: number): Promise<void> {
  await supabase
    .from('profiles')
    .update({ onboarding_step: step })
    .eq('id', userId);
}
