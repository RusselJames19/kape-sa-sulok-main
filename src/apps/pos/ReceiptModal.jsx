// Receipt modal — printable using a print-only stylesheet block.
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPHP } from "../../shared/utils/currency";
import { variantLabel } from "../../shared/utils/variants";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReceiptModal({
  open, onOpenChange, transaction, businessName = "Kape sa Sulok",
  businessAddress = "", footer = "Salamat sa pag-suporta!",
}) {
  if (!transaction) return null;
  const items = transaction.items || [];

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:max-w-none print:shadow-none print:border-0">
        <DialogHeader className="print:hidden">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div id="ksu-receipt" className="font-mono text-[12px] leading-tight space-y-2">
          <div className="text-center">
            <p className="text-base font-bold">{businessName}</p>
            {businessAddress && <p>{businessAddress}</p>}
            <p className="text-[11px] opacity-70">
              Receipt #{transaction.id} · {formatDateTime(transaction.created_at)}
            </p>
            <p className="text-[11px] opacity-70">
              Cashier: {transaction.cashier_name}
            </p>
          </div>
          <div className="border-t border-dashed" />
          <div>
            {items.map((it) => (
              <div key={it.id} className="flex justify-between gap-2">
                <div className="flex-1">
                  <p>{it.product_name} <span className="opacity-70">({variantLabel(it)})</span></p>
                  <p className="opacity-70">
                    {it.quantity} × {formatPHP(it.unit_price_at_sale)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatPHP(it.unit_price_at_sale * it.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed" />
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatPHP(transaction.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tendered</span>
            <span>{formatPHP(transaction.amount_tendered)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatPHP(transaction.change_given)}</span>
          </div>
          <div className="border-t border-dashed" />
          <p className="text-center text-[11px] opacity-80">{footer}</p>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>Print</Button>
        </DialogFooter>

        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #ksu-receipt, #ksu-receipt * { visibility: visible !important; }
            #ksu-receipt { position: fixed; inset: 0; padding: 12mm; color: #000; background: #fff; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
