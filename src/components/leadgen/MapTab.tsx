import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import ResultsTable from './ResultsTable';

const MapTab: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const response = await firecrawlApi.map(url, { limit: 100 });
      if (response.success) {
        toast({ title: 'Success', description: 'Site mapped successfully' });
        setResult(response.data || response);
      } else {
        toast({ title: 'Error', description: response.error || 'Map failed', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Map failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label>Website URL</Label>
          <Input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required />
        </div>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Mapping...' : 'Map Site'}</Button>
      </form>
      <ResultsTable data={result} title="Map Results" />
    </div>
  );
};

export default MapTab;
