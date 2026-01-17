/**
 * Feature key to route mapping
 * Used for API interceptor and page protection
 */
export const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  buildings: ['/buildings'],
  rooms: ['/rooms'],
  beds: ['/beds'],
  residents: ['/residents'],
  rentPayments: ['/payments', '/rent-payments'],
  extraPayments: ['/extra-payments'],
  securityDeposits: ['/security-deposits'],
  onlinePayments: ['/online-payments'],
  complaints: ['/complaints'],
  visitors: ['/visitors'],
  gatePasses: ['/gate-passes'],
  notices: ['/notices'],
  staff: ['/staff'],
  assets: ['/assets'],
  userManagement: ['/users'],
  settings: ['/settings'],
  reports: ['/reports'],
  insights: ['/insights'],
  exportData: ['/export'],
  activityLog: ['/activity', '/activity-logs'],
  auditLog: ['/audit-logs'],
  savedFilters: ['/saved-filters'],
  customTags: ['/tags'],
  bulkActions: ['/bulk-actions'],
  proration: ['/proration'],
};

/**
 * Get feature key from URL path
 */
export function getFeatureFromPath(path: string): string | null {
  // Skip feature check for residents API endpoint - it's needed for dropdowns
  // Check if it's exactly /residents (not a sub-route like /residents/123)
  const urlPath = path.split('?')[0].split('#')[0].trim();
  const urlPathNormalized = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;
  
  // Check if it's the residents list endpoint (only one path segment)
  // Use explicit check: path should be exactly '/residents' or 'residents'
  const pathSegments = urlPathNormalized.split('/').filter(Boolean);
  const isResidentsListEndpoint = 
    urlPathNormalized === '/residents' || 
    urlPathNormalized === 'residents' ||
    (pathSegments.length === 1 && pathSegments[0] === 'residents');
  
  if (isResidentsListEndpoint) {
    return null; // Don't require feature for residents API endpoint
  }
  
  // Skip 'residents' feature check in the loop - we already handled it above
  for (const [feature, routes] of Object.entries(FEATURE_ROUTE_MAP)) {
    // Skip residents feature - we already handled it
    if (feature === 'residents') {
      continue;
    }
    if (routes.some((route) => path.includes(route))) {
      return feature;
    }
  }
  return null;
}

/**
 * Get feature key from dashboard route
 */
export function getFeatureFromDashboardRoute(route: string): string | null {
  const routeMap: Record<string, string> = {
    '/dashboard/buildings': 'buildings',
    '/dashboard/rooms': 'rooms',
    '/dashboard/beds': 'beds',
    '/dashboard/residents': 'residents',
    '/dashboard/payments': 'rentPayments',
    '/dashboard/complaints': 'complaints',
    '/dashboard/visitors': 'visitors',
    '/dashboard/gate-passes': 'gatePasses',
    '/dashboard/notices': 'notices',
    '/dashboard/staff': 'staff',
    '/dashboard/assets': 'assets',
    '/dashboard/users': 'userManagement',
    '/dashboard/settings': 'settings',
    '/dashboard/reports': 'reports',
    '/dashboard/insights': 'insights',
    '/dashboard/activity': 'activityLog',
    '/dashboard/audit-logs': 'auditLog',
  };
  return routeMap[route] || null;
}
