// Cart panel — shows current order, qty +/-, totals, and triggers checkout.
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPHP } from "../../shared/utils/currency";
import { variantLabel } from "../../shared/utils/variants";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPanel({ items, onChangeQty, onRemove, onClear, onCheckout }) {
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <Card className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Current Order</h2>
        <span className="text-xs text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Tap a product to add it to the order.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((it) => (
              <li
                key={it.variant_id}
                className="flex items-start gap-2 rounded-md border bg-background p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.product_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {variantLabel(it)} · {formatPHP(it.price)}
                  </p>
                  {it.stock_quantity != null && (
                    <p className="text-[10px] text-muted-foreground">
                      Stock: {it.stock_quantity}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onChangeQty(it.variant_id, it.quantity - 1)}
                    aria-label="Decrease"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={it.stock_quantity != null && it.quantity >= it.stock_quantity}
                    onClick={() => onChangeQty(it.variant_id, it.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(it.variant_id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-20 text-right text-sm font-semibold">
                  {formatPHP(it.price * it.quantity)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t pt-3 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold">{formatPHP(total)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={items.length === 0}
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            className="flex-1"
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            Charge {formatPHP(total)}
          </Button>
        </div>
      </div>
    </Card>
  );
}
