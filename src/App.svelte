<script lang="ts">
  import { Send, Webhook, MessageSquare, ArrowUpRight, ShieldCheck, CircleHelp, ChevronRight, Hash, Eye, EyeOff, Code2, LockKeyhole, Check, X, SlidersHorizontal, RotateCcw, CornerDownLeft, Paperclip, FileText, Film, LoaderCircle } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.ts';
  import { Input } from '$lib/components/ui/input/index.ts';
  import { Textarea } from '$lib/components/ui/textarea/index.ts';
  import { sendMessage, WebhookError } from '$lib/webhook.ts';
  import { messages, resolveLocale, type Locale } from '$lib/i18n.ts';

  let locale = $state<Locale>(resolveLocale(null, navigator.languages));
  try { locale = resolveLocale(localStorage.getItem('webhook-studio.locale'), navigator.languages); } catch { /* Storage may be disabled by browser privacy settings. */ }
  const t = $derived(messages[locale]);
  const numbers = $derived(new Intl.NumberFormat(locale));
  const sizes = $derived(new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  let keyboardAction = $state(false);
  $effect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    document.title = t.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
    try { localStorage.setItem('webhook-studio.locale', locale); } catch { /* Language switching still works without storage. */ }
  });

  let webhook = $state('');
  try { webhook = localStorage.getItem('webhook-studio.webhook') || ''; } catch { /* Sending still works without storage. */ }
  $effect(() => {
    try {
      if (webhook) localStorage.setItem('webhook-studio.webhook', webhook);
      else localStorage.removeItem('webhook-studio.webhook');
    } catch { /* Storage may be disabled by browser privacy settings. */ }
  });
  let content = $state('');
  let username = $state('');
  let threadId = $state('');
  let files = $state<File[]>([]);
  let dragging = $state(false);
  let imageUrls = $state<string[]>([]);
  let reveal = $state(false);
  let sending = $state(false);
  let advanced = $state(false);
  let preview = $state('message');
  let error = $state<WebhookError | null>(null);
  const errorField = $derived(error?.field);
  const errorText = $derived(error ? t.errors[error.code].replace('{value}', error.value === undefined ? '' : numbers.format(error.value)) : '');
  let success = $state('');
  let help: HTMLDialogElement;
  const payload = $derived(JSON.stringify({ content, ...(username.trim() ? { username: username.trim() } : {}), allowed_mentions: { parse: [] }, ...(files.length ? { attachments: files.map((file, id) => ({ id, filename: file.name })) } : {}) }, null, 2));

  $effect(() => {
    const urls = files.map(file => file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    imageUrls = urls;
    return () => { for (const url of urls) if (url) URL.revokeObjectURL(url); };
  });

  function addFiles(selected: FileList | null | undefined) {
    if (sending || !selected?.length) return;
    files = [...files, ...Array.from(selected)];
    success = '';
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (sending) return;
    error = null; success = '';
    sending = true;
    try {
      const id = await sendMessage({ webhook, content, username, threadId, files });
      success = id;
      content = '';
      files = [];
    } catch (cause) {
      error = cause instanceof WebhookError ? cause : new WebhookError('unexpected');
      if (errorField === 'threadId' || errorField === 'username') advanced = true;
    } finally {
      sending = false;
    }
    await tick();
    if (errorField) {
      const field = document.getElementById(errorField);
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: 'center', behavior: 'instant' });
    } else if (error || success) {
      document.getElementById(error ? 'form-error' : 'send-result')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }
</script>

<svelte:window onpointerdown={() => keyboardAction = false} onkeydown={(event) => {
  keyboardAction = true;
  if (!help?.open && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    document.querySelector<HTMLFormElement>('#message-form')?.requestSubmit();
  }
}} />

