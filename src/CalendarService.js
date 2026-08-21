/**
 * Google Calendar（Advanced Calendar Service = Calendar API v3）の呼び出しを専任で担う。
 * 他のファイルはCalendar APIを直接触らない。取得・作成・更新・削除をここへ集約することで、
 * 「Google Calendarが予定データの正本」という方針を1箇所のコードで保証する
 * （このアプリは独自のイベント用DB/シートを一切持たない）。
 */

var MAX_RETRY_COUNT_ = 3;
var RETRY_BASE_DELAY_MS_ = 500;

function getTargetCalendarId_() {
  return Config.CALENDAR_ID || 'primary';
}

/**
 * Calendar APIの一時的な失敗（429 レート制限 / 5xx）に対する指数バックオフ付きリトライ。
 * 401/403/404等の恒久的なエラーはリトライせずそのまま投げる。
 */
function callWithRetry_(fn) {
  var attempt = 0;
  while (true) {
    try {
      return fn();
    } catch (e) {
      var message = String((e && e.message) || e);
      var isRetryable = /rate limit|quota|backend error|internal error|50\d|429/i.test(message);
      attempt++;
      if (!isRetryable || attempt >= MAX_RETRY_COUNT_) {
        throw e;
      }
      Utilities.sleep(RETRY_BASE_DELAY_MS_ * Math.pow(2, attempt - 1));
    }
  }
}

/**
 * 指定期間（timeMin〜timeMax、いずれもISO文字列）の、このアプリが作成した予定だけを取得する。
 * privateExtendedProperty での絞り込みにより、無関係な予定を毎回大量に取得しないようにしている。
 */
function listCalendarEvents_(timeMinIso, timeMaxIso) {
  var calendarId = getTargetCalendarId_();
  var events = [];
  var pageToken;
  do {
    var response = callWithRetry_(function () {
      return Calendar.Events.list(calendarId, {
        timeMin: timeMinIso,
        timeMax: timeMaxIso,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        pageToken: pageToken,
        privateExtendedProperty: Config.APP_SOURCE_KEY + '=' + Config.APP_SOURCE_VALUE
      });
    });
    events = events.concat(response.items || []);
    pageToken = response.nextPageToken;
  } while (pageToken);
  return events;
}

function getCalendarEvent_(eventId) {
  var calendarId = getTargetCalendarId_();
  return callWithRetry_(function () {
    return Calendar.Events.get(calendarId, eventId);
  });
}

function insertCalendarEvent_(resource) {
  var calendarId = getTargetCalendarId_();
  return callWithRetry_(function () {
    return Calendar.Events.insert(resource, calendarId);
  });
}

function patchCalendarEvent_(eventId, resource) {
  var calendarId = getTargetCalendarId_();
  return callWithRetry_(function () {
    return Calendar.Events.patch(resource, calendarId, eventId);
  });
}

function removeCalendarEvent_(eventId) {
  var calendarId = getTargetCalendarId_();
  callWithRetry_(function () {
    Calendar.Events.remove(calendarId, eventId);
  });
}
