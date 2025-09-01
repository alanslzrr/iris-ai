"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SimpleMarkdown } from './SimpleMarkdown';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface RecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certNo: string;
  initialPrompt: string;
  onSave: (payload: { clientFeedback: string; revisionComment: string; justificationComment?: string; aiAnalysis?: string }) => Promise<void>;
}

export function RecommendationModal({ open, onOpenChange, certNo, initialPrompt, onSave }: RecommendationModalProps) {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [promptText, setPromptText] = useState<string>(initialPrompt);
  const [variablesText, setVariablesText] = useState<string>('');
  const [sanitizedContext, setSanitizedContext] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showInstructionEditor, setShowInstructionEditor] = useState<boolean>(false);
  const [instructionDraft, setInstructionDraft] = useState<string>('');
  const [revisionComment, setRevisionComment] = useState<string>('');
  const [justificationComment, setJustificationComment] = useState<string>('');
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');

  const normalizeNewlines = (s: string) => s.replace(/\r\n?/g, '\n');

  // Remove binary-like fields from JSON (e.g., base64/pdf payloads)
  const sanitizeForPrompt = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(sanitizeForPrompt);
    }
    if (input && typeof input === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
        const keyLower = k.toLowerCase();
        if (typeof v === 'string') {
          const isLarge = v.length > 5000;
          const looksBinary = /base64|pdf|image|binary/.test(keyLower);
          if (looksBinary || isLarge) {
            continue;
          }
        }
        out[k] = sanitizeForPrompt(v);
      }
      return out;
    }
    return input;
  };

  const CONTEXT_LABEL = 'Context (evaluation json_data without binary - use this data to generate personalized feedback):';
  const VARIABLES_LABEL = 'Variables:';
  const stripContext = (text: string): string => {
    if (!text) return text;
    const iVars = text.indexOf(VARIABLES_LABEL);
    const iCtx = text.indexOf(CONTEXT_LABEL);
    let cut = -1;
    if (iVars !== -1 && iCtx !== -1) cut = Math.min(iVars, iCtx);
    else if (iVars !== -1) cut = iVars;
    else if (iCtx !== -1) cut = iCtx;
    if (cut === -1) return text.trimEnd();
    return text.slice(0, cut).trimEnd();
  };

  // Centralized starter for streaming with a specific prompt
  const startStreaming = async (prompt: string) => {
    abortRef.current?.abort();
    setStreamingText('');
    setError(null);
    setIsStreaming(true);
    setIsEditing(false);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/validation/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to start recommendation stream');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // When using AI SDK toTextStreamResponse, the body is plain text stream.
        // Append directly; also support legacy JSON/SSE lines if present.
        if (chunk.trim().length > 0) {
          const lines = chunk.split('\n');
          let appendedRaw = false;
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const dataPrefix = 'data:';
            const payload = line.startsWith(dataPrefix) ? line.slice(dataPrefix.length).trim() : line;
            try {
              const evt = JSON.parse(payload);
              const outputText: string | undefined = (evt as any)?.output_text;
              if (typeof outputText === 'string' && outputText.length > 0) {
                accumulated = outputText;
                setStreamingText(accumulated);
                continue;
              }
              if (evt?.type === 'response.output_text.delta' && typeof evt?.delta === 'string') {
                accumulated += evt.delta;
                setStreamingText(accumulated);
                continue;
              }
              if (evt?.type === 'text-delta' && typeof evt?.delta === 'string') {
                accumulated += evt.delta;
                setStreamingText(accumulated);
                continue;
              }
            } catch {
              // Not JSON; treat as raw text
              accumulated += rawLine;
              appendedRaw = true;
            }
          }
          if (appendedRaw) setStreamingText(accumulated);
        }
      }
      // On graceful end, set final editable text
      setEditableText(normalizeNewlines(accumulated || streamingText));
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Streaming error');
    } finally {
      setIsStreaming(false);
      setIsEditing(false);
    }
  };

  // Compose final prompt to send (instruction + variables + context)
  const composePrompt = (base: string, vars: string, ctx: string): string => {
    const parts: string[] = [stripContext(base)];
    if (vars && vars.trim().length > 0) parts.push(vars);
    if (ctx && ctx.trim().length > 0) parts.push(`${CONTEXT_LABEL}\n${ctx}`);
    return parts.join('\n\n');
  };

  // Kick off streaming when opened
  useEffect(() => {
    if (!open) return;
    setEditableText('');
    const prepare = async () => {
      try {
        const resp = await fetch(`/api/certificates/${encodeURIComponent(certNo)}/report`);
        const data = await resp.json();
        // Always start from the provided initial prompt when opening
        const base = stripContext(initialPrompt);
        // Build variables block from certificate_info
        const info = data?.certificate_info || {};
        const skipVals = new Set(['UNKNOWN', 'NMN']);
        const clean = (v: unknown) => {
          const s = String(v ?? '').trim();
          if (!s) return '';
          const upper = s.toUpperCase();
          if (skipVals.has(upper)) return '';
          return s;
        };
        const kv: string[] = [];
        const vCert = clean(info.cert_no);
        if (vCert) kv.push(`cert_no: ${vCert}`);
        const vMan = clean(info.manufacturer);
        if (vMan) kv.push(`manufacturer: ${vMan}`);
        const vModel = clean(info.model);
        if (vModel) kv.push(`model: ${vModel}`);
        const vType = clean(info.equipment_type);
        if (vType) kv.push(`equipment_type: ${vType}`);
        const vCustomer = clean(info.customer_name);
        if (vCustomer) kv.push(`customer_name: ${vCustomer}`);
        const variablesBlock = kv.length ? `${VARIABLES_LABEL}\n${kv.join('\n')}` : '';
        if (resp.ok && data?.json_data) {
          const sanitized = sanitizeForPrompt(data.json_data);
          const ctx = JSON.stringify(sanitized, null, 2);
          setVariablesText(variablesBlock);
          setSanitizedContext(ctx);
          setPromptText(base);
          const composed = composePrompt(base, variablesBlock, ctx);
          await startStreaming(composed);
          // Prefill AIAnalysis from evaluation json_data if available
          try {
            const ai = data?.json_data?.openai_analysis;
            const analysis = (typeof ai?.analysis === 'string' && ai.analysis) || (typeof ai?.summary === 'string' && ai.summary) || '';
            if (analysis) setAiAnalysisText(analysis);
          } catch {}
          return;
        }
        throw new Error('Missing evaluation json_data');
      } catch (e) {
        setError('Failed to load certificate context');
        setIsStreaming(false);
      }
    };
    prepare();
    return () => {
      abortRef.current?.abort();
    };
  }, [open, initialPrompt, certNo]);

  const canSave = useMemo(() => !isStreaming && (editableText?.trim().length ?? 0) > 0, [isStreaming, editableText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-5xl lg:max-w-6xl p-0 bg-transparent relative">
        <VisuallyHidden>
          <DialogTitle>AI Recommendation for {certNo}</DialogTitle>
        </VisuallyHidden>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute right-[-15%] top-[-15%] h-[40rem] w-[40rem] rounded-full bg-destructive/25 blur-3xl dark:bg-destructive/30" />
          <div className="absolute left-[-20%] bottom-[-20%] h-[32rem] w-[32rem] rounded-full bg-destructive/10 blur-3xl dark:bg-destructive/20" />
        </div>
        <Card className="max-h-[90vh] bg-card text-card-foreground flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>Approval for {certNo}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-3 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm font-medium mb-2">Phoenix Endpoint — fields to be sent</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium mb-1">Revision comment (required)</div>
                  <textarea className="w-full text-sm rounded-md border bg-background p-2"
                    rows={2}
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    placeholder="Enter the revision comment..." />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">Justification comment (optional)</div>
                  <textarea className="w-full text-sm rounded-md border bg-background p-2"
                    rows={2}
                    value={justificationComment}
                    onChange={(e) => setJustificationComment(e.target.value)}
                    placeholder="Enter the justification (optional)..." />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs font-medium mb-1">AIAnalysis (prefilled from evaluation)</div>
                <textarea className="w-full text-sm rounded-md border bg-background p-2"
                  rows={4}
                  value={aiAnalysisText}
                  onChange={(e) => setAiAnalysisText(e.target.value)}
                  placeholder="AI analysis used for Phoenix approval (editable)" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">Supabase client feedback (not sent to Phoenix)</div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (isEditing && (editableText?.trim().length ?? 0) > 0) {
                        const proceed = window.confirm('Regenerate will discard current edits. Continue?');
                        if (!proceed) return;
                      }
                      if (!sanitizedContext) {
                        const resp = await fetch(`/api/certificates/${encodeURIComponent(certNo)}/report`);
                        const data = await resp.json();
                        if (!resp.ok || !data?.json_data) throw new Error('Missing evaluation json_data');
                        const sanitized = sanitizeForPrompt(data.json_data);
                        const ctx = JSON.stringify(sanitized, null, 2);
                        setSanitizedContext(ctx);
                      }
                      const composed = composePrompt(promptText || initialPrompt, variablesText, sanitizedContext);
                      await startStreaming(composed);
                    } catch (err) {
                      setError('Failed to load certificate context');
                    }
                  }}
                  disabled={isStreaming}
                >
                  {isStreaming ? 'Generating…' : 'Regenerate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInstructionDraft(promptText);
                    setShowInstructionEditor(true);
                  }}
                >
                  See Instructions
                </Button>
              </div>
            </div>
            {sanitizedContext && (
              <div className="mt-3">
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground transition-colors">View Context (json_data) — read-only</summary>
                  <div className="mt-2 rounded-lg border p-4 bg-muted/30">
                    {variablesText && (
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-1">Variables</div>
                        <pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded-md border">{variablesText.replace(/^Variables:\n?/, '')}</pre>
                      </div>
                    )}
                    <div className="text-xs font-medium mb-1">json_data (sanitized)</div>
                    <pre className="text-xs overflow-auto max-h-56 whitespace-pre bg-background p-3 rounded-md border">
{sanitizedContext}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
          <CardContent className="pb-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Client Feedback (Supabase only) {isStreaming && (
                <span className="ml-2 text-xs text-muted-foreground">(streaming...)</span>
              )}</div>
              <div className="flex items-center gap-3">
                {!isStreaming && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing((v) => !v)}>
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-4 flex-1 overflow-auto text-sm bg-muted/30">
              {error ? (
                <div className="text-destructive">{error}</div>
              ) : isStreaming ? (
                <SimpleMarkdown className="rv-typography">
                  {streamingText || 'Starting AI recommendation...'}
                </SimpleMarkdown>
              ) : isEditing ? (
                <Textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder="Edit or refine the feedback here before saving..."
                  className="w-full h-full min-h-[24rem] resize-y whitespace-pre-wrap font-mono rounded-md"
                />
              ) : (
                <SimpleMarkdown className="rv-typography">
                  {editableText || streamingText}
                </SimpleMarkdown>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3 border-t bg-card/60">
            <Button variant="outline" size="sm" onClick={() => { abortRef.current?.abort(); onOpenChange(false); }} disabled={isStreaming && !streamingText}>Cancel</Button>
            <Button size="lg" variant="default" onClick={async () => {
              if (!revisionComment.trim()) {
                alert('Revision comment is required');
                return;
              }
              await onSave({
                clientFeedback: (editableText || streamingText || '').trim(),
                revisionComment: revisionComment.trim(),
                justificationComment: justificationComment.trim() || undefined,
                aiAnalysis: aiAnalysisText.trim() || undefined,
              });
              onOpenChange(false);
            }} disabled={!canSave}>
              Approve and Save Feedback
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>

      {/* Large Instruction Editor Dialog */}
      <Dialog open={showInstructionEditor} onOpenChange={setShowInstructionEditor}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-5xl lg:max-w-6xl p-0 bg-transparent relative">
          <VisuallyHidden>
            <DialogTitle>Edit Instructions</DialogTitle>
          </VisuallyHidden>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute right-[-20%] top-[-20%] h-[36rem] w-[36rem] rounded-full bg-destructive/25 blur-3xl dark:bg-destructive/30" />
            <div className="absolute left-[-15%] bottom-[-25%] h-[28rem] w-[28rem] rounded-full bg-destructive/10 blur-3xl dark:bg-destructive/20" />
          </div>
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Edit Instructions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh]">
              <Textarea
                value={instructionDraft}
                onChange={(e) => setInstructionDraft(e.target.value)}
                className="w-full h-[60vh] resize-none whitespace-pre-wrap rounded-md"
                placeholder="Edit the generation prompt..."
              />
            </CardContent>
            <CardFooter className="justify-end gap-3 border-t">
              <Button variant="outline" onClick={() => setShowInstructionEditor(false)}>Cancel</Button>
              <Button size="lg" variant="default"
                onClick={() => {
                  setPromptText(instructionDraft);
                  setShowInstructionEditor(false);
                }}
              >
                Apply
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


