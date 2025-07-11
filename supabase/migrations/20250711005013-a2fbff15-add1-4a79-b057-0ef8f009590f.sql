-- Create a function to manually set admin role (you'll run this once after logging in)
CREATE OR REPLACE FUNCTION public.set_user_as_admin(_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'User % has been set as admin', _user_id;
END;
$$;