-- Create the contract-bytecode bucket for storing V6 contract bytecodes
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-bytecode', 'contract-bytecode', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access so edge functions can fetch bytecode
CREATE POLICY "Allow public read access for contract bytecode"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-bytecode');