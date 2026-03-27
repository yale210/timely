import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileSection from "@/components/settings/ProfileSection";
import type { Profile } from "@/types";

const baseProfile: Profile = {
  id: 1,
  user: 10,
  name: "Asuka",
  bio: "The best in town",
  avatar: "https://example.com/avatar.png",
  date_of_birth: "2005-05-01",
  slogan: "Don't hold anything back!",
  creation_date: "2025-01-01T00:00:00Z",
} as Profile;

describe("ProfileSection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading state", () => {
    render(
      <ProfileSection
        profile={null}
        loading
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows an error state when profile is null", () => {
    render(
      <ProfileSection
        profile={null}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Unable to load profile.")).toBeInTheDocument();
  });

  it("renders profile fields and avatar image", () => {
    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        isDirty
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Asuka")).toBeInTheDocument();
    expect(screen.getByDisplayValue("The best in town")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2005-05-01")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar")).toBeInTheDocument();
  });

  it("shows No avatar when there is no avatar", () => {
    render(
      <ProfileSection
        profile={{ ...baseProfile, avatar: null }}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No avatar")).toBeInTheDocument();
  });

  it("shows top-level error when provided", () => {
    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error="Profile save failed."
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Profile save failed.")).toBeInTheDocument();
  });

  it("shows field error messages", () => {
    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{
          avatar: ["Avatar is invalid."],
          name: ["Name is required."],
          date_of_birth: ["Date is invalid."],
          bio: ["Bio is too long."],
        }}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Avatar is invalid.")).toBeInTheDocument();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Date is invalid.")).toBeInTheDocument();
    expect(screen.getByText("Bio is too long.")).toBeInTheDocument();
  });

  it("calls onChange when the name changes", () => {
    const onChange = vi.fn();

    render(
        <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={onChange}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
        />,
    );

    fireEvent.change(screen.getByDisplayValue("Asuka"), {
        target: { value: "Kazama" },
    });

    expect(onChange).toHaveBeenCalledWith({
        ...baseProfile,
        name: "Kazama",
    });
  });

  it("calls onChange when the bio changes", () => {
    const onChange = vi.fn();

    render(
        <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={onChange}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
        />,
    );

    fireEvent.change(screen.getByDisplayValue("The best in town"), {
        target: { value: "Spirited peacemaker" },
    });

    expect(onChange).toHaveBeenCalledWith({
        ...baseProfile,
        bio: "Spirited peacemaker",
    });
  });

  it("calls onChange when date_of_birth changes", () => {
    const onChange = vi.fn();

    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={onChange}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    const dateInput = screen.getByDisplayValue("2005-05-01");
    fireEvent.change(dateInput, { target: { value: "2006-06-02" } });

    expect(onChange).toHaveBeenCalledWith({
      ...baseProfile,
      date_of_birth: "2006-06-02",
    });
  });

  it("passes null when date_of_birth is cleared", () => {
    const onChange = vi.fn();

    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={onChange}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    const dateInput = screen.getByDisplayValue("2005-05-01");
    fireEvent.change(dateInput, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({
      ...baseProfile,
      date_of_birth: null,
    });
  });

  it("calls onAvatarChange with the selected file", () => {
    const onAvatarChange = vi.fn();

    const { container } = render(
        <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={onAvatarChange}
        />,
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onAvatarChange).toHaveBeenCalledWith(file);
});

  it("calls onAvatarChange with the selected file", () => {
    const onAvatarChange = vi.fn();

    const { container } = render(
        <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={onAvatarChange}
        />,
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onAvatarChange).toHaveBeenCalledWith(file);
  });

  it("calls onSave when save button is clicked", async () => {
    const onSave = vi.fn();

    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        isDirty
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={onSave}
        onAvatarChange={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables the save button while saving", () => {
    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("sets the maximum date of birth to today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00.000Z"));

    render(
      <ProfileSection
        profile={baseProfile}
        loading={false}
        saving={false}
        error={null}
        fieldErrors={{}}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onAvatarChange={vi.fn()}
      />,
    );

    const dateInput = screen.getByDisplayValue("2005-05-01");
    expect(dateInput).toHaveAttribute("max", "2026-03-26");
  });
});
