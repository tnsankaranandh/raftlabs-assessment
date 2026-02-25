# Food Order Management

Next.js full-stack app for ordering food and managing order status.

## Admin Page

Restaurant admins can manage orders at **`/admin`**.

- **Local dev** (no `ADMIN_PASSWORD` set): Open `/admin` to view and update orders.
- **Production**: Set `ADMIN_PASSWORD` in Vercel env vars. Admins sign in with that password to access `/admin`.

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/examples/tree/main/solutions/express&project-name=express&repository-name=express)

### Clone and Deploy

```bash
git clone https://github.com/vercel/examples/tree/main/solutions/express
```

Install the Vercel CLI:

```bash
npm i -g vercel
```

Then run the app at the root of the repository:

```bash
vercel dev
```
