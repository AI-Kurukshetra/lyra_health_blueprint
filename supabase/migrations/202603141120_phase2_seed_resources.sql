insert into public.resources (organization_id, title, description, category, url, is_global)
values
  (null, 'Grounding Exercise: 5-4-3-2-1', 'A short grounding method for anxiety and panic moments.', 'anxiety', 'https://www.lyrahealth.com', true),
  (null, 'Sleep Reset Worksheet', 'Practical sleep hygiene checklist for evening wind-down.', 'sleep', 'https://www.lyrahealth.com', true),
  (null, 'Burnout Recovery Checklist', 'Steps to identify burnout patterns and recover sustainably.', 'burnout', 'https://www.lyrahealth.com', true),
  (null, 'Breathing Practice: Box Breathing', 'Simple 4x4 breathing technique for stress regulation.', 'stress', 'https://www.lyrahealth.com', true)
on conflict do nothing;

