-- 05_rename_submission_viewer_role.sql

-- Find any arrays containing 'form_data_viewer' and replace it with 'submission_viewer'
UPDATE public.team_members 
SET roles = array_replace(roles, 'form_data_viewer', 'submission_viewer')
WHERE 'form_data_viewer' = ANY(roles);