"""家庭行程 LINE 提醒。

兩種模式（由環境變數 NOTIFY_MODE 決定）：
- tomorrow：每晚提醒「明天」的行程（預設）
- weekly：每週日晚上提醒「下週一～週日」的行程

提醒的目的是事先通知，因此不再顯示已完成的當天行程。
"""

import json
import os
import sys
import time
from datetime import date, datetime, timedelta
from typing import Optional, TypedDict
from zoneinfo import ZoneInfo

TIMEZONE = "Asia/Taipei"
WEEKDAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"]
DIVIDER = "━━━━━━━━━━━━"


class ScheduleEvent(TypedDict):
    date: str
    display_time: str
    title: str
    sort_time: str


def to_schedule_event(data: dict) -> Optional[ScheduleEvent]:
    """把 Firestore 文件轉成提醒用的行程；缺少日期的資料無法歸類，直接略過。"""
    event_date = data.get("date")
    if not isinstance(event_date, str) or not event_date:
        return None

    start_time = data.get("startTime")
    end_time = data.get("endTime")
    # 舊資料只有 time 欄位，維持相容讀取
    legacy_time = data.get("time")

    display_time = "全天"
    sort_time = ""

    if isinstance(start_time, str) and start_time:
        sort_time = start_time
        if isinstance(end_time, str) and end_time:
            display_time = f"{start_time} ~ {end_time}"
        else:
            display_time = start_time
    elif isinstance(legacy_time, str) and legacy_time:
        sort_time = legacy_time
        display_time = legacy_time

    return {
        "date": event_date,
        "display_time": display_time,
        "title": data.get("title") or "未命名行程",
        "sort_time": sort_time,
    }


def sort_events(events: list[ScheduleEvent]) -> list[ScheduleEvent]:
    # 全天行程 sort_time 為空字串，會自然排在最前面
    return sorted(events, key=lambda e: (e["date"], e["sort_time"], e["title"]))


def format_date_label(day: date) -> str:
    return f"{day.month:02d}/{day.day:02d}（{WEEKDAY_NAMES[day.weekday()]}）"


def format_event(event: ScheduleEvent) -> str:
    # 時間與標題分兩行：標題過長時 LINE 的自動換行才不會把時間擠得難讀
    return f"🕒 {event['display_time']}\n　{event['title']}"


def build_tomorrow_message(events: list[ScheduleEvent], today: date) -> Optional[str]:
    """隔日提醒：只列明天的行程。"""
    tomorrow = today + timedelta(days=1)
    tomorrow_events = [e for e in sort_events(events) if e["date"] == tomorrow.isoformat()]
    if not tomorrow_events:
        return None

    return "\n".join(
        [
            "🌙 明日行程提醒",
            DIVIDER,
            f"📅 {format_date_label(tomorrow)}",
            "",
            "\n\n".join(format_event(e) for e in tomorrow_events),
            DIVIDER,
            "⏰ 記得設鬧鐘喔！",
        ]
    )


def build_weekly_message(events: list[ScheduleEvent], week_start: date) -> Optional[str]:
    """每週提醒：依日期分組列出整週（週一～週日）有行程的日子。"""
    week_end = week_start + timedelta(days=6)
    by_date: dict[str, list[ScheduleEvent]] = {}
    for event in sort_events(events):
        if week_start.isoformat() <= event["date"] <= week_end.isoformat():
            by_date.setdefault(event["date"], []).append(event)

    if not by_date:
        return None

    day_blocks: list[str] = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        day_events = by_date.get(day.isoformat())
        if not day_events:
            continue
        day_blocks.append(
            "\n".join([f"📅 {format_date_label(day)}", *(format_event(e) for e in day_events)])
        )

    total = sum(len(v) for v in by_date.values())
    return "\n".join(
        [
            "🗓️ 下週行程總覽",
            f"{week_start.month:02d}/{week_start.day:02d} ~ {week_end.month:02d}/{week_end.day:02d}　共 {total} 項",
            DIVIDER,
            "\n\n".join(day_blocks),
            DIVIDER,
            "祝大家有美好的一週 ✨",
        ]
    )


def fetch_events(start: date, end: date) -> list[ScheduleEvent]:
    """讀取 [start, end] 區間行程。失敗時直接拋出例外，讓 workflow 顯示失敗而非靜默略過。"""
    # 延遲載入，讓純格式化函式可在沒安裝 Firebase 套件的環境下測試
    import firebase_admin
    from firebase_admin import credentials, firestore

    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if not cred_json:
        raise RuntimeError("找不到 Firebase 金鑰，無法執行通知")

    firebase_admin.initialize_app(credentials.Certificate(json.loads(cred_json)))
    db = firestore.client()

    # 單欄位範圍查詢不需要建立複合索引
    query = (
        db.collection("schedules")
        .where("date", ">=", start.isoformat())
        .where("date", "<=", end.isoformat())
    )
    events: list[ScheduleEvent] = []
    for snapshot in query.stream():
        event = to_schedule_event(snapshot.to_dict() or {})
        if event:
            events.append(event)
    return events


def push_line_message(message: str) -> None:
    from linebot import LineBotApi
    from linebot.models import TextSendMessage

    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
    user_id = os.getenv("LINE_USER_ID")
    if not token or not user_id:
        raise RuntimeError("LINE Token 或 User ID 未設定")

    LineBotApi(token).push_message(user_id, TextSendMessage(text=message))


def seconds_until_send(now: datetime) -> float:
    """距離當天 SEND_AT（台灣時間，預設 22:00）還有幾秒；已超過就回傳 0 立刻發送。"""
    hour, minute = (int(part) for part in os.getenv("SEND_AT", "22:00").split(":"))
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return max(0.0, (target - now).total_seconds())


def wait_until_send_time() -> None:
    # GitHub 免費排程延遲不穩定：workflow 刻意提早啟動，再由腳本等到整點才發送。
    # 這樣只要延遲沒超過提早量，訊息都會準時；公開 repo 的 Actions 分鐘數免費，等待不計費。
    wait = seconds_until_send_time(datetime.now(ZoneInfo(TIMEZONE)))
    if wait > 0:
        print(f"提早啟動，等待 {int(wait // 60)} 分鐘後發送")
        time.sleep(wait)


def main() -> None:
    mode = os.getenv("NOTIFY_MODE", "tomorrow")
    if os.getenv("SEND_AT"):
        wait_until_send_time()
    today = datetime.now(ZoneInfo(TIMEZONE)).date()

    if mode == "weekly":
        # 週日晚上提醒「下週」：一律以下一個週一為起點（週日 +1 天即週一）
        week_start = today + timedelta(days=7 - today.weekday())
        message = build_weekly_message(
            fetch_events(week_start, week_start + timedelta(days=6)), week_start
        )
        empty_hint = "下週沒有行程，略過 LINE 推播"
    elif mode == "tomorrow":
        tomorrow = today + timedelta(days=1)
        message = build_tomorrow_message(fetch_events(tomorrow, tomorrow), today)
        empty_hint = "明天沒有行程，略過 LINE 推播"
    else:
        raise RuntimeError(f"未知的 NOTIFY_MODE: {mode}")

    if not message:
        print(empty_hint)
        return

    push_line_message(message)
    print(f"已送出提醒（模式：{mode}）")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"通知執行失敗: {error}", file=sys.stderr)
        raise SystemExit(1)
