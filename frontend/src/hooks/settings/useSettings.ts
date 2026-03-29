import { useNavigate } from "react-router-dom";
import {
  buildUseSettingsResult,
  useSettingsDataEffects,
  useSettingsDomainActions,
  useSettingsGlobalActions,
} from "./useSettingsActions";
import { useSettingsStateBundle } from "./useSettingsState";
import type { UseSettingsReturn } from "./settingsTypes";

export type { UseSettingsReturn } from "./settingsTypes";

/**
 * Composes the settings domain state, effects, and actions into the public settings hook.
 * @returns Structured settings state, loading flags, errors, and actions.
 */
export const useSettings = (): UseSettingsReturn => {
  const navigate = useNavigate();
  const { core, loading, errors } = useSettingsStateBundle();
  const globalActions = useSettingsGlobalActions(navigate, core, loading);
  const domain = useSettingsDomainActions(core, loading, errors);

  useSettingsDataEffects(core.activeSection, domain.loadPreference, domain.loadCategories);

  return buildUseSettingsResult(core, loading, errors, {
    ...globalActions,
    ...domain.actions,
  });
};
