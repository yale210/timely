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
  const ResponsiveContainer: React.FC<RechartsProps> = ({ children }) =>
    React.createElement("div", { className: "recharts-responsive-container" }, children);
  const SvgChart: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
    React.createElement("svg", null, children);
  const Group: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
    React.createElement("g", null, children);
  const NullComp: React.FC = () => null;
  const Bar: React.FC = () => React.createElement("rect");
  return {
    ...(original as object),
    ResponsiveContainer,
    PieChart: SvgChart,
    BarChart: SvgChart,
    Pie: Group,
    Cell: NullComp,
    XAxis: NullComp,
    YAxis: NullComp,
    Tooltip: NullComp,
    Legend: NullComp,
    CartesianGrid: NullComp,
    Bar,
  };
});
