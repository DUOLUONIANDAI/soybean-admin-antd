export {};

declare global {
  export interface Window {
    /** NProgress实例 */
    NProgress?: import('nprogress').NProgress;
    /** Ant-design-vue消息实例 */
    $message?: import('ant-design-vue/es/message/interface').MessageInstance;
    /** Ant-design-vue模态框实例 */
    $modal?: Omit<import('ant-design-vue/es/modal/confirm').ModalStaticFunctions, 'warn'>;
    /** Ant-design-vue通知实例 */
    $notification?: import('ant-design-vue/es/notification/interface').NotificationInstance;
  }

  /** 项目构建时间 */
  export const BUILD_TIME: string;
}
