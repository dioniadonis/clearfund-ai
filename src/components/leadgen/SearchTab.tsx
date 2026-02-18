import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import ResultsTable from './ResultsTable';

const SearchTab: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const response = await firecrawlApi.search(query, { limit: 10, scrapeOptions: { formats: ['markdown'] } });
      if (response.success) {
        toast({ title: 'Success', description: 'Search completed' });
        setResult(response.data || response);
      } else {
        toast({ title: 'Error', description: response.error || 'Search failed', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Search failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label>Search query</Label>
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="roofing contractor Miami email" required />
        </div>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</Button>
      </form>
      <ResultsTable data={result} title="Search Results" />
    </div>
  );
};

export default SearchTab;
