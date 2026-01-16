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
    
    today_str = str(today)
    tomorrow_str = str(tomorrow)
    
    # 用來暫存取出的行程物件 (為了之後要排序)
    events_list = []
    
    try:
        schedules_ref = db.collection('schedules')
        query = schedules_ref.where('date', 'in', [today_str, tomorrow_str])
        results = query.stream()
        
        for doc in results:
            event = doc.to_dict()
            title = event.get('title', '未命名行程')
            date_val = event.get('date')
            
            # --- 處理時間 ---
            # 判斷時間是否為空 (None 或 空字串)
            raw_time = event.get('time')
            
            if not raw_time:  # 如果是空的
                display_time = "全天"
                is_all_day = True
                sort_time = "" # 排序用：空字串會排在最前面
            else:
                display_time = raw_time
                is_all_day = False
                sort_time = raw_time
            
            # 先存成物件，等等排序用
            events_list.append({
                "date": date_val,
                "display_time": display_time,
                "title": title,
                "is_all_day": is_all_day,
                "sort_time": sort_time
            })

    except Exception as e:
        print(f"讀取 Firebase 出錯: {e}")
        return None

    if not events_list:
        return None

    # --- 排序 ---
    # 先依照日期排，如果日期一樣，再依照時間排 (全天會排在最上面)
    events_list.sort(key=lambda x: (x['date'], x['sort_time']))

    # --- 極簡幾何風格 ---
    today_msgs = []
    tomorrow_msgs = []

    for e in events_list:
        # 今天的行程 (用實心方塊 ▪️)
        if e['date'] == today_str:
            today_msgs.append(f"▪️ {e['display_time']} {e['title']}")
            
        # 明天的行程 (用空心方塊 ▫️)
        elif e['date'] == tomorrow_str:
            tomorrow_msgs.append(f"▫️ {e['display_time']} {e['title']}")

    # 組合最終訊息 (標題也改簡單一點)
    final_text = f"🌙 【晚安提醒】 {today_str}\n\n"
    
    if tomorrow_msgs:
        # 標題不用 Emoji 了
        final_text += f"[明天] {tomorrow_str}\n" + "\n".join(tomorrow_msgs) + "\n\n"
    else:
        final_text += f"[明天] 無特別行程\n\n"
        
    if today_msgs:
        # 標題不用 Emoji 了
        final_text += f"[今天] 已完成\n" + "\n".join(today_msgs)
        
    final_text += "\n\n大家早點休息，晚安！😴"
    
    # ⚠️ 關鍵修正：必須要把組合好的文字傳回去！
    return final_text

def main():
    if not CHANNEL_ACCESS_TOKEN or not USER_ID:
        print("❌ LINE Token 或 User ID 未設定")
        return

    msg_text = get_schedule_from_firebase()
    
    if msg_text:
        line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
        # 注意：這邊原本的 header 我移除了，因為 function 裡面已經有「晚安提醒」的標題了，避免重複
        line_bot_api.push_message(USER_ID, TextSendMessage(text=msg_text))
        print("✅ 訊息發送成功")
    else:
        print("🍵 無近期行程")

if __name__ == "__main__":
    main()