/**
 * ResultsList Component
 * Display scan results in a table or card grid
 */

import React, { useState } from 'react';
import type { ScanResult } from '../types';
import { GlassCard } from './GlassCard';
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
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle2, Database } from 'lucide-react';

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
    if (score >= 0.7) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score >= 0.5) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
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
      <GlassCard glow>
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-neon-cyan" />
          <h2 className="text-xl font-bold">Scan Results</h2>
        </div>
        <p className="text-sm text-muted-foreground font-mono mb-6">Loading results...</p>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
        </div>
      </GlassCard>
    );
  }

  if (results.length === 0) {
    return (
      <GlassCard glow>
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-neon-cyan" />
          <h2 className="text-xl font-bold">Scan Results</h2>
        </div>
        <p className="text-sm text-muted-foreground font-mono mb-6">No results yet</p>
        <p className="text-sm text-muted-foreground text-center py-8">
          Start a scan to see results here
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard glow>
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-neon-cyan" />
        <h2 className="text-xl font-bold">Scan Results</h2>
      </div>
      <p className="text-sm text-muted-foreground font-mono mb-6">
        Found {results.length} relevant item{results.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/[0.02]">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-muted-foreground">URL</TableHead>
              <TableHead className="text-muted-foreground">Author</TableHead>
              <TableHead className="text-muted-foreground">Relevance</TableHead>
              <TableHead className="text-center text-muted-foreground">Emails</TableHead>
              <TableHead className="text-center text-muted-foreground">Credentials</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((result) => {
              const isExpanded = expandedRows.has(result.url);
              
              return (
                <React.Fragment key={result.url}>
                  <TableRow className="cursor-pointer hover:bg-white/[0.02] border-white/10">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(result.url)}
                        className="h-8 w-8 p-0 hover:bg-white/10"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-neon-cyan" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neon-cyan hover:text-neon-green transition-colors inline-flex items-center gap-1 font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {result.source}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{result.author}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getScoreColor(result.relevance_score)} font-mono`}
                      >
                        {getScoreLabel(result.relevance_score)} ({result.relevance_score.toFixed(2)})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-white/5 border-white/10 font-mono">
                        {result.target_emails.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {result.has_credentials ? (
                        <AlertTriangle className="h-5 w-5 text-red-400 mx-auto" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="bg-white/[0.01]">
                        <div className="py-4 space-y-4">
                          {/* Title */}
                          {result.title && result.title !== 'Unknown' && (
                            <div>
                              <p className="text-sm font-semibold mb-1 text-neon-cyan">Title:</p>
                              <p className="text-sm text-muted-foreground font-mono">{result.title}</p>
                            </div>
                          )}
                          
                          {/* Target Emails */}
                          {result.target_emails.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-neon-cyan">
                                Target Domain Emails ({result.target_emails.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {result.target_emails.map((email) => (
                                  <Badge key={email} className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                                    {email}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* All Emails */}
                          {result.emails.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-neon-cyan">
                                All Emails ({result.emails.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {result.emails.slice(0, 20).map((email) => (
                                  <Badge key={email} variant="outline" className="border-white/20 font-mono">
                                    {email}
                                  </Badge>
                                ))}
                                {result.emails.length > 20 && (
                                  <Badge variant="outline" className="border-white/20 font-mono">
                                    +{result.emails.length - 20} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Content Preview */}
                          {result.content_preview && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-neon-cyan">Content Preview:</p>
                              <pre className="text-xs glass p-3 rounded-md overflow-x-auto border border-white/20 font-mono">
{result.content_preview}
                              </pre>
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <div className="text-xs text-muted-foreground font-mono">
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
    </GlassCard>
  );
};
