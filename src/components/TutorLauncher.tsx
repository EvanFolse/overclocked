"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTutorTopics, type TutorTopic } from "@/data/tutor";

interface TutorLauncherProps {
    /** Highest stage unlocked or being read. Decides which topics are shown. */
    stage: number;
}

interface ChatMessage {
    id: number;
    role: "tutor" | "user";
    text: string;
    /** True for the newest tutor message: it is typed out letter by letter. */
    animate?: boolean;
}

const GREETING = "Hi! I'm your CPU Tutor. Pick a topic and I'll explain it in plain words.";

/** Small icon per topic. Unknown topics fall back to a light bulb. */
const TOPIC_ICON: Record<string, string> = {
    registers: "🗂️",
    clock: "⏱️",
    "alu-vs-control": "🧮",
    cache: "⚡",
    bus: "🚌",
};

const TYPE_SPEED_MS = 14; // delay between letters
const THINK_MS = 700; // how long the typing dots show before an answer

const CSS = `
@keyframes tutor-pop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes tutor-dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
@keyframes tutor-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes tutor-float{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,8px)}}
@keyframes tutor-ring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.08,1.25)}}
@keyframes tutor-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes tutor-caret{50%{opacity:0}}
.tutor-pop{animation:tutor-pop .35s cubic-bezier(.2,.9,.3,1.2) both}
.tutor-dot{display:inline-block;width:6px;height:6px;border-radius:9999px;background:currentColor;animation:tutor-dot 1s infinite}
.tutor-eye{transform-box:fill-box;transform-origin:center;animation:tutor-blink 4.5s infinite}
.tutor-orb{animation:tutor-float 7s ease-in-out infinite}
.tutor-orb-b{animation-delay:-3s}
.tutor-ring{position:absolute;inset:0;border-radius:.75rem;border:2px solid currentColor;pointer-events:none;animation:tutor-ring 2.6s ease-out infinite}
.tutor-bob{display:inline-flex;animation:tutor-bob 2.4s ease-in-out infinite}
.tutor-caret{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:currentColor;animation:tutor-caret 1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.tutor-root *,.tutor-btn,.tutor-btn *{animation:none!important}}
`;

