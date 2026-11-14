"use client";

// Screen only (the bar around it is hidden when printing).
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="ui-btn ui-btn-primary">
      Print
    </button>
  );
}
