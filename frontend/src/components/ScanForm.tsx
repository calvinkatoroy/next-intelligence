/**
 * ScanForm Component
 * Form to submit URLs for scanning
 */

import React, { useState } from 'react';
import { apiClient } from '../api/client';
import type { ScanRequest } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface ScanFormProps {
  onScanStarted?: (scanId: string) => void;
}

export const ScanForm: React.FC<ScanFormProps> = ({ onScanStarted }) => {
  const [urlsText, setUrlsText] = useState('');
  const [enableClearnet, setEnableClearnet] = useState(true);
  const [enableDarknet, setEnableDarknet] = useState(false);
  const [crawlAuthors, setCrawlAuthors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScanId, setLastScanId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse URLs from textarea (one per line)
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    // Validate URLs
    const invalidUrls = urls.filter(url => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      toast.error(`Invalid URLs: ${invalidUrls.join(', ')}`);
      return;
    }

    const request: ScanRequest = {
      urls,
      enable_clearnet: enableClearnet,
      enable_darknet: enableDarknet,
      crawl_authors: crawlAuthors,
    };

    setIsSubmitting(true);

    try {
      const response = await apiClient.startScan(request);
      
      setLastScanId(response.scan_id);
      toast.success(`Scan started successfully! ID: ${response.scan_id.substring(0, 8)}...`);
      
      if (onScanStarted) {
        onScanStarted(response.scan_id);
      }

      // Clear form
      setUrlsText('');
      
    } catch (error) {
      toast.error(`Failed to start scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Scan submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start New Scan</CardTitle>
        <CardDescription>
          Enter paste URLs to scan for leaked UI credentials (one per line)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URLs Input */}
          <div className="space-y-2">
            <Label htmlFor="urls">Paste URLs</Label>
            <Textarea
              id="urls"
              placeholder="https://pastebin.com/example&#10;https://paste.ee/p/example&#10;https://ghostbin.com/example"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Scan Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clearnet"
                checked={enableClearnet}
                onCheckedChange={(checked) => setEnableClearnet(checked === true)}
              />
              <Label htmlFor="clearnet" className="text-sm font-normal cursor-pointer">
                Enable clearnet discovery
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="darknet"
                checked={enableDarknet}
                onCheckedChange={(checked) => setEnableDarknet(checked === true)}
              />
              <Label htmlFor="darknet" className="text-sm font-normal cursor-pointer">
                Enable darknet discovery (requires Tor)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="authors"
                checked={crawlAuthors}
                onCheckedChange={(checked) => setCrawlAuthors(checked === true)}
              />
              <Label htmlFor="authors" className="text-sm font-normal cursor-pointer">
                Crawl identified authors' profiles
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Starting Scan...' : 'Start Scan'}
          </Button>

          {/* Last Scan ID */}
          {lastScanId && (
            <div className="mt-4 p-3 bg-secondary rounded-md">
              <p className="text-sm text-muted-foreground">Last Scan ID:</p>
              <p className="text-sm font-mono break-all">{lastScanId}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
