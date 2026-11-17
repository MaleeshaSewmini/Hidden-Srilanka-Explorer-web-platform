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

## AI destination recommendations

The recommendation chatbot uses the Google Gemini API and approved/published destination
records from Supabase. Copy `.env.example` to `.env.local`, then set the Supabase values and
`GEMINI_API_KEY`. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
The key is used only by the server-side API route and must not use a `NEXT_PUBLIC_` prefix.

Run `npm run dev`, open the site, and ask the AI Guide a question such as "Suggest an easy
hike" or "What are the entrance fees?". Responses are grounded in the destination fields in
Supabase; unavailable fees, safety details, facilities, and other facts are not guessed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For the recommendation chatbot, add `GEMINI_API_KEY` in the Vercel project's
**Settings > Environment Variables**. Set it for the needed environments (Production,
Preview, and/or Development), then redeploy. Also configure
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
