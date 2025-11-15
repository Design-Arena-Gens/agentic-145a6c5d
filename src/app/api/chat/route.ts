import { NextResponse } from "next/server";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
};

const fallbackSuggestions = [
  "What else can you help me with?",
  "Summarize our conversation so far.",
  "Give me a fresh idea to explore.",
  "Help me plan the next steps.",
];

const sanitize = (value: string) => value.trim().replace(/\s+/g, " ");

const buildIdeasResponse = (prompt: string) => {
  const focus = prompt
    .replace(/plan|idea|ideas?|brainstorm|help/gi, "")
    .trim();

  const focusLine = focus
    ? `Here are a few directions tailored to "${focus}":`
    : "Here are a few directions to explore:";

  return `${focusLine}

1. **Quick Win** – Start with a small experiment you can finish in under an hour to validate the concept without a big investment.
2. **Deep Dive** – Outline the larger objective, then break it into three milestones with owners, timelines, and success criteria.
3. **Community Pulse** – Ask three people from your audience what they would expect. Their language will sharpen your copy and positioning.

Want to unpack one of these further?`;
};

const buildPlanResponse = (prompt: string) => {
  const focus = sanitize(
    prompt.replace(/plan|schedule|timeline|roadmap/gi, ""),
  );
  const subject = focus ? ` to shape ${focus}` : "";

  return `Here’s a simple structure${subject} you can follow:

- **Clarify the outcome** – write one sentence about what “done” looks like.
- **Identify constraints** – note time, budget, and any tools you already have.
- **Draft the timeline** – split the work into morning/afternoon or weekly checkpoints.
- **Add accountability** – schedule quick check-ins or reminders so momentum doesn’t fade.

If you’d like, I can turn this into a calendar-style checklist for you.`;
};

const summarizeConversation = (history: ChatMessage[]) => {
  const important = history
    .filter((entry) => entry.role === "user")
    .slice(-3)
    .map((entry, index) => `${index + 1}. ${sanitize(entry.content)}`);

  if (important.length === 0) {
    return "You’ve mostly been exploring the assistant’s features so far.";
  }

  return `Here’s what I’m tracking:\n${important.join("\n")}\n\nReady whenever you are for a deeper dive.`;
};

