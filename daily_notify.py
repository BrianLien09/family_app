import os
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timedelta
from linebot import LineBotApi
from linebot.models import TextSendMessage

# 1. 初始化 Firebase 連線
cred_json = os.getenv('FIREBASE_CREDENTIALS')

if cred_json:
    cred_dict = json.loads(cred_json)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print("❌ 找不到 Firebase 金鑰，無法連線")
    exit(1)

# LINE 設定
CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
USER_ID = os.getenv('LINE_USER_ID')

def get_schedule_from_firebase():
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    # 轉換日期格式 (例如 2026-01-18)
    today_str = str(today)
    tomorrow_str = str(tomorrow)
    
    # 用來暫存取出的行程物件
    events_list = []
    
    try:
        schedules_ref = db.collection('schedules')
        query = schedules_ref.where('date', 'in', [today_str, tomorrow_str])
        results = query.stream()
        
        for doc in results:
            event = doc.to_dict()
            title = event.get('title', '未命名行程')
            date_val = event.get('date')
            
            # --- 處理時間 (支援新舊格式) ---
            start_time = event.get('startTime')
            end_time = event.get('endTime')
            old_time = event.get('time')
            
            # 決定顯示的時間字串與排序時間
            display_time = "全天"
            sort_time = ""

            if start_time:
                # 新格式：有 startTime
                sort_time = start_time
                if end_time:
                    display_time = f"{start_time} ~ {end_time}"
                else:
                    display_time = start_time
            elif old_time:
                # 舊格式：只有 time
                sort_time = old_time
                display_time = old_time
            
            # 如果都沒抓到，維持預設的 "全天" 與空字串排序
            
            events_list.append({
                "date": date_val,
                "display_time": display_time,
                "title": title,
                "sort_time": sort_time
            })

    except Exception as e:
        print(f"讀取 Firebase 出錯: {e}")
        return None

    if not events_list:
        return None

    # --- 排序 ---
    # 先依照日期排，再依照時間排
    events_list.sort(key=lambda x: (x['date'], x['sort_time']))

    # --- 溫馨管家風格設定 ---
    today_msgs = []
    tomorrow_msgs = []

    for e in events_list:
        # 統一格式： 🔹 時間｜標題
        line = f"🔹 {e['display_time']}｜{e['title']}"
        
        if e['date'] == today_str:
            today_msgs.append(line)
        elif e['date'] == tomorrow_str:
            tomorrow_msgs.append(line)

    # --- 組合最終訊息 ---
    
    # 1. 開頭問候語
    final_text = "Hi 大家晚安，我是小管家 🤖\n今天辛苦了！來看看明天的行程吧～\n\n"
    
    # 2. 明日行程 (重點顯示)
    if tomorrow_msgs:
        final_text += f"📅 {tomorrow_str} (明天)\n"
        final_text += "\n".join(tomorrow_msgs) + "\n\n"
    else:
        final_text += f"📅 {tomorrow_str} (明天)\n🔹 無特別行程，好好休息！\n\n"

    # 3. 今日回顧 (有的話才顯示，不想顯示也可以刪除這段)
    if today_msgs:
        final_text += f"📅 {today_str} (今天已完成)\n"
        final_text += "\n".join(today_msgs) + "\n\n"
        
    # 4. 結尾提醒
    final_text += "記得設鬧鐘喔！⏰"

    return final_text

def main():
    if not CHANNEL_ACCESS_TOKEN or not USER_ID:
        print("❌ LINE Token 或 User ID 未設定")
        return

    msg_text = get_schedule_from_firebase()
    
    if msg_text:
        line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
        line_bot_api.push_message(USER_ID, TextSendMessage(text=msg_text))
        print("✅ 訊息發送成功")
    else:
        print("🍵 無近期行程")

if __name__ == "__main__":
    main()