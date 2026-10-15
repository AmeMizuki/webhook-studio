# Webhook Studio

### Compose, preview, and send messages to Discord

English | [繁體中文](README.zh-TW.md)

Send text, images, videos, and files to a Discord channel using a Webhook. Preview your content before sending, customize the display name, or post to an existing thread. No account is required.

## Installation

Install [Bun](https://bun.sh), then run the following in the project directory:

```sh
bun install
bun run dev
```

Open http://127.0.0.1:3002, or use the address printed in your terminal if you have set a different `PORT`.

## Development

After editing the source, stop the server and run `bun run dev` again. Changes are not reloaded automatically.

```sh
bun run build  # Build the site into dist/
bun start      # Serve the built site
bun test       # Run tests
```

To publish the site, upload the contents of `dist/` to a static hosting service.

## Usage

1. In your target Discord channel, open **Channel Settings → Integrations → Webhooks**. Create or select a Webhook and copy its URL.
2. Paste the URL into Webhook Studio.
3. Write a message of up to 2,000 characters, add up to 10 attachments, or combine both. Text is optional when sending attachments. File size limits depend on the Discord channel.
4. Optionally open **Advanced settings** to set a display name or an existing thread ID. Forum and media channels require a thread belonging to that channel.
5. Check **Content preview**, then select **Send message** or press **Ctrl / ⌘ + Enter**.

### Preview and editing

- The preview shows plain text and images. Markdown is supported when sending, but is not rendered in the preview. Videos and other files appear by filename.
- Use **View preview** and **Back to editor** in the single-column layout to move between sections.
- Add attachments in multiple selections and remove individual files before sending. **Clear message** removes both text and attachments. **Use example** replaces the current message text.
- Use the **JSON body** view to inspect the message data. It does not include the destination URL or file contents.
- Switch between **EN** and **繁中** without clearing your draft.

### Destination and safety

- A Webhook can only post to its linked channel. To change channels, use that channel’s Webhook URL.
- Keep the Webhook URL private: anyone with it can send messages. If exposed, delete and recreate the Webhook in Discord.
- Your Webhook URL and attachments stay in the current page until you send. Refreshing clears your draft and selected files.
- Messages are sent directly to Discord. Mention notifications, including `@everyone`, are disabled.
- A failed send keeps your draft and attachments. If delivery cannot be confirmed, check Discord before trying again to avoid duplicates.

## Sources

- [Discord Webhooks guide](https://support.discord.com/hc/en-us/articles/228383668)
- [Discord Execute Webhook reference](https://docs.discord.com/developers/resources/webhook#execute-webhook)
- [Discord file uploads reference](https://docs.discord.com/developers/reference#uploading-files)
- [shadcn-svelte components](https://www.shadcn-svelte.com/docs/components/button) — see [third-party licenses](THIRD_PARTY_LICENSES).