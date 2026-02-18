import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScrapeTab from './ScrapeTab';
import SearchTab from './SearchTab';
import MapTab from './MapTab';
import CrawlTab from './CrawlTab';
import InfoTip from './InfoTip';

const LeadExtractorTab: React.FC = () => {
  return (
    <Tabs defaultValue="search">
      <TabsList>
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="scrape">Scrape</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="crawl">Crawl</TabsTrigger>
      </TabsList>
      <p className="text-sm text-muted-foreground mt-2 mb-4">
        Use <strong>Search</strong> as your main lead tool — paste a query from the Query Generator to extract leads automatically.
      </p>
      <TabsContent value="search"><SearchTab /></TabsContent>
      <TabsContent value="scrape"><ScrapeTab /></TabsContent>
      <TabsContent value="map"><MapTab /></TabsContent>
      <TabsContent value="crawl"><CrawlTab /></TabsContent>
    </Tabs>
  );
};

export default LeadExtractorTab;
