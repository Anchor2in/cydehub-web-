This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Telegram Chat Bridge

This project can forward website chat messages to Telegram and receive Telegram replies back into the website chat in realtime.

### Required environment variables

Add these in your deployment environment (for example Vercel):

- `TELEGRAM_BOT_TOKEN` - bot token from BotFather
- `TELEGRAM_CHAT_ID` - destination chat id where website messages are sent
- `SUPABASE_SERVICE_ROLE_KEY` - server-side key for inserting webhook replies into `chat_messages`

Optional:

- `TELEGRAM_WEBHOOK_SECRET` - secret token passed by Telegram in webhook header
- `TELEGRAM_DEFAULT_ROOM_ID` - force inbound Telegram replies into a specific room
- `TELEGRAM_AGENT_USER_ID` - sender profile id for inbound replies (must be a valid Supabase auth user id)
- `TELEGRAM_FORUM_ENABLED` - set to `true` to use one Telegram forum topic per user room

### Per-user Telegram topics (recommended)

To separate each user conversation into its own Telegram thread:

1. Use a Telegram supergroup with **Topics** enabled.
2. Keep `TELEGRAM_CHAT_ID` set to that supergroup id.
3. Set `TELEGRAM_FORUM_ENABLED=true` in Vercel.
4. Ensure your Supabase schema includes `chat_telegram_topics` (see `supabase/schema.sql`).

When enabled, the bridge creates/reuses one forum topic per website private room and routes Telegram replies back to the correct user room.

### Telegram webhook setup

Set your Telegram bot webhook to:

- Callback URL: `https://your-domain.com/api/telegram/webhook`
- Optional secret token: same value as `TELEGRAM_WEBHOOK_SECRET`

Use BotFather to set the webhook URL, then send messages to your bot/chat so incoming Telegram text replies hit the webhook.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
