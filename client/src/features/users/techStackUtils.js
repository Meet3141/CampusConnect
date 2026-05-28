export const MAX_TECH_STACK_ITEMS = 20;
export const MAX_TECH_LABEL_LENGTH = 40;

const ICONIFY_SEARCH_URL = "https://api.iconify.design/search";
const ICONIFY_API_URL = "https://api.iconify.design";
const PREFERRED_ICON_PREFIXES = ["devicon", "logos", "simple-icons"];
const ICONIFY_ICON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:[-_.][a-z0-9]+)*$/i;

const TECH_SYNONYMS = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  node: "nodejs",
  nodejs: "nodejs",
  react: "react",
  reactjs: "react",
  vue: "vue",
  vuejs: "vue",
  next: "nextjs",
  nextjs: "nextjs",
  nuxt: "nuxtjs",
  nuxtjs: "nuxtjs",
  express: "expressjs",
  expressjs: "expressjs",
  nest: "nestjs",
  nestjs: "nestjs",
  mongo: "mongodb",
  mongodb: "mongodb",
  postgres: "postgresql",
  postgresql: "postgresql",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  html: "html5",
  html5: "html5",
  css: "css3",
  css3: "css3",
  cpp: "cplusplus",
  cplusplus: "cplusplus",
  csharp: "csharp",
};

const TECH_SEARCH_TERMS = {
  cplusplus: "c++",
  csharp: "csharp",
};

const normalizeSearchKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");

export const getTechAliasKey = (value) => {
  const key = normalizeSearchKey(value);
  return TECH_SYNONYMS[key] || key;
};

export const getTechSearchQuery = (value) => {
  const key = getTechAliasKey(value);
  return TECH_SEARCH_TERMS[key] || key || String(value || "").trim();
};

export const isValidIconifyIconId = (icon) =>
  typeof icon === "string" && ICONIFY_ICON_ID_PATTERN.test(icon.trim());

export const normalizeTechStack = (items = []) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const cleaned = [];

  for (const item of items) {
    const rawLabel = typeof item === "string" ? item : item?.label;
    const label = String(rawLabel || "").trim().slice(0, MAX_TECH_LABEL_LENGTH);
    if (!label) continue;

    const key = getTechAliasKey(label);
    if (seen.has(key)) continue;

    const rawIcon = typeof item === "string" ? null : item?.icon;
    const icon = isValidIconifyIconId(rawIcon) ? rawIcon.trim() : null;

    seen.add(key);
    cleaned.push({ label, icon });
    if (cleaned.length >= MAX_TECH_STACK_ITEMS) break;
  }

  return cleaned;
};

export const getIconifySvgUrl = (icon) => {
  if (!isValidIconifyIconId(icon)) return null;
  const [prefix, name] = icon.trim().split(":");
  return `${ICONIFY_API_URL}/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;
};

const chooseIcon = (label, icons) => {
  const wanted = getTechAliasKey(label);
  const validIcons = icons.filter(isValidIconifyIconId);
  if (!validIcons.length) return null;

  for (const prefix of PREFERRED_ICON_PREFIXES) {
    const exact = validIcons.find((icon) => {
      const [iconPrefix, iconName] = icon.split(":");
      return iconPrefix === prefix && getTechAliasKey(iconName) === wanted;
    });
    if (exact) return exact;
  }

  for (const prefix of PREFERRED_ICON_PREFIXES) {
    const partial = validIcons.find((icon) => {
      const [iconPrefix, iconName] = icon.split(":");
      return iconPrefix === prefix && getTechAliasKey(iconName).includes(wanted);
    });
    if (partial) return partial;
  }

  return validIcons[0];
};

export const resolveTechIcon = async (label) => {
  const query = getTechSearchQuery(label);
  if (!query) return null;

  const params = new URLSearchParams({
    query,
    limit: "16",
    prefixes: PREFERRED_ICON_PREFIXES.join(","),
  });

  try {
    const response = await fetch(`${ICONIFY_SEARCH_URL}?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return chooseIcon(query, Array.isArray(data.icons) ? data.icons : []);
  } catch {
    return null;
  }
};
