import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import ResultsTable from './ResultsTable';

const CrawlTab: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const response = await firecrawlApi.crawl(url, { limit: parseInt(limit) || 10 });
      if (response.success) {
        toast({ title: 'Success', description: 'Crawl started' });
        setResult(response.data || response);
      } else {
        toast({ title: 'Error', description: response.error || 'Crawl failed', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Crawl failed', variant: 'destructive' });
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
        <div className="w-24 space-y-2">
          <Label>Limit</Label>
          <Input type="number" value={limit} onChange={e => setLimit(e.target.value)} min="1" max="100" />
        </div>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Crawling...' : 'Crawl'}</Button>
      </form>
      <ResultsTable data={result} title="Crawl Results" />
    </div>
  );
};

export default CrawlTab;
