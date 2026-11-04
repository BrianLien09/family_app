import sys
import unittest
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import daily_notify as dn


def make_event(day, start=None, end=None, title="測試"):
    data = {"date": day, "title": title}
    if start:
        data["startTime"] = start
    if end:
        data["endTime"] = end
    return dn.to_schedule_event(data)


class TomorrowMessageTest(unittest.TestCase):
    def test_只列明天且不含今天已完成(self):
        events = [
            make_event("2026-11-02", "10:00", "11:30", "期中開書考"),
            make_event("2026-11-03", "09:00", "10:00", "洗牙"),
            make_event("2026-11-03", title="繳費"),
        ]
        msg = dn.build_tomorrow_message(events, date(2026, 11, 2))
        self.assertIn("11/03（二）", msg)
        self.assertNotIn("期中開書考", msg)
        self.assertNotIn("已完成", msg)
        # 全天行程排在有時間的行程之前
        self.assertLess(msg.index("繳費"), msg.index("洗牙"))
        print("\n" + msg)

    def test_明天沒行程回傳None(self):
        events = [make_event("2026-11-02", "10:00")]
        self.assertIsNone(dn.build_tomorrow_message(events, date(2026, 11, 2)))


class WeeklyMessageTest(unittest.TestCase):
    def test_依日期分組且排除範圍外(self):
        events = [
            make_event("2026-11-08", "08:00", title="週日班"),
            make_event("2026-11-02", "10:00", "11:30", "期中開書考"),
            make_event("2026-11-09", "08:00", title="下週"),
            make_event("2026-11-02", title="全天事項"),
        ]
        msg = dn.build_weekly_message(events, date(2026, 11, 2))
        self.assertIn("共 3 項", msg)
        self.assertNotIn("下週", msg)
        self.assertLess(msg.index("11/02（一）"), msg.index("11/08（日）"))
        self.assertLess(msg.index("全天事項"), msg.index("期中開書考"))
        print("\n" + msg)

    def test_整週沒行程回傳None(self):
        self.assertIsNone(dn.build_weekly_message([], date(2026, 11, 2)))


class SendTimeTest(unittest.TestCase):
    def test_提早啟動會等到2200_已過則立刻發送(self):
        tz = ZoneInfo("Asia/Taipei")
        self.assertEqual(dn.seconds_until_send(datetime(2026, 11, 4, 16, 10, tzinfo=tz)), 5 * 3600 + 50 * 60)
        self.assertEqual(dn.seconds_until_send(datetime(2026, 11, 4, 22, 40, tzinfo=tz)), 0)


class ParseEventTest(unittest.TestCase):
    def test_舊版time欄位與缺日期(self):
        legacy = dn.to_schedule_event({"date": "2026-11-02", "time": "18:00", "title": "聚餐"})
        self.assertEqual(legacy["display_time"], "18:00")
        self.assertIsNone(dn.to_schedule_event({"title": "沒日期"}))


if __name__ == "__main__":
    unittest.main()
