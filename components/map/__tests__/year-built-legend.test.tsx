import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YearBuiltLegend } from "@/components/map/year-built-legend";

describe("YearBuiltLegend", () => {
  it("renders 'Off' button and hides color scale details when active is false", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(<YearBuiltLegend active={false} onToggle={handleToggle} />);

    expect(screen.getByText("Year Built Choropleth")).toBeInTheDocument();
    const toggleBtn = screen.getByRole("button", { name: "Off" });
    expect(toggleBtn).toBeInTheDocument();

    // Scale details and swatches are hidden when inactive
    expect(screen.queryByText("≤ 1900")).not.toBeInTheDocument();
    expect(screen.queryByText("2025+")).not.toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();

    await user.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it("renders 'Active' button, color scale thresholds, and swatches when active is true", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(<YearBuiltLegend active={true} onToggle={handleToggle} />);

    const toggleBtn = screen.getByRole("button", { name: "Active" });
    expect(toggleBtn).toBeInTheDocument();

    expect(screen.getByText("≤ 1900")).toBeInTheDocument();
    expect(screen.getByText("1960")).toBeInTheDocument();
    expect(screen.getByText("2025+")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(false);
  });
});
