import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScrapeTab from './ScrapeTab';
import SearchTab from './SearchTab';
import MapTab from './MapTab';
import CrawlTab from './CrawlTab';

const LeadExtractorTab: React.FC = () => {
  return (
    <Tabs defaultValue="scrape">
      <TabsList>
        <TabsTrigger value="scrape">Scrape</TabsTrigger>
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="crawl">Crawl</TabsTrigger>
      </TabsList>
      <TabsContent value="scrape"><ScrapeTab /></TabsContent>
      <TabsContent value="search"><SearchTab /></TabsContent>
      <TabsContent value="map"><MapTab /></TabsContent>
      <TabsContent value="crawl"><CrawlTab /></TabsContent>
    </Tabs>
  );
};

export default LeadExtractorTab;
