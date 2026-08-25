"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { Badge } from "@repo/ui/components/badge";
import { Field } from "@/components/shared/form-field";
import { getErrorMessage } from "@/components/shared/error-message";
import type { PreviewResponse, TemplateResponse } from "@/core/api/types";
import { usePreviewTemplate } from "@/features/templates/hooks";

export function TemplatePreviewDialog({
  template,
  onOpenChange,
}: {
  template: TemplateResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const preview = usePreviewTemplate();
  const [json, setJson] = useState("{}");
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<PreviewResponse | undefined>();

  // Seed the variables box with the template's required vars when it opens.
  useEffect(() => {
    if (!template) return;
    const seed: Record<string, string> = {};
    for (const v of template.requiredVars) seed[v] = "";
    setJson(JSON.stringify(seed, null, 2) || "{}");
    setResult(undefined);
    setError(undefined);
  }, [template]);

  async function run() {
    if (!template) return;
    let variables: Record<string, string>;
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      variables = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
    } catch {
      setError("Variables must be a valid JSON object.");
      return;
    }
    setError(undefined);
    try {
      const res = await preview.mutateAsync({ id: template.id, body: { variables } });
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Dialog open={Boolean(template)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview · {template?.code}</DialogTitle>
          <DialogDescription>Render the template with sample variables without sending.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Variables (JSON)" htmlFor="preview-vars" error={error}>
            <Textarea
              id="preview-vars"
              rows={4}
              className="font-mono text-xs"
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
          </Field>

          {result ? (
            <div className="space-y-3 rounded-lg border bg-secondary/40 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium text-foreground">{result.subject || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Body</p>
                <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-card p-2 text-xs text-foreground">
                  {result.body}
                </pre>
              </div>
              {result.missingVariables.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Missing:</span>
                  {result.missingVariables.map((v) => (
                    <Badge key={v} variant="warning">
                      {v}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="success">All variables provided</Badge>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={run} disabled={preview.isPending}>
            {preview.isPending ? "Rendering…" : "Render preview"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