/** The Tutor mascot: a tiny CPU with a face. It glows while the Tutor is "typing". */
function TutorAvatar({ active = false, size = 40 }: { active?: boolean; size?: number }) {
    return (
        <svg
            viewBox="0 0 40 40"
            width={size}
            height={size}
            className="shrink-0 text-accent"
            aria-hidden
            style={active ? { filter: "drop-shadow(0 0 6px currentColor)" } : undefined}
        >
            <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M13 3v5M20 3v5M27 3v5M13 32v5M20 32v5M27 32v5M3 13h5M3 20h5M3 27h5M32 13h5M32 20h5M32 27h5" />
            </g>
            <rect x="8" y="8" width="24" height="24" rx="6" fill="currentColor" />
            <circle className="tutor-eye" cx="16" cy="18.5" r="2.4" fill="#fff" />
            <circle className="tutor-eye" cx="24" cy="18.5" r="2.4" fill="#fff" />
            <path
                d="M15.5 25c1.4 1.8 3.1 2.6 4.5 2.6s3.1-.8 4.5-2.6"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

/** Types the text out letter by letter. Shows everything at once when `animate` is false. */
function TypedText({
    text,
    animate,
    reduce,
    onProgress,
}: {
    text: string;
    animate: boolean;
    reduce: boolean;
    onProgress: () => void;
}) {
    const typing = animate && !reduce;
    const [n, setN] = useState(typing ? 0 : text.length);

    useEffect(() => {
        if (!typing) return;
        const id = window.setInterval(() => {
            setN((v) => {
                if (v >= text.length) {
                    window.clearInterval(id);
                    return v;
                }
                return v + 1;
            });
        }, TYPE_SPEED_MS);
        return () => window.clearInterval(id);
    }, [typing, text]);

    useEffect(() => {
        onProgress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [n]);

    const shown = typing ? text.slice(0, n) : text;
    return (
        <>
            {shown}
            {typing && n < text.length && <span className="tutor-caret" />}
        </>
    );
}

/**
 * Tutor chatbot (design doc 6.2): a hard-coded question tree, no live AI.
 * A button in the bottom-left corner opens a chat panel from the right:
 * pick a topic -> pick a question -> read the fixed answer.
 * The parent decides where it is shown (never during a round).
 */
export function TutorLauncher({ stage }: TutorLauncherProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: "tutor", text: GREETING }]);
    const [topic, setTopic] = useState<TutorTopic | null>(null);
    const [asked, setAsked] = useState<string[]>([]); // "topicId:questionIndex"
    const [typing, setTyping] = useState(false);
    const [reduce, setReduce] = useState(false);

    const idRef = useRef(1);
    const timers = useRef<number[]>([]);
    const closeTimer = useRef<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const topics = getTutorTopics(stage);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read the user's motion preference once
        setReduce(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
        const pending = timers.current;
        return () => {
            pending.forEach((id) => window.clearTimeout(id));
            if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        };
    }, []);

    const scrollToBottom = useCallback((smooth = false) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }, []);

    useEffect(() => {
        if (open) scrollToBottom(true);
    }, [open, messages.length, typing, topic, scrollToBottom]);

    // Escape closes the panel
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePanel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const addMessage = (role: ChatMessage["role"], text: string, animate = false) => {
        const id = idRef.current++;
        // Older tutor messages stop animating and show their full text
        setMessages((m) => [...m.map((x) => (x.animate ? { ...x, animate: false } : x)), { id, role, text, animate }]);
    };

    /** Show the typing dots, then the tutor's answer. */
    const reply = (text: string) => {
        setTyping(true);
        const id = window.setTimeout(
            () => {
                setTyping(false);
                addMessage("tutor", text, true);
            },
            reduce ? 150 : THINK_MS
        );
        timers.current.push(id);
    };

    const chooseTopic = (t: TutorTopic) => {
        addMessage("user", t.title);
        setTopic(t);
        reply("Good choice! These are the questions people ask most about it. Pick one.");
    };

    const askQuestion = (t: TutorTopic, index: number) => {
        const qa = t.items[index];
        if (!qa) return;
        addMessage("user", qa.question);
        setAsked((a) => (a.includes(`${t.id}:${index}`) ? a : [...a, `${t.id}:${index}`]));
        reply(qa.answer);
    };

    const backToTopics = () => {
        addMessage("user", "Other topics");
        setTopic(null);
        reply("Sure! What else would you like to know?");
    };

    const resetChat = () => {
        timers.current.forEach((id) => window.clearTimeout(id));
        timers.current = [];
        setTyping(false);
        setTopic(null);
        setAsked([]);
        setMessages([{ id: idRef.current++, role: "tutor", text: GREETING }]);
    };

    // Opening cancels a pending clear. Closing clears the chat once the panel has slid out.
    const openPanel = () => {
        if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
        setOpen(true);
    };
    const closePanel = () => {
        setOpen(false);
        if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
            closeTimer.current = null;
            resetChat();
        }, 350);
    };

    const lastTutorId = [...messages].reverse().find((m) => m.role === "tutor")?.id;

    return (
        <>
            <style>{CSS}</style>

            {/* Launcher button */}
            <button
                type="button"
                onClick={openPanel}
                className="tutor-btn fixed bottom-20 left-4 z-[65] flex w-60 items-center gap-3 rounded-xl border border-violet/40 bg-violet-soft px-3 py-2.5 text-left text-violet shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
                <span className="tutor-ring" aria-hidden />
                <span className="tutor-bob">
                    <TutorAvatar size={34} />
                </span>
                <span className="min-w-0">
                    <b className="block font-mono text-xs font-bold tracking-[0.25em]">TUTOR</b>
                    <span className="block font-mono text-[10px] text-muted">ask about a part</span>
                </span>
            </button>

            {/* Dimmed backdrop: click to close */}
            <div
                onClick={closePanel}
                className={`fixed inset-0 z-[66] bg-black/30 transition-opacity duration-300 ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                role="dialog"
                aria-label="Tutor"
                aria-hidden={!open}
                className={`tutor-root fixed right-0 top-0 z-[67] flex h-full w-full max-w-md flex-col border-l border-edge bg-panel shadow-2xl transition-[transform,visibility] duration-300 ${
                    open ? "visible translate-x-0" : "invisible translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="relative overflow-hidden border-b border-edge px-6 pb-4 pt-5">
                    <span className="tutor-orb pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-violet/25 blur-2xl" />
                    <span className="tutor-orb tutor-orb-b pointer-events-none absolute -right-6 top-0 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <TutorAvatar size={46} active={typing} />
                        <div className="min-w-0 flex-1">
                            <h2 className="font-mono text-lg font-bold tracking-[0.15em]">CPU TUTOR</h2>
                            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                                Ready to help
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={resetChat}
                            className="rounded-md border border-edge px-2 py-1 font-mono text-[10px] text-muted transition hover:border-accent hover:text-foreground"
                        >
                            New chat
                        </button>
                        <button
                            type="button"
                            onClick={closePanel}
                            aria-label="Close tutor"
                            className="rounded-md px-2 py-1 font-mono text-sm text-muted transition hover:text-foreground"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Conversation */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
                    <div className="flex flex-col gap-3">
                        {messages.map((m) =>
                            m.role === "tutor" ? (
                                <div key={m.id} className="tutor-pop flex items-end gap-2">
                                    <TutorAvatar size={28} />
                                    <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-edge bg-panel-muted px-4 py-3 text-[15px] leading-relaxed">
                                        <TypedText
                                            text={m.text}
                                            animate={!!m.animate && m.id === lastTutorId}
                                            reduce={reduce}
                                            onProgress={scrollToBottom}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div key={m.id} className="tutor-pop flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-[15px] text-white shadow-sm">
                                        {m.text}
                                    </div>
                                </div>
                            )
                        )}

                        {typing && (
                            <div className="tutor-pop flex items-end gap-2">
                                <TutorAvatar size={28} active />
                                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-edge bg-panel-muted px-4 py-3.5 text-muted">
                                    <span className="tutor-dot" />
                                    <span className="tutor-dot" style={{ animationDelay: "0.15s" }} />
                                    <span className="tutor-dot" style={{ animationDelay: "0.3s" }} />
                                </div>
                            </div>
                        )}

                        {/* Choices: topics first, then the questions of the chosen topic */}
                        {!typing && !topic && (
                            <div className="mt-2 flex flex-col gap-2.5">
                                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Pick a topic</p>
                                {topics.length === 0 && <p className="text-sm text-muted">No topics yet.</p>}
                                {topics.map((t, i) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => chooseTopic(t)}
                                        className="tutor-pop flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-left text-[15px] text-accent-text transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        <span className="text-xl" aria-hidden>
                                            {TOPIC_ICON[t.id] ?? "💡"}
                                        </span>
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!typing && topic && (
                            <div className="mt-2 flex flex-col gap-2.5">
                                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{topic.title}</p>
                                {topic.items.map((qa, i) => {
                                    const done = asked.includes(`${topic.id}:${i}`);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => askQuestion(topic, i)}
                                            className={`tutor-pop flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition hover:-translate-y-0.5 hover:shadow-md ${
                                                done
                                                    ? "border-edge text-muted hover:border-accent"
                                                    : "border-accent/40 bg-accent-soft text-accent-text hover:border-accent"
                                            }`}
                                            style={{ animationDelay: `${i * 60}ms` }}
                                        >
                                            <span>{qa.question}</span>
                                            {done && <span className="shrink-0 font-mono text-xs text-success">✓</span>}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={backToTopics}
                                    className="tutor-pop mt-1 self-start rounded-full border border-edge px-4 py-1.5 font-mono text-xs text-muted transition hover:border-accent hover:text-foreground"
                                    style={{ animationDelay: `${topic.items.length * 60}ms` }}
                                >
                                    ↩ Other topics
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rule reminder (design doc 6.2): always visible */}
                <div className="border-t border-edge p-4">
                    <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-snug text-warning">
                        🔒 The Tutor is switched off during rounds and Golden Chip questions — no looking up answers.
                    </p>
                </div>
            </aside>
        </>
    );
}
