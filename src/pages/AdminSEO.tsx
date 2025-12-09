import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { SEOManager } from '@/components/admin/SEOManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSEO() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>SEO Manager | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">SEO & Metadata Manager</h1>
            <p className="text-muted-foreground">
              Manage page titles, descriptions, and social images
            </p>
          </div>
        </div>
        
        <SEOManager />
      </main>
    </div>
  );
}
