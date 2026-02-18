import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QueryGeneratorTab from '@/components/leadgen/QueryGeneratorTab';
import LeadExtractorTab from '@/components/leadgen/LeadExtractorTab';

const LeadGen: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">LeadGen Admin</h1>
        <Tabs defaultValue="query-generator">
          <TabsList className="mb-6">
            <TabsTrigger value="query-generator">Search Query Generator</TabsTrigger>
            <TabsTrigger value="lead-extractor">Lead Extractor</TabsTrigger>
          </TabsList>
          <TabsContent value="query-generator">
            <QueryGeneratorTab />
          </TabsContent>
          <TabsContent value="lead-extractor">
            <LeadExtractorTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeadGen;
