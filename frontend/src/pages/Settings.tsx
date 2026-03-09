import SettingsContent from "@/components/settings/SettingsContent";
import { useSettings } from "@/hooks/settings/useSettings";
import AppLayout from "@/layouts/AppLayout";

/**
 * Renders the settings page using a thin container.
 * @returns The rendered settings page.
 */
const Settings = () => {
  const { state, loading, error, actions } = useSettings();

  return (
    <AppLayout>
      <SettingsContent
        state={state}
        loading={loading}
        error={error}
        actions={actions}
      />
    </AppLayout>
  );
};

export default Settings;
