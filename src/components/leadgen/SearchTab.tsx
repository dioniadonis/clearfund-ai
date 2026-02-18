import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import LeadsTable, { Lead } from './LeadsTable';
import ResultsTable from './ResultsTable';
import InfoTip from './InfoTip';

const BLOCKED_DOMAINS = [
  'google.com', 'googleapis.com', 'gstatic.com', 'youtube.com',
  'accounts.google', 'support.google', 'maps.google', 'play.google',
  'chrome.google', 'policies.google', 'webcache.googleusercontent.com',
];

function isUrl(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('google.com/search');
}

function extractLinksFromMarkdown(markdown: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)"\]>]+/g;
  return [...new Set(markdown.match(urlRegex) || [])];
}

function isBusinessLink(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return !BLOCKED_DOMAINS.some(d => hostname.includes(d));
  } catch {
    return false;
  }
}

function deduplicateLeads(leads: Lead[]): Lead[] {
  const seen = new Set<string>();
  return leads.filter(lead => {
    const key = lead.email || (lead.business_name && lead.phone ? `${lead.business_name}::${lead.phone}` : '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SearchTab: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawResult, setRawResult] = useState<any>(null);

  const detectedMode = useMemo(() => {
    if (!query.trim()) return null;
    return isUrl(query) ? 'url' : 'query';
  }, [query]);

  const extractLeadsFromContent = async (content: string, sourceUrl: string): Promise<Lead[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-leads', {
        body: { content, sourceUrl },
      });
      if (!error && data?.success && data.leads?.length) return data.leads;
    } catch (err) {
      console.error('Extract failed for', sourceUrl, err);
    }
    return [];
  };

  const handleUrlMode = async (url: string, numLimit: number) => {
    setStatus('Scraping search results page...');
    const scrapeRes = await firecrawlApi.scrape(url, { formats: ['markdown', 'links'] });

    if (!scrapeRes.success) {
      toast({ title: 'Error', description: scrapeRes.error || 'Failed to scrape the URL', variant: 'destructive' });
      return;
    }

    setRawResult(scrapeRes.data);

    // Extract links from both the links array and markdown content
    const responseData = scrapeRes.data?.data || scrapeRes.data || {};
    const linksFromApi: string[] = responseData.links || [];
    const linksFromMarkdown = extractLinksFromMarkdown(responseData.markdown || '');
    const allLinks = [...new Set([...linksFromApi, ...linksFromMarkdown])];
    const businessLinks = allLinks.filter(isBusinessLink).slice(0, numLimit);

    if (!businessLinks.length) {
      toast({ title: 'No links found', description: 'Could not extract any business links from this page.', variant: 'destructive' });
      return;
    }

    setStatus(`Found ${businessLinks.length} links. Scraping each for leads...`);
    const allLeads: Lead[] = [];

    for (let i = 0; i < businessLinks.length; i++) {
      const link = businessLinks[i];
      setStatus(`Scraping link ${i + 1} of ${businessLinks.length}...`);

      try {
        const pageRes = await firecrawlApi.scrape(link, { formats: ['markdown'] });
        const pageData = pageRes.data?.data || pageRes.data || {};
        const markdown = pageData.markdown || '';

        if (markdown) {
          setStatus(`Extracting leads from link ${i + 1} of ${businessLinks.length}...`);
          const extracted = await extractLeadsFromContent(markdown, link);
          allLeads.push(...extracted);
          setLeads(deduplicateLeads([...allLeads]));
        }
      } catch (err) {
        console.error(`Failed to process link ${i + 1}:`, link, err);
      }
    }

    const unique = deduplicateLeads(allLeads);
    setLeads(unique);

    if (unique.length) {
      toast({ title: 'Done', description: `Extracted ${unique.length} leads from ${businessLinks.length} links.` });
    } else {
      toast({ title: 'No leads found', description: 'AI could not extract leads from any of the scraped pages.' });
    }
  };

  const handleQueryMode = async (searchQuery: string, numLimit: number) => {
    setStatus('Searching the web...');
    const response = await firecrawlApi.search(searchQuery, {
      limit: numLimit,
      scrapeOptions: { formats: ['markdown'] },
    });

    if (!response.success) {
      toast({ title: 'Error', description: response.error || 'Search failed', variant: 'destructive' });
      return;
    }

    const results = Array.isArray(response.data) ? response.data : [];
    setRawResult(response.data || response);

    if (!results.length) {
      toast({ title: 'No results', description: 'Search returned no results.', variant: 'destructive' });
      return;
    }

    const allLeads: Lead[] = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      const markdown = item.markdown || item.content || '';
      if (!markdown) continue;

      setStatus(`Extracting leads from result ${i + 1} of ${results.length}...`);
      const extracted = await extractLeadsFromContent(markdown, item.url || item.sourceURL || '');
      allLeads.push(...extracted);
      setLeads(deduplicateLeads([...allLeads]));
    }

    const unique = deduplicateLeads(allLeads);
    setLeads(unique);

    if (unique.length) {
      toast({ title: 'Done', description: `Extracted ${unique.length} leads from ${results.length} results.` });
    } else {
      toast({ title: 'No leads found', description: 'AI could not extract leads from the search results.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLeads([]);
    setRawResult(null);
    setStatus('');

    try {
      const numLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

      if (isUrl(query)) {
        await handleUrlMode(query.trim(), numLimit);
      } else {
        await handleQueryMode(query.trim(), numLimit);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Operation failed', variant: 'destructive' });
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
            Search query or URL
            <InfoTip text="Paste a text query to search the web, OR paste a Google search URL to scrape those results directly. Both modes extract leads automatically using AI." />
          </Label>
          <div className="relative">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Paste a query OR a Google search URL'
              required
            />
            {detectedMode && (
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0"
              >
                {detectedMode === 'url' ? '🔗 URL mode' : '🔍 Query mode'}
              </Badge>
            )}
          </div>
        </div>
        <div className="w-24 space-y-2">
          <Label className="flex items-center">
            Limit
            <InfoTip text="Number of results/links to process (1–20). More = more leads but takes longer." />
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
