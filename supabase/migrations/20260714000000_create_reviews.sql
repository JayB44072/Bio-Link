-- Table des avis publics de la landing page
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  rating     SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

-- Insertion publique (n'importe qui peut laisser un avis)
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);
