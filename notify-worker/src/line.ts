export async function pushLineMessage(
  token: string,
  userId: string,
  message: string,
): Promise<void> {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text: message }] }),
  });
  // 非 2xx 一定要拋錯，否則推播失敗時 Cloudflare 會顯示成功
  if (!response.ok) throw new Error(`LINE 推播失敗：${response.status} ${await response.text()}`);
}
