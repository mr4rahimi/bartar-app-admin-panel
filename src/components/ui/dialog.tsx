// src/components/ui/dialog.tsx
import React from 'react';

type DialogProps = {
  open?: boolean;
  onOpenChange?: (v:boolean) => void;
  children?: React.ReactNode;
};

export const Dialog: React.FC<DialogProps> = ({ children }) => {
  // wrapper; real dialog controls handled by DialogTrigger/DialogContent in page
  return <div>{children}</div>;
};

export const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`bg-white p-4 rounded shadow ${className}`}>{children}</div>
);

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`mb-2 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);
