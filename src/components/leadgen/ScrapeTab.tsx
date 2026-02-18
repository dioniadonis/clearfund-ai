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

const ScrapeTab: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawResult, setRawResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLeads([]);
    setRawResult(null);
    setStatus('Scraping page...');

    try {
      const response = await firecrawlApi.scrape(url, { formats: ['markdown', 'links'] });
      if (!response.success) {
        toast({ title: 'Error', description: response.error || 'Failed to scrape', variant: 'destructive' });
        setIsLoading(false);
        setStatus('');
        return;
      }

      const scraped = response.data || response;
      setRawResult(scraped);
      const markdown = scraped?.markdown || scraped?.data?.markdown || '';

      if (!markdown) {
        toast({ title: 'No content', description: 'Page returned no readable content.' });
        setIsLoading(false);
        setStatus('');
        return;
      }

      setStatus('Extracting leads with AI...');
      const { data, error } = await supabase.functions.invoke('extract-leads', {
        body: { content: markdown, sourceUrl: url },
      });

      if (!error && data?.success && data.leads?.length) {
        setLeads(data.leads);
        toast({ title: 'Done', description: `Extracted ${data.leads.length} leads.` });
      } else {
        toast({ title: 'No leads found', description: 'AI could not extract leads from this page.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to scrape', variant: 'destructive' });
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
            URL to scrape
            <InfoTip text="Enter a single page URL (e.g., a Yelp listing or company page). Extracts lead info from that one page." />
          </Label>
          <Input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yelp.com/biz/some-business" required />
        </div>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Working...' : 'Scrape & Extract'}</Button>
      </form>

      {status && (
        <div className="text-sm text-muted-foreground animate-pulse">{status}</div>
      )}

      <LeadsTable leads={leads} />
      <ResultsTable data={rawResult} title="Raw Scrape Data" />
    </div>
  );
};

export default ScrapeTab;
