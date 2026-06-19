/**
 * `Modal` — a controlled centered dialog for progressive disclosure (the web
 * equivalent of the PDF's bottom sheets: "자세히 보기" / 시나리오 / 비교). Thin
 * wrapper over the existing Radix `dialog` primitives so every lane gets one
 * consistent overlay + rounded card + close affordance without re-wiring Radix.
 *
 * Controlled only: the parent owns `open` / `onOpenChange`. Title is required
 * for accessibility (rendered as the dialog title; pass a node, or set
 * `hideTitle` to keep it screen-reader-only). Optional `description` and
 * `footer` slots.
 */

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { cn } from "../../lib/cn";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Keep the title for screen readers only. */
  hideTitle?: boolean;
  description?: ReactNode;
  /** Footer actions (buttons). */
  footer?: ReactNode;
  /** Max content width in px (default 480 via the dialog primitive). */
  className?: string;
  children?: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  footer,
  className,
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-5", className)}>
        <DialogHeader className={cn(hideTitle && "sr-only")}>
          <DialogTitle className="text-[20px]">{title}</DialogTitle>
          {description != null && (
            <DialogDescription className="text-[15px]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children != null && (
          <div className="text-[15px] leading-relaxed text-neutral-700">
            {children}
          </div>
        )}

        {footer != null && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
