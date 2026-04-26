// Date range picker — preset chips + manual from/to inputs.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANGE_PRESETS, presetRange } from "../../shared/utils/dateRange";

export default function DateRangePicker({ value, onChange }) {
  const [preset, setPreset] = useState(value.preset || "7d");

  const setPresetKey = (key) => {
    setPreset(key);
    const r = presetRange(key);
    onChange({ ...r, preset: key });
  };
  const setCustomFrom = (from) => {
    setPreset("custom");
    onChange({ from, to: value.to, preset: "custom" });
  };
  const setCustomTo = (to) => {
    setPreset("custom");
    onChange({ from: value.from, to, preset: "custom" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border bg-background p-0.5">
        {RANGE_PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={preset === p.key ? "default" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => setPresetKey(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={value.from}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => setCustomTo(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
      </div>
    </div>
  );
}
