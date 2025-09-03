export interface RequestInstanceState {
  /** 请求是否正在刷新token */
  refreshTokenFn: Promise<boolean> | null;
  /** 请求错误消息堆栈 */
  errMsgStack: string[];
}
