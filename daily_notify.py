import json
import os
from datetime import date, datetime, timedelta
from typing import Optional, TypedDict
from zoneinfo import ZoneInfo

import firebase_admin
from firebase_admin import credentials, firestore
from linebot import LineBotApi
from linebot.models import TextSendMessage


class ScheduleEvent(TypedDict):
    date: str
    display_time: str
    title: str
    sort_time: str


def zh(text: str) -> str:
    return text.encode("utf-8").decode("unicode_escape")


cred_json = os.getenv("FIREBASE_CREDENTIALS")

if not cred_json:
    print(zh("\\u627e\\u4e0d\\u5230 Firebase \\u91d1\\u9470\\uff0c\\u7121\\u6cd5\\u57f7\\u884c\\u901a\\u77e5"))
    raise SystemExit(1)

cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
USER_ID = os.getenv("LINE_USER_ID")


def get_schedule_events(reference_date: date) -> list[ScheduleEvent]:
    today_str = reference_date.isoformat()
    tomorrow_str = (reference_date + timedelta(days=1)).isoformat()
    events: list[ScheduleEvent] = []

    try:
        query = db.collection("schedules").where("date", "in", [today_str, tomorrow_str])
        for snapshot in query.stream():
            event = snapshot.to_dict()
            title = event.get("title", zh("\\u672a\\u547d\\u540d\\u884c\\u7a0b"))
            event_date = event.get("date")

            start_time = event.get("startTime")
            end_time = event.get("endTime")
            legacy_time = event.get("time")

            display_time = zh("\\u5168\\u5929")
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

            if isinstance(event_date, str):
                events.append(
                    {
                        "date": event_date,
                        "display_time": display_time,
                        "title": title,
                        "sort_time": sort_time,
                    }
                )
    except Exception as error:
        message = zh("\\u8b80\\u53d6\\u884c\\u7a0b\\u8cc7\\u6599\\u5931\\u6557")
        print(f"{message}: {error}")

    events.sort(key=lambda event: (event["date"], event["sort_time"], event["title"]))
    return events


def build_schedule_section(events: list[ScheduleEvent], reference_date: date) -> str:
    if not events:
        return ""

    today_str = reference_date.isoformat()
    tomorrow_str = (reference_date + timedelta(days=1)).isoformat()

    today_lines: list[str] = []
    tomorrow_lines: list[str] = []

    for event in events:
        line = f"\U0001f539 {event['display_time']}\uff5c{event['title']}"
        if event["date"] == today_str:
            today_lines.append(line)
        elif event["date"] == tomorrow_str:
            tomorrow_lines.append(line)

    sections: list[str] = []

    if tomorrow_lines:
        sections.append(
            "\n".join(
                [
                    zh(f"\\U0001f4c5 {tomorrow_str} (\\u660e\\u5929)"),
                    *tomorrow_lines,
                ]
            )
        )

    if today_lines:
        sections.append(
            "\n".join(
                [
                    zh(f"\\U0001f4c5 {today_str} (\\u4eca\\u5929\\u5df2\\u5b8c\\u6210)"),
                    *today_lines,
                ]
            )
        )

    return "\n\n".join(sections)


def build_message(reference_date: date) -> Optional[str]:
    schedule_section = build_schedule_section(get_schedule_events(reference_date), reference_date)
    if not schedule_section:
        return None
    return '\n\n'.join([
        'Hi 大家晚安，我是小管家 🤖\n今天辛苦了！來看看明天的行程吧～',
        schedule_section,
        '記得設鬧鐘喔！⏰',
    ])


def main() -> None:
    if not CHANNEL_ACCESS_TOKEN or not USER_ID:
        print('LINE Token 或 User ID 未設定')
        return
    today = datetime.now(ZoneInfo('Asia/Taipei')).date()
    message = build_message(today)
    if not message:
        print('今天與明天沒有行程，略過 LINE 推播')
        return
    try:
        line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
        line_bot_api.push_message(USER_ID, TextSendMessage(text=message))
        print('已送出今日與明日行程提醒')
    except Exception as error:
        print(f'LINE 推播失敗: {error}')


if __name__ == '__main__':
    main()