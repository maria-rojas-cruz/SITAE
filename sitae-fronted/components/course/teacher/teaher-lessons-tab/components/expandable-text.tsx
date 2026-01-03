"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 150 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <span className="text-slate-700">{text}</span>;
  }

  return (
    <span className="text-slate-700">
      {isExpanded ? text : `${text.substring(0, maxLength)}... `}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-primary hover:underline font-medium ml-1 text-sm"
      >
        {isExpanded ? "leer menos" : "leer más"}
      </button>
    </span>
  );
}