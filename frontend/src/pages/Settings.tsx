import AppLayout from "../layouts/AppLayout";

/**
 * Basic settings page placeholder.
 * @returns The rendered settings page.
 */
const Settings = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-white text-black">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account and preferences.
            </p>
          </div>
        </header>
        <main className="p-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Settings page coming soon.
            </p>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
