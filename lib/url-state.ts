/**
 * 把界面状态放进查询串，刷新和分享都能还原。
 *
 * 几个组件各写各的键（视图和筛选在 JournalGrid，日历位置在 CalendarView，
 * 语言在 LifeSection），所以每次都是「读出当前全部参数、只改自己那一个、
 * 再写回去」——不然后写的会把先写的抹掉。
 *
 * 用 replaceState 而不是路由跳转：静态导出下换参数不该触发导航，
 * 也不该在浏览器历史里堆一长串只差一个筛选的记录。
 */
export function readParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/** 传 null 或默认值就把这个键删掉，地址栏只留下非默认的部分。 */
export function writeParam(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const params = readParams();
  if (value) params.set(key, value);
  else params.delete(key);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    window.location.pathname + (query ? `?${query}` : "") + window.location.hash
  );
}
