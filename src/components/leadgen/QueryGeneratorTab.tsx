import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', site: 'site:instagram.com' },
  { id: 'facebook', label: 'Facebook', site: 'site:facebook.com' },
  { id: 'linkedin-profiles', label: 'LinkedIn Profiles', site: 'site:linkedin.com/in' },
  { id: 'linkedin-companies', label: 'LinkedIn Companies', site: 'site:linkedin.com/company' },
  { id: 'google-maps', label: 'Google Maps', site: 'site:google.com/maps' },
  { id: 'youtube', label: 'YouTube', site: 'site:youtube.com' },
  { id: 'yelp', label: 'Yelp', site: 'site:yelp.com/biz' },
  { id: 'bbb', label: 'BBB', site: 'site:bbb.org' },
];

const INDUSTRIES: Record<string, string[]> = {
  'Roofing': ['roofing', 'roofer', 'roof repair', 'roof replacement', 'commercial roofing', 'residential roofing'],
  'Contractors': ['general contractor', 'contractor', 'construction', 'remodeling'],
  'Landscaping/Lawn': ['landscaping', 'lawn care', 'lawn service', 'tree service'],
  'Trucking': ['trucking', 'owner operator', 'freight', 'hauling'],
  'Food Trucks': ['food truck', 'mobile kitchen', 'catering truck'],
};

const EMAIL_FILTERS = ['@gmail.com', '@outlook.com', '@yahoo.com', '@hotmail.com', '@icloud.com', '@proton.me', 'info@', 'sales@', 'contact@'];
const OWNER_SIGNALS = ['owner', 'founder', 'ceo', 'principal', 'partner', 'operator', 'president', 'licensed contractor'];
const LOCATIONS = ['Miami', 'Broward', 'Atlanta', 'Florida', 'Georgia'];

type QueryRow = { platform: string; query: string };

const QueryGeneratorTab: React.FC = () => {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [ownerSignal, setOwnerSignal] = useState('');
  const [location, setLocation] = useState('');
  const [queries, setQueries] = useState<QueryRow[]>([]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedPlatforms(PLATFORMS.map(p => p.id));
  const deselectAll = () => setSelectedPlatforms([]);

  const buildQuery = (platformSite: string, term: string, signal: string, email: string, loc: string) => {
    return `${platformSite} "${term}" "${signal}" "${email}" "${loc}"`;
  };

  const generate = () => {
    if (!selectedPlatforms.length || !industry || !emailFilter || !ownerSignal || !location) {
      toast({ title: 'Missing fields', description: 'Select at least one platform and fill all dropdowns.', variant: 'destructive' });
      return;
    }
    const term = INDUSTRIES[industry]?.[0] || industry;
    const emails = emailFilter === 'All' ? EMAIL_FILTERS : [emailFilter];
    const signals = ownerSignal === 'All' ? OWNER_SIGNALS : [ownerSignal];
    const results: QueryRow[] = [];
    for (const pid of selectedPlatforms) {
      const p = PLATFORMS.find(x => x.id === pid)!;
      for (const ef of emails) {
        for (const os of signals) {
          results.push({ platform: p.label, query: buildQuery(p.site, term, os, ef, location) });
        }
      }
    }
    setQueries(results);
  };

  const generateAllCombos = () => {
    if (!selectedPlatforms.length || !industry || !ownerSignal || !location) {
      toast({ title: 'Missing fields', description: 'Select at least one platform, industry, owner signal, and location.', variant: 'destructive' });
      return;
    }
    const term = INDUSTRIES[industry]?.[0] || industry;
    const signals = ownerSignal === 'All' ? OWNER_SIGNALS : [ownerSignal];
    const results: QueryRow[] = [];
    for (const pid of selectedPlatforms) {
      const p = PLATFORMS.find(x => x.id === pid)!;
      for (const ef of EMAIL_FILTERS) {
        for (const os of signals) {
          results.push({ platform: p.label, query: buildQuery(p.site, term, os, ef, location) });
        }
      }
    }
    setQueries(results);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  };

  const copyAll = () => {
    const text = queries.map(q => q.query).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'All queries copied!' });
  };

  const exportCSV = () => {
    const csv = 'Platform,Query\n' + queries.map(q => `"${q.platform}","${q.query}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadgen-queries.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Platform checkboxes */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Platforms</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {PLATFORMS.map(p => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox id={p.id} checked={selectedPlatforms.includes(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                <Label htmlFor={p.id} className="cursor-pointer">{p.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
          </div>
        </CardContent>
      </Card>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>{Object.keys(INDUSTRIES).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Email Filter</Label>
          <Select value={emailFilter} onValueChange={setEmailFilter}>
            <SelectTrigger><SelectValue placeholder="Select email filter" /></SelectTrigger>
            <SelectContent><SelectItem value="All">All</SelectItem>{EMAIL_FILTERS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Owner Signal</Label>
          <Select value={ownerSignal} onValueChange={setOwnerSignal}>
            <SelectTrigger><SelectValue placeholder="Select signal" /></SelectTrigger>
            <SelectContent><SelectItem value="All">All</SelectItem>{OWNER_SIGNALS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={generate}>Generate Queries</Button>
        <Button variant="secondary" onClick={generateAllCombos}>Generate All Combos</Button>
      </div>

      {/* Results */}
      {queries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Queries ({queries.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}><Copy className="h-4 w-4 mr-1" />Copy All</Button>
                <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{q.platform}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{q.query}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(q.query)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(q.query)}`, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueryGeneratorTab;
