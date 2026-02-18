import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import LeadsTable, { Lead } from './LeadsTable';
import ResultsTable from './ResultsTable';
import InfoTip from './InfoTip';

const SearchTab: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawResult, setRawResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLeads([]);
    setRawResult(null);
    setStatus('Searching the web...');

    try {
      const numLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);
      const response = await firecrawlApi.search(query, {
        limit: numLimit,
        scrapeOptions: { formats: ['markdown'] },
      });

      if (!response.success) {
        toast({ title: 'Error', description: response.error || 'Search failed', variant: 'destructive' });
        setIsLoading(false);
        setStatus('');
        return;
      }

      const results = Array.isArray(response.data) ? response.data : [];
      setRawResult(response.data || response);

      if (!results.length) {
        toast({ title: 'No results', description: 'Search returned no results.', variant: 'destructive' });
        setIsLoading(false);
        setStatus('');
        return;
      }

      const allLeads: Lead[] = [];
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const markdown = item.markdown || item.content || '';
        if (!markdown) continue;

        setStatus(`Extracting leads from result ${i + 1} of ${results.length}...`);

        try {
          const { data, error } = await supabase.functions.invoke('extract-leads', {
            body: { content: markdown, sourceUrl: item.url || item.sourceURL || '' },
          });

          if (!error && data?.success && data.leads?.length) {
            allLeads.push(...data.leads);
            setLeads([...allLeads]);
          }
        } catch (err) {
          console.error(`Failed to extract from result ${i + 1}:`, err);
        }
      }

      if (allLeads.length) {
        toast({ title: 'Done', description: `Extracted ${allLeads.length} leads from ${results.length} results.` });
      } else {
        toast({ title: 'No leads found', description: 'AI could not extract leads from the search results.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Search failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label className="flex items-center">
            Search query
            <InfoTip text="Paste a query from the Query Generator. Searches the web, visits each result, and uses AI to extract lead info (name, email, phone)." />
          </Label>
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder='roofing "owner" "@gmail.com" "Miami"' required />
        </div>
        <div className="w-24 space-y-2">
          <Label className="flex items-center">
            Limit
            <InfoTip text="Number of search results to process (1–20). More results = more leads but takes longer." />
          </Label>
          <Input type="number" value={limit} onChange={e => setLimit(e.target.value)} min="1" max="20" />
        </div>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Working...' : 'Search & Extract'}</Button>
      </form>

      {status && (
        <div className="text-sm text-muted-foreground animate-pulse">{status}</div>
      )}

      <LeadsTable leads={leads} />
      <ResultsTable data={rawResult} title="Raw Search Results" />
    </div>
  );
};

export default SearchTab;
