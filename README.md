## Chatmate – Conversational Web Assistant

Chatmate is a polished chatbot experience built with Next.js 14. It pairs a rich, glassmorphism-inspired UI with a lightweight conversational engine that can brainstorm ideas, outline plans, and keep momentum flowing without external dependencies.

### ✨ Features
- Responsive chat interface with auto-scrolling, timestamps, and typing indicator.
- Smart suggestion pills that adapt to the conversation.
- In-browser API route that provides contextual, intent-aware replies.
- Accessible keyboard-first composer with auto-resizing textarea and quick submit.

### 🛠️ Stack
- [Next.js 14 (App Router)](https://nextjs.org/)
- TypeScript & CSS Modules
- Server Actions via route handlers for the chatbot logic

### 🚀 Getting Started
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to chat with the assistant locally.

### 🧪 Available Scripts
- `npm run lint` – check the project with ESLint.
- `npm run build` – create an optimized production build.
- `npm run start` – serve the build locally.

### 📦 Deployment
The project is ready to deploy on Vercel. After running `npm run build`, deploy with:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-145a6c5d
```

Enjoy the conversation!
