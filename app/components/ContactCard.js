"use client";

import { useState } from "react";

const EMAIL = "CS123452023@outlook.com";

export default function ContactCard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  }

  return (
    <div className="mt-12 text-center">
      <p className="mb-3 text-sm font-medium text-muted">Contact</p>
      <button
        onClick={handleCopy}
        className="interactive inline-flex items-center justify-center rounded-full bg-accent/10 p-3 text-accent transition hover:bg-accent/20"
        title={copied ? "Copied!" : "Copy email"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 4-10 8L2 4" />
        </svg>
      </button>
      {copied && (
        <p className="mt-2 text-xs text-accent animate-in fade-in">
          Copied!
        </p>
      )}
    </div>
  );
}
