-- ==========================================================================
-- Cleanup QA / Test Rows from Supabase (Run once in Supabase SQL Editor)
-- ==========================================================================

delete from public.tour_bookings
where email in ('test@example.com', 'ayesha.test@example.com');

delete from public.admissions_applications
where email in ('omar.test@example.com', 'test@example.com');

delete from public.newsletter_subscribers
where email in ('test-newsletter@example.com', 'test@example.com');
