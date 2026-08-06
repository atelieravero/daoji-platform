-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_followup BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for forms table on event_id
CREATE INDEX IF NOT EXISTS forms_event_id_idx ON public.forms(event_id);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    applicant_token UUID NOT NULL,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for submissions table
CREATE INDEX IF NOT EXISTS submissions_form_id_idx ON public.submissions(form_id);
CREATE INDEX IF NOT EXISTS submissions_event_id_idx ON public.submissions(event_id);
CREATE INDEX IF NOT EXISTS submissions_applicant_token_idx ON public.submissions(applicant_token);

-- Enable Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;