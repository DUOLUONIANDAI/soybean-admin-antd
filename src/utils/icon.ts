/**
* 获取本地 SVG 图标名称列表
*
* @returns 返回本地 SVG 图标名称的字符串数组
*/
export function getLocalIcons() {
  const svgIcons = import.meta.glob('/src/assets/svg-icon/*.svg');

  const keys = Object.keys(svgIcons)
    .map(item => item.split('/').at(-1)?.replace('.svg', '') || '')
    .filter(Boolean);

  return keys;
}
