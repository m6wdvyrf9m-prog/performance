import { Check, RotateCcw, Send } from "lucide-react";
import { CardColour, CardInstanceStatus } from "@/generated/prisma/client";
import { acceptReceivedCardAction, keepCardAction, returnCardAction, sendCardAction } from "@/app/actions/activity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const cardStyles: Record<CardColour, string> = {
  BLUE: "border-energy-blue/50 bg-blue-50 text-blue-950",
  RED: "border-energy-red/50 bg-red-50 text-red-950",
  GREEN: "border-energy-green/50 bg-green-50 text-green-950",
  YELLOW: "border-energy-yellow/60 bg-yellow-50 text-yellow-950",
};

const tabStyles: Record<CardColour, string> = {
  BLUE: "bg-energy-blue text-white",
  RED: "bg-energy-red text-white",
  GREEN: "bg-energy-green text-white",
  YELLOW: "bg-energy-yellow text-tcw-ink",
};

export type ColourCardViewModel = {
  id: string;
  status: CardInstanceStatus;
  sender?: { name: string } | null;
  cardDefinition: {
    colour: CardColour;
    statement: string;
  };
};

export function ReadOnlyColourCard({ card }: { card: ColourCardViewModel }) {
  return (
    <article className={cn("relative rounded-2xl border p-5 shadow-card", cardStyles[card.cardDefinition.colour])}>
      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black", tabStyles[card.cardDefinition.colour])}>
        {card.cardDefinition.colour}
      </span>
      <p className="mt-5 text-lg font-bold leading-snug">{card.cardDefinition.statement}</p>
      {card.sender ? <p className="mt-4 text-sm font-semibold">Sent to you by {card.sender.name}</p> : null}
    </article>
  );
}

export function InteractiveColourCard({
  card,
  sessionId,
  recipients,
}: {
  card: ColourCardViewModel;
  sessionId: string;
  recipients: Array<{ id: string; name: string; email: string }>;
}) {
  const isReceived = card.status === CardInstanceStatus.RECEIVED;

  return (
    <article className={cn("relative rounded-2xl border p-5 shadow-card", cardStyles[card.cardDefinition.colour])}>
      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black", tabStyles[card.cardDefinition.colour])}>
        {card.cardDefinition.colour}
      </span>
      {card.sender ? <p className="mt-4 text-sm font-semibold">Sent to you by {card.sender.name}</p> : null}
      <p className="mt-5 text-xl font-black leading-snug">{card.cardDefinition.statement}</p>

      <div className="mt-6 grid gap-3">
        <form action={isReceived ? acceptReceivedCardAction : keepCardAction}>
          <input type="hidden" name="cardInstanceId" value={card.id} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <Button className="w-full" variant="primary">
            <Check size={17} aria-hidden="true" />
            {isReceived ? "Add to My Cards" : "Keep · This sounds like me"}
          </Button>
        </form>

        {!isReceived ? (
          <>
            <form action={sendCardAction} className="grid gap-2">
              <input type="hidden" name="cardInstanceId" value={card.id} />
              <input type="hidden" name="sessionId" value={sessionId} />
              <label className="text-sm font-bold text-tcw-ink/80" htmlFor={`recipient-${card.id}`}>
                Give to someone
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  id={`recipient-${card.id}`}
                  name="recipientId"
                  required
                  className="touch-target rounded-lg border border-tcw-line bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choose a participant</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </select>
                <Button variant="secondary">
                  <Send size={17} aria-hidden="true" />
                  Give
                </Button>
              </div>
            </form>

            <form action={returnCardAction}>
              <input type="hidden" name="cardInstanceId" value={card.id} />
              <input type="hidden" name="sessionId" value={sessionId} />
              <Button className="w-full" variant="soft">
                <RotateCcw size={17} aria-hidden="true" />
                Return · Not for me
              </Button>
            </form>
          </>
        ) : null}
      </div>
    </article>
  );
}
