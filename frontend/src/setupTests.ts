import { vi, afterEach, expect as vitestExpect } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

// Ensure the DOM is cleaned between tests (Vitest + Testing Library)
afterEach(() => cleanup());

// Some tests import the non-vitest build of jest-dom which expects a global
// `expect` to exist during module evaluation. Ensure it is available.
(globalThis as any).expect = (globalThis as any).expect ?? vitestExpect;

vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  const ResponsiveContainer = (props: { children?: React.ReactNode }) => {
    // Clone the single child and inject width/height so Recharts renders in jsdom
    const child = props.children as React.ReactElement | undefined;
  if (!child) return React.createElement("div", { style: { width: 800, height: 600 } });
  return React.cloneElement(child as any, { ...(child.props || {}), width: 800, height: 600 } as any);
  };
  return Object.assign({}, original as object, { ResponsiveContainer });
});