{#snippet fieldError(field: NonNullable<WebhookError['field']>)}
  {#if errorField === field}
    <p id={`${field}-error`} class="field-error"><X size={14} aria-hidden="true" /><span>{errorText}</span></p>
  {/if}
{/snippet}

<a class="skip-link" href="#main">{t.skip}</a>
<div class="app-shell dark" class:keyboard-action={keyboardAction}>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="./" aria-label={t.home}>
        <span class="brand-mark"><Webhook size={22} strokeWidth={1.8} /></span>
        <span>webhook<span class="brand-light">studio</span><span class="brand-dot">.</span></span>
      </a>
      <nav class="topbar-actions" aria-label={t.navigation}>
        <Button variant="ghost" class="help-button" onclick={() => help.showModal()}><CircleHelp size={16} />{t.help}</Button>
        <a class="docs-link" href={t.docsUrl} target="_blank" rel="noreferrer">{t.docs}<ArrowUpRight size={14} /></a>
        <label class="language-control"><span class="sr-only">{t.language}</span><select id="locale" name="locale" bind:value={locale}><option value="en" lang="en">EN</option><option value="zh-Hant" lang="zh-Hant">繁中</option></select></label>
      </nav>
    </div>
  </header>
    <main id="main" tabindex="-1">
      <div class="page-heading">
        <div><h1>{t.heading}</h1><p>{t.subtitle}</p></div>
      </div>

      <div class="studio-grid">
        <form id="message-form" onsubmit={submit} novalidate aria-busy={sending}>
          <fieldset disabled={sending}>
            <section class="panel destination-panel" aria-labelledby="destination-title">
              <div class="panel-heading"><div><h2 id="destination-title">{t.destination}</h2></div><span class="required-label">{t.required}</span></div>
              <div class="panel-body">
                <label for="webhook">{t.webhook} <span class="required-star">*</span></label>
                <div class="secret-input"><Input id="webhook" name="webhook" type={reveal ? 'text' : 'password'} bind:value={webhook} placeholder="https://discord.com/api/webhooks/…" autocomplete="off" spellcheck={false} aria-invalid={errorField === 'webhook'} aria-describedby={errorField === 'webhook' ? 'webhook-error webhook-hint' : 'webhook-hint'} /><Button variant="ghost" size="icon" class="reveal-button" aria-label={reveal ? t.hideWebhook : t.showWebhook} aria-pressed={reveal} onclick={() => reveal = !reveal}><span class="icon-swap" class:on={reveal} aria-hidden="true"><Eye size={16} /><EyeOff size={16} /></span></Button></div>
                {@render fieldError('webhook')}
                <p class="field-hint" id="webhook-hint"><LockKeyhole size={12} />{t.tokenHint}</p>
                <details class="destination-help"><summary>{t.getWebhook}</summary><p>{t.channelInstructions}</p><p>{t.channelNote}</p></details>
              </div>
            </section>

            <section class="panel message-panel" aria-labelledby="message-title">
              <div class="panel-heading"><div><h2 id="message-title">{t.compose}</h2></div><div class="compose-actions"><a class="preview-jump" href="#message-preview"><Eye size={15} />{t.viewPreview}</a><Button variant="ghost" class="example-button" onclick={() => { content = t.example; success = ''; }}>{t.exampleButton}<ArrowUpRight size={13} /></Button></div></div>
              <div class="panel-body">
                <div class="label-row"><label for="content">{t.content} <span class="optional">{t.attachmentsOnly}</span></label><span class="format-label">{t.markdown}</span></div>
                <Textarea id="content" name="content" bind:value={content} placeholder={t.contentPlaceholder} maxlength={2000} aria-invalid={errorField === 'content'} aria-describedby={errorField === 'content' ? 'content-error content-hint' : 'content-hint'} />
                {@render fieldError('content')}
                <div class="editor-footer" id="content-hint"><span><ShieldCheck size={13} />{t.mentionsHint}</span><span class:near-limit={content.length > 1900}>{numbers.format(content.length)} <span class="count-limit">/ {numbers.format(2000)}</span></span></div>
                <div class="attachment-section">
                  <div class="label-row"><label for="file-input"><Paperclip size={14} />{t.attachments}</label><span class="format-label" role="status">{t.fileCount(numbers.format(files.length))}</span></div>
                  <input id="file-input" name="files" type="file" multiple hidden onchange={(event) => {
                    addFiles(event.currentTarget.files);
                    event.currentTarget.value = '';
                  }} />
                  <Button id="files" variant="outline" class="choose-files" data-dragging={dragging} aria-invalid={errorField === 'files'} aria-describedby={errorField === 'files' ? 'files-error attachment-hint' : 'attachment-hint'} onclick={() => document.getElementById('file-input')?.click()}
                    ondragover={(event) => {
                      if (!event.dataTransfer?.types.includes('Files')) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = sending ? 'none' : 'copy';
                      dragging = !sending;
                    }}
                    ondragleave={() => dragging = false}
                    ondrop={(event) => {
                      event.preventDefault();
                      dragging = false;
                      addFiles(event.dataTransfer?.files);
                    }}><Paperclip size={15} />{t.chooseFiles}</Button>
                  {@render fieldError('files')}
                  <p class="field-hint" id="attachment-hint">{t.attachmentHint}</p>
                  {#if files.length}
                    <ul class="attachment-list" aria-label={t.selectedFiles}>
                      {#each files as file, index}
                        <li>
                          {#if imageUrls[index]}<img class="attachment-thumbnail" src={imageUrls[index]} alt="" />{:else if file.type.startsWith('video/')}<Film size={20} aria-hidden="true" />{:else}<FileText size={20} aria-hidden="true" />{/if}
                          <div class="attachment-info"><span><bdi>{file.name}</bdi></span><small>{file.size < 1024 * 1024 ? `${sizes.format(file.size / 1024)} KiB` : `${sizes.format(file.size / (1024 * 1024))} MiB`}</small></div>
                          <Button variant="ghost" size="icon" class="remove-attachment" aria-label={t.removeFile(file.name)} onclick={() => { files = files.filter((_, current) => current !== index); success = ''; }}><X size={15} /></Button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
                <button type="button" class="advanced-toggle" aria-expanded={advanced} aria-controls="advanced-fields" onclick={() => advanced = !advanced}><SlidersHorizontal size={15} />{t.advanced}<span>{t.advancedHint}</span><ChevronRight size={15} class={advanced ? 'rotated' : ''} /></button>
                <div id="advanced-fields" hidden={!advanced} class="advanced-fields">
                  <div><label for="username">{t.username} <span class="optional">{t.optional}</span></label><Input id="username" name="username" bind:value={username} maxlength={80} placeholder={t.usernamePlaceholder} aria-invalid={errorField === 'username'} aria-describedby={errorField === 'username' ? 'username-error' : undefined} />{@render fieldError('username')}</div>
                  <div><label for="threadId">{t.thread} <span class="optional">{t.optional}</span></label><Input id="threadId" name="threadId" bind:value={threadId} inputmode="numeric" placeholder={t.threadPlaceholder} aria-invalid={errorField === 'threadId'} aria-describedby={errorField === 'threadId' ? 'threadId-error thread-hint' : 'thread-hint'} />{@render fieldError('threadId')}<p class="field-hint" id="thread-hint">{t.threadHint}</p></div>
                </div>
              </div>
              <div class="send-bar"><Button variant="ghost" class="reset-button" onclick={() => { content = ''; files = []; error = null; success = ''; }}><RotateCcw size={14} />{t.clear}</Button><div><span class="keyboard-hint">Ctrl / ⌘<CornerDownLeft size={12} /></span><Button type="submit" class="send-button" disabled={sending}><span class="icon-swap" class:on={sending} aria-hidden="true"><Send size={15} /><LoaderCircle size={15} class="spin" /></span>{sending ? (files.length ? t.uploading : t.sending) : t.send}</Button></div></div>
            </section>
          </fieldset>
          <div class="sr-only" role="alert">{errorText}</div>
          <div class="feedback error-feedback" id="form-error">{#if error && !errorField}<X size={16} aria-hidden="true" /><span>{errorText}</span>{/if}</div>
          <div class="feedback success-feedback" role="status" id="send-result">{#if success}<Check size={16} /><span>{t.sent(success)}</span>{/if}</div>
        </form>

        <aside id="message-preview" class="preview-column" tabindex="-1" aria-label={t.preview}>
          <section class="panel preview-panel">
            <div class="preview-heading"><div><h2>{t.preview}</h2><p>{t.previewCaption}</p></div><a class="preview-back" href="#content">{t.backToEditor}<ChevronRight size={14} /></a></div>
            <div class="preview-tabs" aria-label={t.previewFormat}><button type="button" class:active={preview === 'message'} aria-pressed={preview === 'message'} onclick={() => preview = 'message'}><MessageSquare size={14} />{t.messageTab}</button><button type="button" class:active={preview === 'json'} aria-pressed={preview === 'json'} onclick={() => preview = 'json'}><Code2 size={15} />JSON {t.requestBody}</button></div>
            <div class="discord-preview">
              {#if preview === 'message'}
                <div class="channel-heading"><Hash size={19} /><span>{t.channel}</span><span class="channel-label">{t.previewBadge}</span></div>
                {#if content || files.length}
                <div class="preview-date"><span></span>{t.previewDate}<span></span></div>
                <div class="discord-message"><div class="bot-avatar"><Webhook size={25} strokeWidth={1.8} /></div><div class="message-detail"><div class="bot-heading"><strong><bdi>{username.trim() || 'Webhook'}</bdi></strong><span class="app-badge">APP<Check size={9} /></span><time>{t.sendTime}</time></div>{#if content}<p>{content}</p>{/if}
                  {#if files.length}<ul class="attachment-list preview-attachments" aria-label={t.attachmentPreview}>
                    {#each files as file, index}
                      <li>{#if imageUrls[index]}<img class="attachment-image" src={imageUrls[index]} alt={file.name} />{/if}<div class="preview-file"><Paperclip size={14} aria-hidden="true" /><span><bdi>{file.name}</bdi></span></div></li>
                    {/each}
                  </ul>{/if}
                </div></div>
                {:else}<div class="empty-preview"><MessageSquare size={27} /><p>{t.emptyPreview}</p><span>{t.emptyHint}</span></div>{/if}
              {:else}
                <p class="json-note">{t.jsonNote}</p>
                <pre class="json-preview">{payload}</pre>
              {/if}
            </div>
          </section>
          <div class="privacy-note"><div class="privacy-icon"><ShieldCheck size={19} /></div><div><h3>{t.privacyTitle}</h3><p>{t.privacyNote}</p></div></div>
        </aside>
      </div>
    </main>
</div>

<dialog bind:this={help} class="help-dialog" class:keyboard-action={keyboardAction} aria-labelledby="help-title">
  <div class="dialog-heading"><h2 id="help-title">{t.helpTitle}</h2><Button variant="ghost" size="icon" aria-label={t.closeHelp} onclick={() => help.close()}><X size={19} /></Button></div>
  <ol>{#each t.helpSteps as step}<li>{step}</li>{/each}</ol>
  <p>{t.helpChannel}</p><p>{t.helpThread}</p>
  <p>{t.helpFiles}</p>
  <div class="dialog-security"><LockKeyhole size={17} /><p>{t.helpSecurity}</p></div>
  <Button class="dialog-done" onclick={() => help.close()}>{t.startWriting}<ChevronRight size={15} /></Button>
</dialog>
