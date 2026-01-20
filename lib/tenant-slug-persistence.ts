// Tenant Slug Persistence
// Handles storing and retrieving the last used tenant slug for auto-redirect

const TENANT_SLUG_KEY = 'nivaasone-last-tenant-slug';
const TENANT_SLUG_TIMESTAMP_KEY = 'nivaasone-last-tenant-timestamp';
const TENANT_SLUG_EXPIRY_DAYS = 30; // Expire after 30 days

export function saveTenantSlug(slug: string) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TENANT_SLUG_KEY, slug);
    localStorage.setItem(TENANT_SLUG_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save tenant slug:', error);
  }
}

export function getLastTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const slug = localStorage.getItem(TENANT_SLUG_KEY);
    const timestamp = localStorage.getItem(TENANT_SLUG_TIMESTAMP_KEY);

    if (!slug || !timestamp) {
      return null;
    }

    // Check if slug has expired
    const savedTime = parseInt(timestamp, 10);
    const expiryTime = TENANT_SLUG_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - savedTime > expiryTime) {
      // Expired, remove it
      clearTenantSlug();
      return null;
    }

    return slug;
  } catch (error) {
    console.error('Failed to get tenant slug:', error);
    return null;
  }
}

export function clearTenantSlug() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TENANT_SLUG_KEY);
    localStorage.removeItem(TENANT_SLUG_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear tenant slug:', error);
  }
}

export function redirectToTenantSlug(slug: string) {
  if (typeof window === 'undefined') return;

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  // For localhost/IP, use query parameter
  if (hostname === 'localhost' || hostname.includes('127.0.0.1') || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    const currentPath = window.location.pathname;
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('tenant', slug);
    window.location.href = `${protocol}//${hostname}${port}${currentPath}?${queryParams.toString()}`;
  } else {
    // For production, redirect to subdomain
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join('.');
      window.location.href = `${protocol}//${slug}.${rootDomain}${port}/`;
    }
  }
}
