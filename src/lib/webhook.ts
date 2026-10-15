export type MessageDraft = { webhook: string; content: string; username: string; threadId: string; files: File[] };
export type WebhookErrorCode = 'invalidUrl' | 'notDiscord' | 'emptyMessage' | 'tooManyFiles' | 'contentTooLong' | 'nameTooLong' | 'invalidThread' | 'invalidUrlThread' | 'network' | 'tooLarge' | 'rateLimited' | 'rateLimitedUnknown' | 'unavailable' | 'rejected' | 'http' | 'unconfirmed' | 'unexpected';

export class WebhookError extends Error {
  constructor(public code: WebhookErrorCode, public field?: keyof MessageDraft, public value?: number) { super(code); }
}

export function prepareMessage(draft: MessageDraft) {
  let url: URL;
  try { url = new URL(draft.webhook.trim()); }
  catch { throw new WebhookError('invalidUrl', 'webhook'); }
  if (url.protocol !== 'https:' || !['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com'].includes(url.hostname)
    || url.port || url.username || url.password || !/^\/api\/(?:v\d+\/)?webhooks\/\d+\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) {
    throw new WebhookError('notDiscord', 'webhook');
  }
  if (!draft.content.trim() && !draft.files.length) throw new WebhookError('emptyMessage', 'content');
  if (draft.files.length > 10) throw new WebhookError('tooManyFiles', 'files');
  if (draft.content.length > 2000) throw new WebhookError('contentTooLong', 'content');
  if (draft.username.trim().length > 80) throw new WebhookError('nameTooLong', 'username');
  if (draft.threadId.trim() && !/^\d{17,20}$/.test(draft.threadId.trim())) throw new WebhookError('invalidThread', 'threadId');
  const threadId = draft.threadId.trim() || url.searchParams.get('thread_id');
  if (threadId && !/^\d{17,20}$/.test(threadId)) throw new WebhookError('invalidUrlThread', 'threadId');
  url.search = '';
  url.hash = '';
  url.searchParams.set('wait', 'true');
  if (threadId) url.searchParams.set('thread_id', threadId);
  return {
    url: url.href,
    payload: {
      content: draft.content,
      ...(draft.username.trim() ? { username: draft.username.trim() } : {}),
      allowed_mentions: { parse: [] },
      ...(draft.files.length ? { attachments: draft.files.map((file, id) => ({ id, filename: file.name })) } : {}),
    },
  };
}

export async function sendMessage(draft: MessageDraft) {
  const { url, payload } = prepareMessage(draft);
  let body: string | FormData = JSON.stringify(payload);
  if (draft.files.length) {
    const multipart = new FormData();
    multipart.append('payload_json', body);
    draft.files.forEach((file, id) => multipart.append(`files[${id}]`, file, file.name));
    body = multipart;
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: draft.files.length ? undefined : { 'Content-Type': 'application/json' },
      body,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      signal: draft.files.length ? undefined : AbortSignal.timeout(20000),
    });
  } catch {
    throw new WebhookError('network');
  }
  if (!response.ok) {
    if (response.status === 413) throw new WebhookError('tooLarge', 'files');
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const seconds = Number(data.retry_after);
      throw new WebhookError(Number.isFinite(seconds) && seconds > 0 ? 'rateLimited' : 'rateLimitedUnknown', undefined, Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined);
    }
    if ([401, 403, 404].includes(response.status)) throw new WebhookError('unavailable', 'webhook');
    if (response.status === 400) {
      const data = await response.json().catch(() => ({}));
      if (data.code === 40005) throw new WebhookError('tooLarge', 'files');
      throw new WebhookError('rejected');
    }
    throw new WebhookError('http', undefined, response.status);
  }
  const message = await response.json().catch(() => null);
  if (!message || typeof message.id !== 'string') throw new WebhookError('unconfirmed');
  return message.id as string;
}
