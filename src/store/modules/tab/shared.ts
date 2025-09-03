import type { Router } from 'vue-router';
import type { LastLevelRouteKey, RouteKey, RouteMap } from '@elegant-router/types';
import { $t } from '@/locales';
import { getRoutePath } from '@/router/elegant/transform';

/** 获取所有标签页 */
export function getAllTabs(tabs: App.Global.Tab[], homeTab?: App.Global.Tab) {
  if (!homeTab) {
    return [];
  }

  const filterHomeTabs = tabs.filter(tab => tab.id !== homeTab.id);

  const fixedTabs = filterHomeTabs.filter(isFixedTab).sort((a, b) => a.fixedIndex! - b.fixedIndex!);

  const remainTabs = filterHomeTabs.filter(tab => !isFixedTab(tab));

  const allTabs = [homeTab, ...fixedTabs, ...remainTabs];

  return updateTabsLabel(allTabs);
}

/** 是否为固定标签页 */
function isFixedTab(tab: App.Global.Tab) {
  return tab.fixedIndex !== undefined && tab.fixedIndex !== null;
}

/** 通过路由获取标签页ID */
export function getTabIdByRoute(route: App.Global.TabRoute) {
  const { path, query = {}, meta } = route;

  let id = path;

  if (meta.multiTab) {
    const queryKeys = Object.keys(query).sort();
    const qs = queryKeys.map(key => `${key}=${query[key]}`).join('&');

    id = `${path}?${qs}`;
  }

  return id;
}

/** 通过路由获取标签页 */
export function getTabByRoute(route: App.Global.TabRoute) {
  const { name, path, fullPath = path, meta } = route;
  const { title, i18nKey, fixedIndexInTab } = meta;

  // Get icon and localIcon from getRouteIcons function
  const { icon, localIcon } = getRouteIcons(route);

  const label = i18nKey ? $t(i18nKey) : title;

  const tab: App.Global.Tab = {
    id: getTabIdByRoute(route),
    label,
    routeKey: name as LastLevelRouteKey,
    routePath: path as RouteMap[LastLevelRouteKey],
    fullPath,
    fixedIndex: fixedIndexInTab,
    icon,
    localIcon,
    i18nKey
  };

  return tab;
}

/** 获取路由图标 */
export function getRouteIcons(route: App.Global.TabRoute) {
  // Set default value for icon at the beginning
  let icon: string = route?.meta?.icon || import.meta.env.VITE_MENU_ICON;
  let localIcon: string | undefined = route?.meta?.localIcon;

  // Route.matched only appears when there are multiple matches,so check if route.matched exists
  if (route.matched) {
    // Find the meta of the current route from matched
    const currentRoute = route.matched.find(r => r.name === route.name);
    // If icon exists in currentRoute.meta, it will overwrite the default value
    icon = currentRoute?.meta?.icon || icon;
    localIcon = currentRoute?.meta?.localIcon;
  }

  return { icon, localIcon };
}

/** 获取默认首页标签页 */
export function getDefaultHomeTab(router: Router, homeRouteName: LastLevelRouteKey) {
  const homeRoutePath = getRoutePath(homeRouteName);
  const i18nLabel = $t(`route.${homeRouteName}`);

  let homeTab: App.Global.Tab = {
    id: getRoutePath(homeRouteName),
    label: i18nLabel || homeRouteName,
    routeKey: homeRouteName,
    routePath: homeRoutePath,
    fullPath: homeRoutePath
  };

  const routes = router.getRoutes();
  const homeRoute = routes.find(route => route.name === homeRouteName);
  if (homeRoute) {
    homeTab = getTabByRoute(homeRoute);
  }

  return homeTab;
}

/** 标签页是否在标签页数组中 */
export function isTabInTabs(tabId: string, tabs: App.Global.Tab[]) {
  return tabs.some(tab => tab.id === tabId);
}

/** 通过ID过滤标签页 */
export function filterTabsById(tabId: string, tabs: App.Global.Tab[]) {
  return tabs.filter(tab => tab.id !== tabId);
}

/** 通过多个ID过滤标签页 */
export function filterTabsByIds(tabIds: string[], tabs: App.Global.Tab[]) {
  return tabs.filter(tab => !tabIds.includes(tab.id));
}

/** 通过所有路由提取标签页 */
export function extractTabsByAllRoutes(router: Router, tabs: App.Global.Tab[]) {
  const routes = router.getRoutes();

  const routeNames = routes.map(route => route.name);

  return tabs.filter(tab => routeNames.includes(tab.routeKey));
}

/** 获取固定标签页 */
export function getFixedTabs(tabs: App.Global.Tab[]) {
  return tabs.filter(tab => tab.fixedIndex !== undefined);
}

/** 获取固定标签页ID */
export function getFixedTabIds(tabs: App.Global.Tab[]) {
  const fixedTabs = getFixedTabs(tabs);

  return fixedTabs.map(tab => tab.id);
}

/** 更新标签页标签 */
function updateTabsLabel(tabs: App.Global.Tab[]) {
  const updated = tabs.map(tab => ({
    ...tab,
    label: tab.newLabel || tab.oldLabel || tab.label
  }));

  return updated;
}

/** 通过国际化键更新标签页 */
export function updateTabByI18nKey(tab: App.Global.Tab) {
  const { i18nKey, label } = tab;

  return {
    ...tab,
    label: i18nKey ? $t(i18nKey) : label
  };
}

/** 通过国际化键更新多个标签页 */
export function updateTabsByI18nKey(tabs: App.Global.Tab[]) {
  return tabs.map(tab => updateTabByI18nKey(tab));
}

/** 通过路由名称查找标签页 */
export function findTabByRouteName(name: RouteKey, tabs: App.Global.Tab[]) {
  const routePath = getRoutePath(name);

  const tabId = routePath;
  const multiTabId = `${routePath}?`;

  return tabs.find(tab => tab.id === tabId || tab.id.startsWith(multiTabId));
}
