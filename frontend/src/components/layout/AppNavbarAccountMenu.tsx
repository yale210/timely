import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "react-router-dom";
import type { User } from "@/types";

interface AppNavbarAccountMenuProps {
  user: User | null;
  profileAvatar: string | null;
}

const renderAvatar = (user: User | null, profileAvatar: string | null) => {
  if (typeof profileAvatar === "string" && profileAvatar) {
    return <img src={profileAvatar} alt={user?.username ?? "Account"} className="h-full w-full object-cover" />;
  }
  if (typeof user?.avatar === "string" && user.avatar) {
    return <img src={user.avatar} alt={user.username ?? "Account"} className="h-full w-full object-cover" />;
  }
  if (typeof user?.avatar_url === "string" && user.avatar_url) {
    return <img src={user.avatar_url} alt={user.username ?? "Account"} className="h-full w-full object-cover" />;
  }
  return (user?.username ?? "A").slice(0, 1).toUpperCase();
};

const accountLinks = [
  { label: "Friends", to: "/friends" },
  { label: "Event Sharing", to: "/sharing" },
  { label: "Settings", to: "/settings" },
];

/**
 * Renders the account dropdown in the main app navbar.
 * @param props - Account menu props.
 * @param props.user - The authenticated user.
 * @param props.profileAvatar - Avatar loaded from the profile endpoint.
 * @returns The account menu trigger and dropdown items.
 */
export default function AppNavbarAccountMenu({
  user,
  profileAvatar,
}: AppNavbarAccountMenuProps) {
  return (
    <Menu as="div" className="relative flex h-8 items-center">
      <MenuButton className="inline-flex h-8 items-center justify-center gap-2 rounded-full px-2.5 py-0 text-sm font-semibold leading-none text-gray-900 hover:bg-gray-100">
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-200 text-xs font-semibold text-gray-700 dark:border-white/40">
          {renderAvatar(user, profileAvatar)}
        </span>
        {user?.username ?? "Account"}
      </MenuButton>
      <MenuItems
        modal={false}
        className="absolute right-0 top-full z-50 mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none"
      >
        <div className="py-1">
          {user?.username ? (
            <MenuItem>
              {({ focus }) => (
                <Link
                  to={`/profiles/${user.username}`}
                  className={`block px-4 py-2 text-sm ${
                    focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                  }`}
                >
                  My profile
                </Link>
              )}
            </MenuItem>
          ) : null}
          {accountLinks.map((item) => (
            <MenuItem key={item.to}>
              {({ focus }) => (
                <Link
                  to={item.to}
                  className={`block px-4 py-2 text-sm ${
                    focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
