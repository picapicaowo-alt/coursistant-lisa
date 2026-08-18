import { useTranslation } from "react-i18next";
import { LANGUAGE_SWITCHER_ENABLED, SUPPORTED_LOCALES, LOCALE_LABELS } from "../i18n";

/**
 * Language switcher dropdown component.
 * Allows users to switch between supported languages.
 * Selection is persisted in localStorage.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  // Keep the component ready for the completed translation rollout, while
  // ensuring a legacy import cannot accidentally expose the partial Chinese UI.
  if (!LANGUAGE_SWITCHER_ENABLED) return null;

  // Get current language (resolved or fallback)
  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      value={currentLanguage}
      onChange={handleChange}
      style={{
        padding: "4px 8px",
        borderRadius: "6px",
        border: "1px solid #E2E8F0",
        backgroundColor: "white",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale] || locale}
        </option>
      ))}
    </select>
  );
}