const buildResponse = (prompt: string, history: ChatMessage[]) => {
  const normalized = prompt.toLowerCase();

  if (/\b(hello|hey|hi|good\s?(morning|afternoon|evening))\b/.test(normalized)) {
    return {
      reply:
        "Hey! 👋 I’m right here. Let me know what you’re working on or curious about and we’ll dive in together.",
      suggestions: [
        "Help me map out my next project.",
        "Teach me something new in five minutes.",
        "Turn this idea into action steps.",
      ],
    };
  }

  if (
    /\b(thank(s| you)|appreciate|great job|awesome)\b/.test(normalized) ||
    /\bthanks?\b/.test(normalized)
  ) {
    return {
      reply:
        "So glad that helped! Do you want to keep going, try a different angle, or wrap up with next steps?",
      suggestions: [
        "Let’s build on that idea.",
        "What should I tackle next?",
        "Summarize what we achieved.",
      ],
    };
  }

  if (/\b(bye|goodbye|see you|later)\b/.test(normalized)) {
    return {
      reply:
        "Catch you later! I’ll be ready the moment you’re back and want to resume.",
      suggestions: [
        "Draft a recap email for me.",
        "Share a quick productivity tip.",
        "Set up a follow-up checklist.",
      ],
    };
  }

  if (/\b(who are you|what are you|introduce yourself)\b/.test(normalized)) {
    return {
      reply:
        "I’m Chatmate—your on-demand collaborator for brainstorming, planning, and explaining ideas clearly. I combine structured thinking with a friendly tone so you can move faster.",
      suggestions: [
        "Show me how you brainstorm.",
        "Help me plan something step-by-step.",
        "Summarize an article for me.",
      ],
    };
  }

  if (/\b(plan|schedule|timeline|roadmap)\b/.test(normalized)) {
    return {
      reply: buildPlanResponse(prompt),
      suggestions: [
        "Convert that into a 7-day plan.",
        "List potential blockers I should watch out for.",
        "Suggest tools to stay on schedule.",
      ],
    };
  }

  if (/\bidea|ideas|brainstorm|concept\b/.test(normalized)) {
    return {
      reply: buildIdeasResponse(prompt),
      suggestions: [
        "Expand on idea number two.",
        "Find an inspiring quote I can use.",
        "Outline the risks and mitigations.",
      ],
    };
  }

  if (/\b(joke|funny|laugh)\b/.test(normalized)) {
    return {
      reply:
        "Sure! Why did the developer bring a ladder to work? Because they heard the project was in the cloud. 😄 Want another one or should we get back to business?",
      suggestions: [
        "Give me a motivational quote.",
        "Let’s get serious again.",
        "Share a brainstorming icebreaker.",
      ],
    };
  }

  if (/\b(weather|temperature|outside)\b/.test(normalized)) {
    return {
      reply:
        "I can’t check the live weather, but I can help you pack smarter: grab layers, keep an eye on the hourly forecast, and schedule a backup indoor activity just in case.",
      suggestions: [
        "Plan a day trip itinerary.",
        "Help me pack efficiently.",
        "Create a rainy-day backup plan.",
      ],
    };
  }

  if (/\btime\b/.test(normalized)) {
    const now = new Date();
    return {
      reply: `It’s currently ${now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}. Want to carve out a plan for the next hour or set some checkpoints?`,
      suggestions: [
        "Help me focus for the next 25 minutes.",
        "Break the next task into checkpoints.",
        "Plan my evening wind-down routine.",
      ],
    };
  }

  if (/\b(explain|teach|learn|understand)\b/.test(normalized)) {
    return {
      reply: `Let’s unpack that the simple way:

1. Start with the big picture—what problem does it solve?
2. Identify the core pieces involved.
3. Walk through a real-world example.
4. Finish with an action you can try on your own.

Tell me what you’re learning and I’ll tailor each step.`,
      suggestions: [
        "Give me an analogy to understand it.",
        "Quiz me with a quick check.",
        "Show me the pros and cons.",
      ],
    };
  }

  if (/\bsummary|summarize|recap\b/.test(normalized)) {
    return {
      reply: summarizeConversation(history),
      suggestions: [
        "Highlight key decisions.",
        "Outline next actions.",
        "Draft a message I can send to my team.",
      ],
    };
  }

  const lastAssistantResponse = [...history]
    .reverse()
    .find((entry) => entry.role === "assistant");

  if (lastAssistantResponse && normalized.includes("expand")) {
    return {
      reply:
        "Let’s zoom in: what part would you like to develop—resources, timeline, or potential challenges? Give me a clue and I’ll sketch it out.",
      suggestions: [
        "List potential challenges we might hit.",
        "Suggest resources that could help.",
        "Turn this into a longer-form outline.",
      ],
    };
  }

  return {
    reply: `Here’s what I’m picking up: ${sanitize(
      prompt,
    )}. I can help you clarify the goal, outline the steps, or find inspiration.

Let me know which direction sounds best and we’ll move forward.`,
    suggestions: fallbackSuggestions,
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          reply:
            "I didn’t catch that request. Can you share it again in plain text?",
          suggestions: fallbackSuggestions,
        },
        { status: 400 },
      );
    }

    const lastUserMessage = [...body.messages]
      .reverse()
      .find((entry) => entry.role === "user");

    if (!lastUserMessage) {
      return NextResponse.json(
        {
          reply:
            "I’m ready when you are—drop a message and we’ll get rolling.",
          suggestions: fallbackSuggestions,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      buildResponse(lastUserMessage.content, body.messages),
      { status: 200 },
    );
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json(
      {
        reply:
          "Something went sideways on my end. Give me a second and feel free to try again.",
        suggestions: fallbackSuggestions,
      },
      { status: 500 },
    );
  }
}
