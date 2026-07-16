import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./resources/en/common.json";
import enAuth from "./resources/en/auth.json";
import enCourse from "./resources/en/course.json";
import enDetailWorkspace from "./resources/en/detailWorkspace.json";

import zhCommon from "./resources/zh-CN/common.json";
import zhAuth from "./resources/zh-CN/auth.json";
import zhCourse from "./resources/zh-CN/course.json";
import zhDetailWorkspace from "./resources/zh-CN/detailWorkspace.json";

// Supported languages
export const SUPPORTED_LOCALES = ["en", "zh-CN"];
export const DEFAULT_LOCALE = "en";

// Language labels for UI display
export const LOCALE_LABELS = {
  en: "English",
  "zh-CN": "简体中文",
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n to react-i18next
  .init({
    resources: {
      en: { 
        common: enCommon,
        auth: enAuth,
        course: enCourse,
        detailWorkspace: enDetailWorkspace
      },
      "zh-CN": {
         common: zhCommon,
         auth: zhAuth,
         course: zhCourse,
         detailWorkspace: zhDetailWorkspace
        },
    },
    supportedLngs: SUPPORTED_LOCALES,
    fallbackLng: "en", // Fallback to English if translation missing

    defaultNS: "common", // Default namespace
    ns: ["common", "auth", "course", "detailWorkspace"], // Available namespaces

    detection: {
      // Detection order: localStorage first, then browser language
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"], // Cache detected language in localStorage
      lookupLocalStorage: "locale", // Key name in localStorage
    },

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    react: {
      useSuspense: false, // Disable suspense to avoid loading states
    },
  });

export default i18n;
