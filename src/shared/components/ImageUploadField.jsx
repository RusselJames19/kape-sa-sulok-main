// Reusable image upload field. Uploads immediately to /upload/image,
// shows a thumbnail of the resulting URL, and writes the URL back via
// onChange. Includes a "Use URL instead" toggle to fall back to a plain
// text input for external URLs.
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadsService } from "../services/uploads";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

function validate(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
    return "Only JPG, JPEG, PNG, and WEBP images are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "File exceeds the maximum allowed size of 2MB.";
  }
  return null;
}

export default function ImageUploadField({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      const res = await uploadsService.uploadImage(file);
      if (res?.url) {
        onChange?.(res.url);
        toast.success("Image uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPick = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  const hasImage = Boolean(value);

  return (
    <div className="space-y-2">
      {!useUrl && (
        <>
          {hasImage ? (
            <div className="flex items-center gap-3 rounded-md border p-2">
              <img
                src={value}
                alt="Product"
                className="h-16 w-16 rounded object-cover border"
                onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Uploading…</>
                ) : (
                  "Change Image"
                )}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={[
                "w-full rounded-md border-2 border-dashed p-6 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/50",
                (disabled || uploading) ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading…
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-5 w-5" />
                    <Upload className="h-4 w-4" />
                  </div>
                  <span>Click to upload or drag and drop</span>
                  <span className="text-[11px]">JPG, PNG, WEBP — max 2MB</span>
                </div>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={onPick}
            disabled={disabled || uploading}
          />
        </>
      )}

      {useUrl && (
        <Input
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="https://..."
          disabled={disabled}
        />
      )}

      <button
        type="button"
        className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        onClick={() => setUseUrl((v) => !v)}
      >
        {useUrl ? "Upload a file instead" : "Use URL instead"}
      </button>
    </div>
  );
}
