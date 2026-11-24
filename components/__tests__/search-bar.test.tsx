import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/search-bar";
import type { AddressSearchItem } from "@/lib/graphql/queries";

const SAMPLE_ITEMS: AddressSearchItem[] = [
  {
    parcel_id: "101",
    address_line1: "500 5th Ave",
    lat: 40.75,
    lon: -73.98,
  },
  {
    parcel_id: "102",
    address_line1: "350 5th Ave",
    lat: 40.7484,
    lon: -73.9857,
  },
];

describe("SearchBar", () => {
  it("renders with placeholder text and no initial clear button", () => {
    render(<SearchBar placeholder="Search properties..." />);
    const input = screen.getByPlaceholderText("Search properties...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  it("updates input value, triggers onChange, and shows clear button when user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "123 Main St");

    expect(input).toHaveValue("123 Main St");
    expect(handleChange).toHaveBeenCalledWith("123 Main St");
    expect(
      screen.getByRole("button", { name: /clear search input/i }),
    ).toBeInTheDocument();
  });

  it("clears input value, triggers onClear, and removes clear button when clicked in uncontrolled mode", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    render(<SearchBar defaultValue="test query" onClear={handleClear} />);

    const searchbar = screen.getByRole("combobox");
    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    expect(searchbar).toHaveValue("");
    expect(handleClear).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  it("respects controlled value prop and delegates state updates to parent callbacks", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleClear = vi.fn();
    const { rerender } = render(
      <SearchBar
        value="Controlled St"
        onChange={handleChange}
        onClear={handleClear}
      />,
    );

    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("Controlled St");

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(handleClear).toHaveBeenCalledOnce();
    // Remains unchanged until parent updates the controlled value prop
    expect(input).toHaveValue("Controlled St");

    rerender(
      <SearchBar value="" onChange={handleChange} onClear={handleClear} />,
    );
    expect(input).toHaveValue("");
  });

  it("renders suggested items when typing, updates value, fires onSelectItem, and closes dropdown on click", async () => {
    const user = userEvent.setup();
    const handleSelectItem = vi.fn();
    render(
      <SearchBar onSelectItem={handleSelectItem} items={SAMPLE_ITEMS} />,
    );

    const searchbar = screen.getByRole("combobox");
    await user.type(searchbar, "500");

    expect(screen.getByText("Addresses")).toBeInTheDocument();
    await user.click(screen.getByText("500 5th Ave"));

    expect(searchbar).toHaveValue("500 5th Ave");
    expect(handleSelectItem).toHaveBeenCalledWith(SAMPLE_ITEMS[0]);
    expect(screen.queryByText("Addresses")).not.toBeInTheDocument();
  });

  it("displays an untabbable, unselectable empty message when search returns no matching items", async () => {
    const user = userEvent.setup();
    const handleSelectItem = vi.fn();
    render(
      <SearchBar
        items={[]}
        loading={false}
        error={null}
        onSelectItem={handleSelectItem}
        emptyMessage="No matching addresses found."
      />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "999 Nonexistent Blvd");

    const emptyEl = screen.getByText("No matching addresses found.");
    expect(emptyEl).toBeInTheDocument();
    expect(emptyEl).toHaveAttribute("tabindex", "-1");
    expect(emptyEl).toHaveAttribute("aria-disabled", "true");
    expect(emptyEl).toHaveClass("pointer-events-none");

    // Pressing Enter while the empty state is displayed must not select anything
    await user.keyboard("{Enter}");
    expect(handleSelectItem).not.toHaveBeenCalled();

    // Pressing Tab moves focus away from the input without focusing the empty state message
    await user.tab();
    expect(document.activeElement).not.toBe(emptyEl);
  });

  it("displays loading state indicator and 'Searching addresses...' message while loading with no items", async () => {
    const user = userEvent.setup();
    render(<SearchBar loading={true} items={[]} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "Broadway");

    expect(screen.getByText("Searching addresses...")).toBeInTheDocument();
  });

  it("displays error message when error prop is present and loading is false", async () => {
    const user = userEvent.setup();
    render(
      <SearchBar
        loading={false}
        error={new Error("GraphQL network failure")}
        items={[]}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "Broadway");

    expect(
      screen.getByText("Failed to search addresses. Please try again."),
    ).toBeInTheDocument();
  });

  it("closes dropdown on Escape key and triggers onSearch when pressing Enter while closed", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    render(
      <SearchBar
        items={SAMPLE_ITEMS}
        onSearch={handleSearch}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "500");
    expect(screen.getByText("500 5th Ave")).toBeInTheDocument();

    // Escape closes the dropdown
    await user.keyboard("{Escape}");
    expect(screen.queryByText("500 5th Ave")).not.toBeInTheDocument();

    // Enter while closed submits the query via onSearch and reopens the dropdown
    await user.keyboard("{Enter}");
    expect(handleSearch).toHaveBeenCalledWith("500");
    expect(screen.getByText("500 5th Ave")).toBeInTheDocument();
  });

  it("closes dropdown on outside mousedown and reopens on input focus when query exists", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Outside Element</button>
        <SearchBar items={SAMPLE_ITEMS} />
      </div>,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "500");
    expect(screen.getByText("500 5th Ave")).toBeInTheDocument();

    // Clicking outside closes the dropdown
    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside Element" }));
    expect(screen.queryByText("500 5th Ave")).not.toBeInTheDocument();

    // Focusing input again reopens the dropdown when query is non-empty
    fireEvent.focus(input);
    expect(screen.getByText("500 5th Ave")).toBeInTheDocument();
  });
});
