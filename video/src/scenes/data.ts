// Voiceover script, one clip per scene (ElevenLabs Eleven v4, voice "Brian").
// Durations measured from the generated files; scenes add a short tail.
export const SCENES = [
  { id: "Hook", vo: "vo/01.mp3", voSec: 8.36, tail: 12, caption: ["Your next hire is already in your database.", "Buried in 185,000 resumes…", "that nobody reads."] },
  { id: "Write", vo: "vo/02.mp3", voSec: 6.27, tail: 10, caption: ["Language models write.", "Beautifully. Slowly.", "And every word costs money."] },
  { id: "Decide", vo: "vo/03.mp3", voSec: 4.13, tail: 14, caption: ["But screening a resume isn't an essay.", "It's a decision."] },
  { id: "How", vo: "vo/04.mp3", voSec: 11.23, tail: 12, caption: ["So we split the job.", "An LLM writes the questions, once.", "A classification model answers them for every single resume…", "and points to the exact line that proves it."] },
  { id: "Race", vo: "vo/05.mp3", voSec: 6.03, tail: 12, caption: ["Same resumes. Same questions.", "8× faster.", "31× cheaper."] },
  { id: "Agree", vo: "vo/06.mp3", voSec: 4.05, tail: 16, caption: ["With 99% the same verdicts as a frontier LLM."] },
  { id: "OpenAI", vo: "vo/07.mp3", voSec: 5.64, tail: 12, caption: ["And yesterday, OpenAI launched a Decisions API.", "Welcome to the club."] },
  { id: "CTA", vo: "vo/08.mp3", voSec: 6.92, tail: 45, caption: ["Resurface. Open source, built on Jev.", "Keep your ATS. Rediscover your talent."] },
] as const;

export const FPS = 30;
export const sceneFrames = (i: number) => Math.ceil(SCENES[i].voSec * FPS) + SCENES[i].tail;
export const TOTAL = SCENES.reduce((s, _, i) => s + sceneFrames(i), 0);
