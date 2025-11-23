/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the scaffold messaging", () => {
    render(<HomePage />);
    expect(screen.getByText(/Phase 0 - Scaffold ready/i)).toBeInTheDocument();
    expect(screen.getByText(/LangGraph workspace is set up/i)).toBeInTheDocument();
  });
});
