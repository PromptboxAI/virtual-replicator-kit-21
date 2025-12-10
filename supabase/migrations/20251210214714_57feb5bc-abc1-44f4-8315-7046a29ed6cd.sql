-- Add missing press-releases page
INSERT INTO site_metadata (page_path, page_name, title, description, is_indexable, is_dynamic, is_global)
VALUES 
  ('/press-releases', 'Press Releases', 'Press Releases | PromptBox', 'Latest news and press releases from PromptBox', true, false, false),
  ('/dashboard', 'Dashboard', 'Dashboard | PromptBox', 'Manage your AI agents and view your portfolio', true, false, false)
ON CONFLICT (page_path) DO NOTHING;