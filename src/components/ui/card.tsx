// src/components/ui/card.tsx
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`bg-white rounded shadow ${className}`}>{children}</div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`p-4 border-b ${className}`}>{children}</div>
);
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
export const CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className='' }) => (
  <div className={`font-semibold text-lg ${className}`}>{children}</div>
);
