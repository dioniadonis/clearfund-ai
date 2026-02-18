import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type Lead = {
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  source_url: string | null;
};

interface LeadsTableProps {
  leads: Lead[];
  title?: string;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, title = 'Extracted Leads' }) => {
  const { toast } = useToast();

  if (!leads.length) return null;

  const exportCSV = () => {
    const headers = ['Business Name', 'Owner Name', 'Email', 'Phone', 'Address', 'Source URL'];
    const rows = leads.map(l => [l.business_name, l.owner_name, l.email, l.phone, l.address, l.source_url].map(v => `"${(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(leads, null, 2));
    toast({ title: 'Copied leads to clipboard!' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title} ({leads.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyAll}><Copy className="h-4 w-4 mr-1" />Copy JSON</Button>
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{lead.business_name ?? '—'}</TableCell>
                  <TableCell>{lead.owner_name ?? '—'}</TableCell>
                  <TableCell className="text-xs">{lead.email ?? '—'}</TableCell>
                  <TableCell className="text-xs">{lead.phone ?? '—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{lead.address ?? '—'}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">
                    {lead.source_url ? <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{new URL(lead.source_url).hostname}</a> : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsTable;
