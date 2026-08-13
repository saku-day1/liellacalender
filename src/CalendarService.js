/**
 * Google Calendarへの新規イベント登録を専任で担う。
 * Calendar IDの解決（設定値 or デフォルトカレンダー）もここに閉じ込める。
 */

function getTargetCalendar_() {
  if (Config.CALENDAR_ID) {
    var calendar = CalendarApp.getCalendarById(Config.CALENDAR_ID);
    if (!calendar) {
      throw new Error('Config.CALENDAR_ID で指定されたカレンダーが見つかりません: ' + Config.CALENDAR_ID);
    }
    return calendar;
  }
  return CalendarApp.getDefaultCalendar();
}

/**
 * eventData.recurrence.ruleType を CalendarApp.newRecurrence() のルールへ変換する。
 * 新しい繰り返し種別（隔週・毎月など）を追加する場合は、ここにエントリを1つ足すだけでよい
 * （Config.RECURRENCE_OPTIONS にも対応するruleType/intervalを追加する）。
 */
var RECURRENCE_RULE_BUILDERS_ = {
  weekly: function (rule, interval) {
    return rule.addWeeklyRule().interval(interval);
  },
  monthly: function (rule, interval) {
    return rule.addMonthlyRule().interval(interval);
  }
};

function buildRecurrenceRule_(recurrence) {
  var builder = RECURRENCE_RULE_BUILDERS_[recurrence.ruleType];
  if (!builder) {
    throw new Error('未対応の繰り返し種別です: ' + recurrence.ruleType);
  }
  var rule = builder(CalendarApp.newRecurrence(), recurrence.interval);
  return rule.times(recurrence.count);
}

function createTimedEvent_(calendar, eventData) {
  var options = { description: eventData.description, location: eventData.location };
  if (eventData.recurrence) {
    return calendar.createEventSeries(
      eventData.title,
      eventData.start,
      eventData.end,
      buildRecurrenceRule_(eventData.recurrence),
      options
    );
  }
  return calendar.createEvent(eventData.title, eventData.start, eventData.end, options);
}

function createAllDayEvent_(calendar, eventData) {
  var options = { description: eventData.description, location: eventData.location };
  if (eventData.recurrence) {
    return calendar.createAllDayEventSeries(
      eventData.title,
      eventData.date,
      buildRecurrenceRule_(eventData.recurrence),
      options
    );
  }
  return calendar.createAllDayEvent(eventData.title, eventData.date, options);
}

/**
 * eventData（EventFactory.buildEventDataの戻り値）を元にイベントを作成し、
 * 作成したイベントのURL(htmlLink相当)を返す。
 */
function createEvent(eventData) {
  var calendar = getTargetCalendar_();
  var event = eventData.isAllDay
    ? createAllDayEvent_(calendar, eventData)
    : createTimedEvent_(calendar, eventData);
  return event;
}
