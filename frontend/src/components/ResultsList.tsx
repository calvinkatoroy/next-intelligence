/**
 * ResultsList Component
 * Display scan results in a table or card grid
 */

import React, { useState } from 'react';
import type { ScanResult } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ResultsListProps {
  results: ScanResult[];
  isLoading?: boolean;
}

export const ResultsList: React.FC<ResultsListProps> = ({ results, isLoading }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (url: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(url)) {
      newExpanded.delete(url);
    } else {
      newExpanded.add(url);
    }
    setExpandedRows(newExpanded);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return 'text-red-500 bg-red-500/10';
    if (score >= 0.5) return 'text-orange-500 bg-orange-500/10';
    return 'text-yellow-500 bg-yellow-500/10';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  // Sort by relevance score descending
  const sortedResults = [...results].sort((a, b) => b.relevance_score - a.relevance_score);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan Results</CardTitle>
          <CardDescription>Loading results...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan Results</CardTitle>
          <CardDescription>No results yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Start a scan to see results here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Results</CardTitle>
        <CardDescription>
          Found {results.length} relevant item{results.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead className="text-center">Emails</TableHead>
                <TableHead className="text-center">Credentials</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => {
                const isExpanded = expandedRows.has(result.url);
                
                return (
                  <React.Fragment key={result.url}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(result.url)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {result.source}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{result.author}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getScoreColor(result.relevance_score)}
                        >
                          {getScoreLabel(result.relevance_score)} ({result.relevance_score.toFixed(2)})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {result.target_emails.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.has_credentials ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="py-4 space-y-4">
                            {/* Title */}
                            {result.title && result.title !== 'Unknown' && (
                              <div>
                                <p className="text-sm font-semibold mb-1">Title:</p>
                                <p className="text-sm text-muted-foreground">{result.title}</p>
                              </div>
                            )}
                            
                            {/* Target Emails */}
                            {result.target_emails.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold mb-2">
                                  Target Domain Emails ({result.target_emails.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {result.target_emails.map((email) => (
                                    <Badge key={email} variant="destructive">
                                      {email}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* All Emails */}
                            {result.emails.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold mb-2">
                                  All Emails ({result.emails.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {result.emails.slice(0, 20).map((email) => (
                                    <Badge key={email} variant="outline">
                                      {email}
                                    </Badge>
                                  ))}
                                  {result.emails.length > 20 && (
                                    <Badge variant="outline">
                                      +{result.emails.length - 20} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Content Preview */}
                            {result.content_preview && (
                              <div>
                                <p className="text-sm font-semibold mb-2">Content Preview:</p>
                                <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto border">
                                  {result.content_preview}
                                </pre>
                              </div>
                            )}
                            
                            {/* Timestamp */}
                            <div className="text-xs text-muted-foreground">
                              Discovered: {new Date(result.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
