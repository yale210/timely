let logoSvgTemplatePromise: Promise<string> | null = null;

const getLogoSvgTemplate = async (): Promise<string> => {
  logoSvgTemplatePromise ??= fetch("/t.svg").then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to load favicon source.");
    }
    return response.text();
  });

  return logoSvgTemplatePromise;
};

const getFaviconLink = (): HTMLLinkElement => {
  const existingLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (existingLink) {
    return existingLink;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  document.head.appendChild(link);
  return link;
};

/**
 * Updates the favicon to match the active theme primary color.
 * Falls back to the default logo if the themed favicon cannot be generated.
 */
export const updateThemeFavicon = (): void => {
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();

  if (!primaryColor) {
    return;
  }

  void getLogoSvgTemplate()
    .then((svgTemplate) => {
      const themedSvg = svgTemplate.replace(/currentColor/g, primaryColor);
      const faviconHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(themedSvg)}`;
      const faviconLink = getFaviconLink();
      faviconLink.href = faviconHref;
    })
    .catch(() => {
      const faviconLink = getFaviconLink();
      faviconLink.href = "/t.svg";
    });
};

/**
 * Applies the provided theme name to the document root.
 * @param themeName - The theme identifier to assign to the document.
 */
export const setDocumentTheme = (themeName: string) => {
  document.documentElement.dataset.theme = themeName;
  updateThemeFavicon();
};

/**
 * Applies a colour theme to the document and persists the choice.
 * @param themeName - The theme identifier to activate.
 */
export const applyTheme = (themeName: string) => {
  setDocumentTheme(themeName);
  localStorage.setItem("theme", themeName);
};

/**
 * Applies a font family to the document and persists the choice.
 * @param fontName - The font identifier to activate.
 */
export const applyFont = (fontName: string) => {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
};
