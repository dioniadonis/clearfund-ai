-- Isolated regression checks for the payout trigger. Always rolls back.
BEGIN;

INSERT INTO public.agent_settings (singleton, assigned_payout_percent, referral_payout_percent, auto_assign)
VALUES (true, 30, 50, false)
ON CONFLICT (singleton) DO UPDATE SET
  assigned_payout_percent = EXCLUDED.assigned_payout_percent,
  referral_payout_percent = EXCLUDED.referral_payout_percent,
  auto_assign = false;

INSERT INTO public.agents (user_id, full_name, email, referral_code)
VALUES
  ('a1111111-1111-4111-8111-111111111111', 'TEST payout agent A', 'test-payout-a@example.invalid', 'CFTSTA0001'),
  ('a2222222-2222-4222-8222-222222222222', 'TEST payout agent B', 'test-payout-b@example.invalid', 'CFTSTB0002');

INSERT INTO public.crm_leads (id, firm, source, stage, assigned_to, clearfund_commission)
VALUES
  ('b1111111-1111-4111-8111-111111111111', 'TEST assigned payout', 'test', 'New', 'a1111111-1111-4111-8111-111111111111', 1000),
  ('b2222222-2222-4222-8222-222222222222', 'TEST referral payout', 'test', 'New', 'a1111111-1111-4111-8111-111111111111', 1000),
  ('b3333333-3333-4333-8333-333333333333', 'TEST cross-assigned payout', 'test', 'New', 'a2222222-2222-4222-8222-222222222222', 1000);

UPDATE public.crm_leads SET agent_id = 'a1111111-1111-4111-8111-111111111111'
WHERE id IN ('b2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333');
UPDATE public.crm_leads SET stage = 'Funded'
WHERE id IN ('b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agent_payouts WHERE lead_id = 'b1111111-1111-4111-8111-111111111111' AND payout_basis = 'assigned' AND agent_percent = 30 AND agent_amount = 300) THEN
    RAISE EXCEPTION 'Assigned-lead default must be 30 percent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agent_payouts WHERE lead_id = 'b2222222-2222-4222-8222-222222222222' AND payout_basis = 'own_referral' AND agent_percent = 50 AND agent_amount = 500) THEN
    RAISE EXCEPTION 'Own-referral default must be 50 percent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agent_payouts WHERE lead_id = 'b3333333-3333-4333-8333-333333333333' AND payout_basis = 'assigned' AND agent_percent = 30 AND agent_amount = 300) THEN
    RAISE EXCEPTION 'Different referring and assigned agents must use the assigned-lead setting';
  END IF;
END $$;

UPDATE public.agents SET assigned_payout_percent = 25, referral_payout_percent = 65
WHERE user_id = 'a1111111-1111-4111-8111-111111111111';
UPDATE public.crm_leads SET clearfund_commission = 1100
WHERE id IN ('b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agent_payouts WHERE lead_id = 'b1111111-1111-4111-8111-111111111111' AND agent_percent = 25 AND agent_amount = 275) THEN
    RAISE EXCEPTION 'Assigned-lead agent override was not applied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agent_payouts WHERE lead_id = 'b2222222-2222-4222-8222-222222222222' AND agent_percent = 65 AND agent_amount = 715) THEN
    RAISE EXCEPTION 'Own-referral agent override was not applied';
  END IF;
END $$;

SELECT lead_id, payout_basis, agent_percent, agent_amount
FROM public.agent_payouts
WHERE lead_id IN ('b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333')
ORDER BY lead_id;

ROLLBACK;
