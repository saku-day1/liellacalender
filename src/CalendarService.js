/**
 * Google Calendarへの登録・更新・削除を専任で担う。
 * デフォルト（メイン）カレンダーを使用する。
 */

function getTargetCalendar_() {
  return CalendarApp.getDefaultCalendar();
}

/**
 * 新規イベントを作成し、CalendarEventのIDを返す。
 */
function createCalendarEvent(eventData) {
  var calendar = getTargetCalendar_();
  var event = calendar.createEvent(eventData.title, eventData.start, eventData.end, {
    description: eventData.description
  });
  return event.getId();
}

/**
 * 既存イベントを更新する。対象が見つからない場合はエラーを投げる。
 */
function updateCalendarEvent(eventId, eventData) {
  var calendar = getTargetCalendar_();
  var event = calendar.getEventById(eventId);
  if (!event) {
    throw new Error('Googleカレンダーにイベントが見つかりません(eventId: ' + eventId + ')');
  }
  event.setTitle(eventData.title);
  event.setTime(eventData.start, eventData.end);
  event.setDescription(eventData.description);
}

/**
 * 既存イベントを削除する。対象が見つからない場合は何もしない（既に削除済みとみなす）。
 */
function deleteCalendarEvent(eventId) {
  var calendar = getTargetCalendar_();
  var event = calendar.getEventById(eventId);
  if (event) {
    event.deleteEvent();
  }
}
