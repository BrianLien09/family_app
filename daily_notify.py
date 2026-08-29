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


class RestockReminder(TypedDict):
    doc_id: str
    name: str
    target_interval_days: int
    effective_interval_days: int
    predicted_due_date: str
    overdue_days: int
    note: str


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


def calculate_average_interval_days(purchase_dates: list[str]) -> Optional[int]:
    if len(purchase_dates) < 2:
        return None

    intervals: list[int] = []
    for index in range(1, len(purchase_dates)):
        current_date = date.fromisoformat(purchase_dates[index])
        previous_date = date.fromisoformat(purchase_dates[index - 1])
        interval_days = (current_date - previous_date).days
        if interval_days > 0:
            intervals.append(interval_days)

    if not intervals:
        return None

    return max(1, round(sum(intervals) / len(intervals)))


def get_effective_interval_days(target_interval_days: int, purchase_dates: list[str]) -> int:
    average_interval_days = calculate_average_interval_days(purchase_dates)
    normalized_target_interval = max(1, target_interval_days)

    if average_interval_days is None:
        return normalized_target_interval

    return max(1, round((average_interval_days * 0.7) + (normalized_target_interval * 0.3)))


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


def get_due_restock_items(reference_date: date) -> list[RestockReminder]:
    reminders: list[RestockReminder] = []

    try:
        for snapshot in db.collection("restockItems").stream():
            item = snapshot.to_dict()
            name = item.get("name", zh("\\u672a\\u547d\\u540d\\u7269\\u54c1"))
            last_purchased_on = item.get("lastPurchasedOn")

            if not isinstance(last_purchased_on, str) or not last_purchased_on:
                continue

            purchase_history = item.get("purchaseHistory", [])
            purchase_dates = sorted(
                {
                    entry.get("purchasedOn")
                    for entry in purchase_history
                    if isinstance(entry, dict) and isinstance(entry.get("purchasedOn"), str)
                }
                | {last_purchased_on}
            )

            target_interval_days = item.get("targetIntervalDays", 30)
            if not isinstance(target_interval_days, int) or target_interval_days < 1:
                target_interval_days = 30

            effective_interval_days = get_effective_interval_days(target_interval_days, purchase_dates)
            predicted_due_date = date.fromisoformat(last_purchased_on) + timedelta(days=effective_interval_days)
            predicted_due_date_str = predicted_due_date.isoformat()
            overdue_days = (reference_date - predicted_due_date).days

            if overdue_days < 0:
                continue

            last_notified_due_on = item.get("lastNotifiedDueOn", "")
            if last_notified_due_on == predicted_due_date_str:
                continue

            note = item.get("note", "")
            reminders.append(
                {
                    "doc_id": snapshot.id,
                    "name": name,
                    "target_interval_days": target_interval_days,
                    "effective_interval_days": effective_interval_days,
                    "predicted_due_date": predicted_due_date_str,
                    "overdue_days": overdue_days,
                    "note": note if isinstance(note, str) else "",
                }
            )
    except Exception as error:
        message = zh("\\u8b80\\u53d6\\u88dc\\u8ca8\\u8cc7\\u6599\\u5931\\u6557")
        print(f"{message}: {error}")

    reminders.sort(key=lambda reminder: (reminder["predicted_due_date"], reminder["name"]))
    return reminders


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


def build_restock_section(reminders: list[RestockReminder]) -> str:
    lines = [zh("\\U0001f9fb \\u88dc\\u8ca8\\u63d0\\u9192")]
    predicted_date_label = zh("\\u63a8\\u7b97\\u65e5")
    smart_frequency_label = zh("\\u667a\\u6167\\u983b\\u7387")
    day_label = zh("\\u5929")
    note_label = zh("\\u5099\\u8a3b\\uff1a")

    for reminder in reminders:
        status = (
            zh("\\u4eca\\u5929\\u5dee\\u4e0d\\u591a\\u8a72\\u88dc\\u8ca8")
            if reminder["overdue_days"] == 0
            else zh(f"\\u5df2\\u8d85\\u904e {reminder['overdue_days']} \\u5929")
        )

        lines.append(
            f"\U0001f539 {reminder['name']}\uff5c{status}\uff5c"
            f"{predicted_date_label} {reminder['predicted_due_date']}\uff5c"
            f"{smart_frequency_label} {reminder['effective_interval_days']} {day_label}"
        )

        if reminder["note"]:
            lines.append(f"  {note_label}{reminder['note']}")

    return "\n".join(lines)


