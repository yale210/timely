import { vi, afterEach, expect as vitestExpect } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

// Ensure the DOM is cleaned between tests (Vitest + Testing Library)
afterEach(() => cleanup());

// Some tests import the non-vitest build of jest-dom which expects a global
// `expect` to exist during module evaluation. Ensure it is available.
declare global {
  // Provide the vitest expect globally for modules that expect `expect` during
  // module evaluation (some jest-dom builds do this). Keep the type strict.
  var expect: typeof vitestExpect;
}

// Use nullish coalescing to avoid overriding an existing global expect.
globalThis.expect = globalThis.expect ?? vitestExpect;

interface RechartsProps {
  children?: React.ReactNode;
}

vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  const ResponsiveContainer: React.FC<RechartsProps> = ({ children }) => {
    const maybeChild = React.Children.toArray(children)[0];
    const style = { width: 800, height: 600 };
    if (!React.isValidElement(maybeChild)) return React.createElement("div", { style });
    return React.cloneElement(maybeChild, { ...(maybeChild.props ?? {}), ...style });
  };
  return { ...(original as object), ResponsiveContainer };
});
