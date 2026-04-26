import { useEffect, useState } from "react";
import { getApiBaseUrl, setApiBaseUrl, pingServer } from "../../shared/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ConnectionPanel() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState({ state: "idle" }); // 'idle' | 'pinging' | 'ok' | 'fail'

  useEffect(() => { setUrl(getApiBaseUrl()); }, []);

  const save = () => {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) {
      toast.error("URL cannot be empty");
      return;
    }
    setApiBaseUrl(trimmed);
    setUrl(trimmed);
    toast.success("API base URL saved");
  };

  const test = async () => {
    setStatus({ state: "pinging" });
    const res = await pingServer();
    if (res.ok) {
      setStatus({ state: "ok", latency: res.latencyMs, data: res.data });
      toast.success(`Connected (${res.latencyMs}ms)`);
    } else {
      setStatus({ state: "fail", error: res.error });
      toast.error(`Cannot reach server: ${res.error}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API connection</CardTitle>
        <CardDescription>
          Point the app at your PHP backend (e.g. <code>http://localhost/kape-sa-sulok/api</code>).
          The setting is stored in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-url">API base URL</Label>
          <div className="flex gap-2">
            <Input
              id="api-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost/api"
            />
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={test} disabled={status.state === "pinging"}>
              {status.state === "pinging" ? "Testing…" : "Test"}
            </Button>
          </div>
        </div>

        <StatusBadge status={status} />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  if (status.state === "idle") {
    return <p className="text-sm text-muted-foreground">Click <strong>Test</strong> to verify the connection.</p>;
  }
  if (status.state === "pinging") {
    return <p className="text-sm text-muted-foreground">Pinging server…</p>;
  }
  if (status.state === "ok") {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
        ✓ Server reachable — {status.latency} ms
        {status.data?.version && <span className="ml-2 opacity-70">v{status.data.version}</span>}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      ✗ {status.error}
    </div>
  );
}
