const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const assetUrl = (value) => {
  if (!value || /^(data:|blob:|https?:\/\/)/i.test(value)) return value;
  if (value.startsWith(`${basePath}/`)) return value;
  if (value.startsWith('/assets/')) return `${basePath}${value}`;
  return value;
};

