import i18n from "i18next";
import React, { useEffect, useState } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
export { default as i18n } from 'i18next';

const messages: Record<string, () => Promise<any>> = {
  af: () => import("../../i18n/af.json"),
  am: () => import("../../i18n/am.json"),
  "ar-EG": () => import("../../i18n/ar-EG.json"),
  "ar-MA": () => import("../../i18n/ar-MA.json"),
  "ar-SA": () => import("../../i18n/ar-SA.json"),
  ar: () => import("../../i18n/ar.json"),
  az: () => import("../../i18n/az.json"),
  bg: () => import("../../i18n/bg.json"),
  bho: () => import("../../i18n/bho.json"),
  bn: () => import("../../i18n/bn.json"),
  bs: () => import("../../i18n/bs.json"),
  ca: () => import("../../i18n/ca.json"),
  cs: () => import("../../i18n/cs.json"),
  da: () => import("../../i18n/da.json"),
  de: () => import("../../i18n/de.json"),
  el: () => import("../../i18n/el.json"),
  "en-GB": () => import("../../i18n/en-GB.json"),
  en: () => import("../../i18n/en.json"),
  "es-419": () => import("../../i18n/es-419.json"),
  "es-AR": () => import("../../i18n/es-AR.json"),
  "es-MX": () => import("../../i18n/es-MX.json"),
  es: () => import("../../i18n/es.json"),
  et: () => import("../../i18n/et.json"),
  eu: () => import("../../i18n/eu.json"),
  fa: () => import("../../i18n/fa.json"),
  fi: () => import("../../i18n/fi.json"),
  fil: () => import("../../i18n/fil.json"),
  "fr-CA": () => import("../../i18n/fr-CA.json"),
  fr: () => import("../../i18n/fr.json"),
  gl: () => import("../../i18n/gl.json"),
  gu: () => import("../../i18n/gu.json"),
  he: () => import("../../i18n/he.json"),
  hi: () => import("../../i18n/hi.json"),
  hr: () => import("../../i18n/hr.json"),
  hu: () => import("../../i18n/hu.json"),
  id: () => import("../../i18n/id.json"),
  is: () => import("../../i18n/is.json"),
  it: () => import("../../i18n/it.json"),
  ja: () => import("../../i18n/ja.json"),
  kn: () => import("../../i18n/kn.json"),
  ko: () => import("../../i18n/ko.json"),
  lt: () => import("../../i18n/lt.json"),
  lv: () => import("../../i18n/lv.json"),
  mk: () => import("../../i18n/mk.json"),
  ml: () => import("../../i18n/ml.json"),
  mr: () => import("../../i18n/mr.json"),
  ms: () => import("../../i18n/ms.json"),
  nb: () => import("../../i18n/nb.json"),
  ne: () => import("../../i18n/ne.json"),
  nl: () => import("../../i18n/nl.json"),
  or: () => import("../../i18n/or.json"),
  "pa-IN": () => import("../../i18n/pa-IN.json"),
  "pa-PK": () => import("../../i18n/pa-PK.json"),
  pl: () => import("../../i18n/pl.json"),
  "pt-BR": () => import("../../i18n/pt-BR.json"),
  "pt-PT": () => import("../../i18n/pt-PT.json"),
  ro: () => import("../../i18n/ro.json"),
  ru: () => import("../../i18n/ru.json"),
  sk: () => import("../../i18n/sk.json"),
  sl: () => import("../../i18n/sl.json"),
  sr: () => import("../../i18n/sr.json"),
  sv: () => import("../../i18n/sv.json"),
  sw: () => import("../../i18n/sw.json"),
  ta: () => import("../../i18n/ta.json"),
  te: () => import("../../i18n/te.json"),
  th: () => import("../../i18n/th.json"),
  tr: () => import("../../i18n/tr.json"),
  uk: () => import("../../i18n/uk.json"),
  ur: () => import("../../i18n/ur.json"),
  vi: () => import("../../i18n/vi.json"),
  "zh-CN": () => import("../../i18n/zh-CN.json"),
  "zh-HK": () => import("../../i18n/zh-HK.json"),
  "zh-TW": () => import("../../i18n/zh-TW.json"),
  zu: () => import("../../i18n/zu.json"),
};

interface ProvidersProps {
  children?: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = (props) => {
  const [locale, setLocale] = useState(Spicetify.Locale.getLocale());
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const currentLocale = Spicetify.Locale.getLocale();
    setLocale(currentLocale);

    const loadMessages = async () => {
      const resources: Record<string, any> = {};

      for (const [lang, loader] of Object.entries(messages)) {
        const module = await loader();
        resources[lang] = { translation: module.default };
      }

      await i18n.use(initReactI18next).init({
        resources,
        lng: currentLocale,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
      });

      setI18nReady(true);
    };

    loadMessages();
  }, [Spicetify.Platform.Session.locale, Spicetify.Locale._locale]);

  if (!i18nReady) return null;

  return <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>;
};
