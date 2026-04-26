// Product editor dialog — create or edit a product, manage its variants.
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsService } from "../../shared/services/products";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import VariantEditorRow from "./VariantEditorRow.jsx";

const EMPTY_VARIANT = { size: "none", price: "", stock_quantity: 0, low_stock_threshold: 10 };

export default function ProductEditorDialog({ open, onOpenChange, product, categories, onSaved }) {
  const isNew = !product?.id;
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [available, setAvailable] = useState(true);
  const [variants, setVariants] = useState([]);
  const [draftVariant, setDraftVariant] = useState(null); // unsaved new variant
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setCategoryId(product?.category_id ? String(product.category_id) : "");
    setDescription(product?.description ?? "");
    setImageUrl(product?.image_url ?? "");
    setAvailable(product ? Boolean(product.is_available) : true);
    setVariants(product?.variants ? [...product.variants] : []);
    setDraftVariant(null);
  }, [open, product]);

  const saveMeta = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!categoryId)  { toast.error("Category is required"); return; }
    setSavingMeta(true);
    try {
      const payload = {
        name: name.trim(),
        category_id: Number(categoryId),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      };
      let res;
      if (isNew) {
        res = await productsService.create({ ...payload, is_available: available ? 1 : 0 });
        toast.success("Product created. You can now add variants.");
        onSaved?.(res.product);
      } else {
        res = await productsService.update(product.id, payload);
        if (Boolean(product.is_available) !== available) {
          await productsService.setAvailability(product.id, available);
        }
        toast.success("Product saved");
        onSaved?.(res.product);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save product");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleVariantSaved = (variant, isCreated) => {
    setVariants((prev) => {
      const i = prev.findIndex((v) => v.id === variant.id);
      if (i >= 0) {
        const next = [...prev]; next[i] = variant; return next;
      }
      return [...prev, variant];
    });
    if (isCreated) setDraftVariant(null);
    onSaved?.(); // refresh parent list
  };
  const handleVariantDeleted = (variantId) => {
    if (variantId == null) { setDraftVariant(null); return; }
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New Product" : `Edit: ${product.name}`}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Save details first, then add at least one variant."
              : "Update product info and manage variants."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea
              id="pdesc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pimg">Image URL (optional)</Label>
            <Input id="pimg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Available for sale</p>
              <p className="text-[11px] text-muted-foreground">
                When off, the product is hidden from the POS.
              </p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveMeta} disabled={savingMeta}>
              {savingMeta ? "Saving…" : isNew ? "Create product" : "Save details"}
            </Button>
          </div>

          {!isNew && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between pt-2">
                <h4 className="font-semibold text-sm">Variants</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDraftVariant({ ...EMPTY_VARIANT })}
                  disabled={Boolean(draftVariant)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add variant
                </Button>
              </div>
              {variants.length === 0 && !draftVariant && (
                <p className="text-xs text-muted-foreground">
                  No variants yet — add one to make this product sellable.
                </p>
              )}
              <div className="space-y-2">
                {variants.map((v) => (
                  <VariantEditorRow
                    key={v.id}
                    productId={product.id}
                    variant={v}
                    onChanged={handleVariantSaved}
                    onDeleted={() => handleVariantDeleted(v.id)}
                  />
                ))}
                {draftVariant && (
                  <VariantEditorRow
                    key="draft"
                    productId={product.id}
                    variant={draftVariant}
                    onChanged={handleVariantSaved}
                    onDeleted={() => handleVariantDeleted(null)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