def build_message(reference_date: date) -> tuple[Optional[str], list[RestockReminder]]:
    schedule_section = build_schedule_section(get_schedule_events(reference_date), reference_date)
    reminders = get_due_restock_items(reference_date)

    if not schedule_section and not reminders:
        return None, []

    if schedule_section:
        intro = zh("\\u0048\\u0069 \\u5927\\u5bb6\\u665a\\u5b89\\uff0c\\u6211\\u662f\\u5c0f\\u7ba1\\u5bb6 \\U0001f916\\n\\u4eca\\u5929\\u8f9b\\u82e6\\u4e86\\uff01\\u4f86\\u770b\\u770b\\u660e\\u5929\\u7684\\u884c\\u7a0b\\u5427\\uff5e")
    else:
        intro = zh("\\u0048\\u0069 \\u5927\\u5bb6\\u665a\\u5b89\\uff0c\\u6211\\u662f\\u5c0f\\u7ba1\\u5bb6 \\U0001f916\\n\\u4eca\\u5929\\u8f9b\\u82e6\\u4e86\\uff01\\u4f86\\u770b\\u770b\\u88dc\\u8ca8\\u63d0\\u9192\\u5427\\uff5e")

    sections = [intro]

    if schedule_section:
        sections.append(schedule_section)

    if reminders:
        sections.append(build_restock_section(reminders))

    sections.append(zh("\\u8a18\\u5f97\\u8a2d\\u9b27\\u9418\\u5594\\uff01\\u23f0"))

    return "\n\n".join(sections), reminders


def mark_reminders_as_sent(reminders: list[RestockReminder]) -> None:
    for reminder in reminders:
        try:
            db.collection("restockItems").document(reminder["doc_id"]).update(
                {
                    "lastNotifiedDueOn": reminder["predicted_due_date"],
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                }
            )
        except Exception as error:
            message = zh("\\u66f4\\u65b0\\u63d0\\u9192\\u72c0\\u614b\\u5931\\u6557")
            print(f"{message} ({reminder['name']}): {error}")


def main() -> None:
    if not CHANNEL_ACCESS_TOKEN or not USER_ID:
        print(zh("\\u004c\\u0049\\u004e\\u0045 Token \\u6216 User ID \\u672a\\u8a2d\\u5b9a"))
        return

    today = datetime.now(ZoneInfo("Asia/Taipei")).date()
    message, reminders = build_message(today)

    if not message:
        print(zh("\\u4eca\\u5929\\u6c92\\u6709\\u9700\\u8981\\u9001\\u51fa\\u7684\\u88dc\\u8ca8\\u63d0\\u9192\\uff0c\\u7565\\u904e LINE \\u63a8\\u64ad"))
        return

    try:
        line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
        line_bot_api.push_message(USER_ID, TextSendMessage(text=message))
        mark_reminders_as_sent(reminders)
        if reminders:
            print(zh(f"\\u5df2\\u9001\\u51fa {len(reminders)} \\u7b46\\u88dc\\u8ca8\\u63d0\\u9192\\uff0c\\u4e26\\u5408\\u4f75\\u4eca\\u65e5\\u8207\\u660e\\u65e5\\u884c\\u7a0b"))
        else:
            print(zh("\\u5df2\\u9001\\u51fa\\u4eca\\u65e5\\u8207\\u660e\\u65e5\\u884c\\u7a0b\\u63d0\\u9192"))
    except Exception as error:
        message = zh("\\u004c\\u0049\\u004e\\u0045 \\u63a8\\u64ad\\u5931\\u6557")
        print(f"{message}: {error}")


if __name__ == "__main__":
    main()
