import { test, expect } from 'bun:test';
import { prepareMessage } from './webhook';

test('Webhook boundary rejects foreign destinations and preserves safe Discord payloads', () => {
  const draft = { webhook: 'https://discord.com/api/webhooks/123456789012345678/test_token?thread_id=123456789012345679', content: '  @everyone\n你好 👋  ', username: ' 社群公告 ', threadId: '', files: [] as File[] };
  const result = prepareMessage(draft);
  expect(new URL(result.url).searchParams.get('wait')).toBe('true');
  expect(new URL(result.url).searchParams.get('thread_id')).toBe('123456789012345679');
  expect(result.payload).toEqual({ content: draft.content, username: '社群公告', allowed_mentions: { parse: [] } });
  for (const webhook of ['https://discord.com.evil.example/api/webhooks/123/token', 'http://discord.com/api/webhooks/123/token', 'https://discord.com@evil.example/api/webhooks/123/token', 'https://discord.com/api/webhooks/123/token/messages/456', 'https://discord.com:444/api/webhooks/123/token']) {
    expect(() => prepareMessage({ ...draft, webhook })).toThrow();
  }
  for (const content of ['', ' \n ', 'a'.repeat(2001)]) expect(() => prepareMessage({ ...draft, content })).toThrow();
  expect(prepareMessage({ ...draft, content: 'a'.repeat(2000) }).payload.content).toBe('a'.repeat(2000));
  expect(() => prepareMessage({ ...draft, threadId: 'abc' })).toThrow();
  expect(() => prepareMessage({ ...draft, username: 'a'.repeat(81) })).toThrow();
});

test('Attachments allow file-only messages, retain order and reject more than ten files', () => {
  const files = [new File(['image bytes'], '圖片.png', { type: 'image/png' }), new File(['video bytes'], '影片.mp4', { type: 'video/mp4' }), new File(['document'], 'report.pdf', { type: 'application/pdf' })];
  const draft = { webhook: 'https://discord.com/api/webhooks/123456789012345678/test_token', content: '', username: '', threadId: '', files };
  expect(prepareMessage(draft).payload.attachments).toEqual([
    { id: 0, filename: '圖片.png' }, { id: 1, filename: '影片.mp4' }, { id: 2, filename: 'report.pdf' },
  ]);
  expect(() => prepareMessage({ ...draft, files: [] })).toThrow();
  expect(prepareMessage({ ...draft, files: Array(10).fill(files[0]) }).payload.attachments).toHaveLength(10);
  expect(() => prepareMessage({ ...draft, files: Array(11).fill(files[0]) })).toThrow();
});
