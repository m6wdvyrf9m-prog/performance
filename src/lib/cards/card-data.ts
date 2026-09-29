import type { CardColour } from "@/generated/prisma/client";

export type ColourCardSeed = {
  colour: CardColour;
  sortOrder: number;
  statement: string;
};

const blueStatements = [
  "I like to understand the facts before I make a decision.",
  "I notice details that other people sometimes miss.",
  "I prefer accuracy over speed.",
  "I like having time to think things through.",
  "I ask questions to make sure I understand properly.",
  "I value logic and consistency.",
  "I prefer to be well prepared.",
  "I like clear evidence to support an argument.",
  "I can spot when something does not quite add up.",
  "I tend to think before I speak.",
  "I enjoy solving complex problems.",
  "I like things to be organised and structured.",
  "I prefer clear expectations and defined standards.",
  "I am uncomfortable making decisions without enough information.",
  "I often consider the risks before taking action.",
  "I like to know how something works.",
  "I can be quite precise in the language I use.",
  "I would rather do something properly than rush it.",
  "I tend to keep my emotions relatively private.",
  "I like having space to concentrate without interruption.",
  "I often challenge assumptions.",
  "I prefer objective criteria when judging something.",
  "I am naturally cautious about untested ideas.",
  "I appreciate people who have done their homework.",
  "I feel more confident when I have all the relevant information.",
];

const redStatements = [
  "I like to get things moving.",
  "I am comfortable making quick decisions.",
  "I naturally focus on results.",
  "I would rather take action than spend too long discussing it.",
  "I am comfortable saying exactly what I think.",
  "I enjoy a challenge.",
  "I like having clear goals to work towards.",
  "I am prepared to take responsibility for difficult decisions.",
  "I can become impatient when progress is too slow.",
  "I like people to get to the point.",
  "I am motivated by achievement.",
  "I tend to take the lead when something needs doing.",
  "I enjoy competition.",
  "I am comfortable challenging other people's ideas.",
  "I prefer solutions to lengthy discussions about problems.",
  "I like having authority to make things happen.",
  "I am willing to take calculated risks.",
  "I value efficiency.",
  "I tend to focus on the end result.",
  "I can make decisions even when I do not have every detail.",
  "I respect people who are confident and decisive.",
  "I like ambitious targets.",
  "I find unnecessary bureaucracy frustrating.",
  "I will push for progress when others are hesitating.",
  "I would rather try something and adjust than wait for perfect certainty.",
];

const greenStatements = [
  "I like to make sure everyone has had a chance to contribute.",
  "I naturally notice how other people are feeling.",
  "I prefer cooperation to competition.",
  "I value loyalty and trust.",
  "I like creating an environment where people feel comfortable.",
  "I tend to listen carefully before responding.",
  "I am patient with people who need time to think.",
  "I prefer harmony to unnecessary conflict.",
  "I enjoy supporting other people.",
  "I think relationships matter as much as results.",
  "I am usually considerate of how decisions affect others.",
  "I prefer to build consensus where possible.",
  "I value sincerity.",
  "I am willing to give people my time.",
  "I tend to be calm and steady under pressure.",
  "I like people to feel included.",
  "I am uncomfortable when people are treated unfairly.",
  "I prefer lasting relationships to short-term transactions.",
  "I often think about the human impact of a decision.",
  "I value people who are genuine and dependable.",
  "I am prepared to compromise to preserve an important relationship.",
  "I usually try to understand another person's point of view.",
  "I enjoy helping people develop.",
  "I prefer change to be introduced thoughtfully rather than suddenly.",
  "I want people to feel heard, even when I disagree with them.",
];

const yellowStatements = [
  "I get energy from being around other people.",
  "I enjoy sharing ideas.",
  "I tend to see possibilities quickly.",
  "I like conversations that generate new thinking.",
  "I am usually enthusiastic about new opportunities.",
  "I enjoy meeting new people.",
  "I tend to think out loud.",
  "I like bringing energy into a room.",
  "I can become excited about an idea very quickly.",
  "I enjoy persuading people and getting them interested.",
  "I am naturally optimistic.",
  "I like variety.",
  "I enjoy brainstorming.",
  "I am comfortable starting conversations with people I do not know.",
  "I often connect ideas that initially seem unrelated.",
  "I prefer flexibility to rigid routines.",
  "I enjoy telling stories.",
  "I like creating momentum around an idea.",
  "I often focus on what could be possible.",
  "I enjoy spontaneous conversations.",
  "I can find repetitive tasks draining.",
  "I tend to express my emotions openly.",
  "I enjoy being part of lively discussions.",
  "I am often motivated by exciting possibilities.",
  "I like inspiring other people to get involved.",
];

function toCards(colour: CardColour, statements: string[]): ColourCardSeed[] {
  return statements.map((statement, index) => ({
    colour,
    sortOrder: index + 1,
    statement,
  }));
}

export const colourCardSeeds: ColourCardSeed[] = [
  ...toCards("BLUE", blueStatements),
  ...toCards("RED", redStatements),
  ...toCards("GREEN", greenStatements),
  ...toCards("YELLOW", yellowStatements),
];
