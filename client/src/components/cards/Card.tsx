import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

type CardProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  statusBadge?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  layoutId?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
};

export function Card({
  title, subtitle, icon, statusBadge, actions, children, footer,
  layoutId, onClick, interactive = true, className = ""
}: CardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onClick={onClick}
      className={[
        "rounded-2xl border bg-white shadow-sm",
        "hover:shadow-md focus:outline-none",
        interactive ? "cursor-pointer" : "cursor-default",
        className
      ].join(" ")}
    >
      <div className="flex items-start gap-3 p-4">
        {icon && <div className="mt-0.5 text-xl">{icon}</div>}
        <div className="min-w-0 flex-1">
          {title && <div className="truncate text-base font-semibold">{title}</div>}
          {(subtitle || statusBadge) && (
            <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
              {subtitle && <span className="truncate">{subtitle}</span>}
              {statusBadge && <span className="rounded-full border px-2 py-0.5">{statusBadge}</span>}
            </div>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
      {footer && <div className="border-t px-4 py-3">{footer}</div>}
    </motion.div>
  );
}

export function ModalShell({
  open, onClose, children, layoutId
}: { open: boolean; onClose: () => void; children: React.ReactNode; layoutId?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            layoutId={layoutId}
            className="w-full max-w-2xl rounded-2xl border bg-white shadow-2xl"
          >
            {children}
          </motion.div>
          <button className="absolute inset-0 -z-10" onClick={onClose} aria-label="Close" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
