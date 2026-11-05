import { toScheduleEvent, type ScheduleEvent } from './messages';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface FirestoreDocument {
  fields?: Record<string, { stringValue?: string }>;
}

interface RunQueryRow {
  document?: FirestoreDocument;
}

interface TokenResponse {
  access_token?: string;
}

const DATASTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

function base64Url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Workers 沒有 firebase-admin，改用服務帳戶 JWT 換取 OAuth token 後走 Firestore REST
async function fetchAccessToken(account: ServiceAccount): Promise<string> {
  const tokenUri = account.token_uri ?? DEFAULT_TOKEN_URI;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: DATASTORE_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64Url(signature)}`,
    }),
  });
  if (!response.ok) throw new Error(`取得 Google Token 失敗：${response.status}`);

  const { access_token: token } = (await response.json()) as TokenResponse;
  if (!token) throw new Error('Google Token 回應缺少 access_token');
  return token;
}

function dateFilter(op: string, value: string) {
  return { fieldFilter: { field: { fieldPath: 'date' }, op, value: { stringValue: value } } };
}

/** 讀取 [start, end] 區間行程。失敗時拋出例外，讓 Cloudflare 記錄為失敗而非靜默略過。 */
export async function fetchEvents(
  credentialsJson: string,
  start: string,
  end: string,
): Promise<ScheduleEvent[]> {
  const account = JSON.parse(credentialsJson) as ServiceAccount;
  const token = await fetchAccessToken(account);

  // 單欄位範圍查詢不需要建立複合索引
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'schedules' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                dateFilter('GREATER_THAN_OR_EQUAL', start),
                dateFilter('LESS_THAN_OR_EQUAL', end),
              ],
            },
          },
        },
      }),
    },
  );
  if (!response.ok) throw new Error(`Firestore 查詢失敗：${response.status}`);

  const rows = (await response.json()) as RunQueryRow[];
  const events: ScheduleEvent[] = [];
  for (const row of rows) {
    // 查無資料時 REST 只回傳 readTime，沒有 document
    if (!row.document?.fields) continue;
    const data: Record<string, string | undefined> = {};
    for (const [name, field] of Object.entries(row.document.fields)) {
      data[name] = field.stringValue;
    }
    const event = toScheduleEvent(data);
    if (event) events.push(event);
  }
  return events;
}
