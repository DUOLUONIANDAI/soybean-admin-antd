import { $t } from '@/locales';

/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
/**
* 将一个对象转换为选项数组
*
* @param record 要转换的对象，对象的值必须是字符串类型
* @returns 转换后的选项数组
*/
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label
  })) as CommonType.Option<keyof T>[];
}

/**
 * Translate options
 *
 * @param options
 */
/**
* 翻译选项列表
*
* @param options 选项列表
* @returns 翻译后的选项列表
*/
export function translateOptions(options: CommonType.Option<string>[]) {
  return options.map(option => ({
    ...option,
    label: $t(option.label as App.I18n.I18nKey)
  }));
}

/**
 * Toggle html class
 *
 * @param className
 */
/**
* 切换 HTML 根元素的 class。
*
* @param className 要切换的 class 名称
* @returns 包含 add 和 remove 方法的对象，用于添加或移除指定的 class。
*/
export function toggleHtmlClass(className: string) {
  /**
  * 向文档根元素的 classList 中添加指定的类名。
  *
  * @param className 要添加的类名
  */
  function add() {
    document.documentElement.classList.add(className);
  }

  /**
  * 从文档的根元素中移除指定的类名
  */
  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove
  };
}
