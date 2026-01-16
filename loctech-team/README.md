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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Attendance System Setup

1. Create `.env.local` with:

```
MONGODB_URI=your_mongodb_atlas_connection_string
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=CXXXXXXXX
QR_BASE_SECRET=generate_a_random_long_secret
```

2. Run the app:

```
npm run dev
```

3. Generate office QR content daily:

- Compute the daily secret on the server or CLI using the same `QR_BASE_SECRET`.
- QR content can be a JSON string like:

```
{"secret":"<today_hmac_hex>","session":"<random_32_hex>"}
```

4. Place the printed QR in the office. Users scan it on `/` and submit their name.

Notes:

- Slack message posting requires the bot to be in the channel with `chat:write` scope.
- MongoDB Atlas is recommended for managed availability and backups.
