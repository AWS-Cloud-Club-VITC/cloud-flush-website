# ☁ Cloud-Flush

> **Where Code Meets Cloud. Where Ideas Become Infrastructure.**

The official landing page for **Cloud-Flush** — the flagship 24-hour cloud hackathon by [AWS Cloud Club VIT Chennai](https://github.com/brovoski69/cloud-flush).

---

## 🚀 About

Cloud-Flush is a high-octane, 24-hour sprint where developers, designers, and dreamers collide to build the future on the cloud. Whether you're deploying serverless architectures, training ML models on SageMaker, or crafting full-stack applications with AWS Amplify — this is your arena to innovate, break limits, and ship real products.

| Stat | Value |
|------|-------|
| ⏱ Duration | 24 Hours |
| 👥 Hackers Expected | 100+ |
| 🏆 Prize Pool | ₹20,000 |

---

## 🛠 Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router)
- **Styling** — [Tailwind CSS](https://tailwindcss.com)
- **Language** — TypeScript
- **Animations** — CSS animations + Intersection Observer API

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css       # Global styles & custom animations
│   ├── layout.tsx        # Root layout with fonts
│   └── page.tsx          # Home page (assembles all sections)
└── components/
    ├── Navbar.tsx         # Top navigation bar
    ├── Hero.tsx           # Hero section with countdown timer
    ├── About.tsx          # About the hackathon + stats
    ├── Timeline.tsx       # Event schedule / timeline
    ├── FAQ.tsx            # Frequently asked questions
    ├── Sponsors.tsx       # Sponsors showcase
    ├── Footer.tsx         # Site footer
    ├── CountdownTimer.tsx # Live countdown to event
    ├── GoldParticles.tsx  # Animated gold particle background
    └── ScrollReveal.tsx   # Scroll-triggered reveal animations
```

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/brovoski69/cloud-flush.git
cd cloud-flush

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🌐 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 📜 License

MIT © AWS Cloud Club VIT Chennai
