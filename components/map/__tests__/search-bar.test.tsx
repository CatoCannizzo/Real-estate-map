import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/search-bar";

//Component test
describe("SearchBar", () => {
  //Render test
  it("Initial Render - with placeholder and no clear button", () => {
    render(<SearchBar placeholder="Search properties..." />);
    const input = screen.getByPlaceholderText("Search properties...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });
  it("updates input value and triggers onChange when user types and clear button to appear", async () => {
    // Setup user event and a vi.fn() spy
    const user = userEvent.setup();
    const handleChange = vi.fn();
    // Render SearchBar with onChange
    render(<SearchBar onChange={handleChange} />);
    // Grab input by role
    const input = screen.getByRole("combobox");
    // Simulate user typing
    await user.type(input, "123 Main St");
    // Assert
    expect(input).toHaveValue("123 Main St");
    expect(handleChange).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).toBeInTheDocument();
  });
});
