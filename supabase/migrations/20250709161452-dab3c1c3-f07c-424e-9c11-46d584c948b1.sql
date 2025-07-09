-- Create storage bucket for agent avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-avatars', 'agent-avatars', true);

-- Create policies for agent avatar uploads
CREATE POLICY "Agent avatars are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Anyone can upload agent avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agent-avatars');

CREATE POLICY "Anyone can update agent avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Anyone can delete agent avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agent-avatars');