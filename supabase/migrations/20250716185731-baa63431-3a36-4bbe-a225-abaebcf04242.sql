
-- First, let's check if we need to add an INSERT policy for user_profiles
-- The table currently only has SELECT and UPDATE policies, but no INSERT policy

-- Add INSERT policy for user_profiles to allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also, let's make sure the farmers table has an INSERT policy
CREATE POLICY "Users can create their own farmer profile" 
ON public.farmers 
FOR INSERT 
WITH CHECK (auth.uid() = id);
