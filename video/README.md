# Resurface launch video

The 57-second launch video, built in [Remotion](https://remotion.dev). The final render is [`docs/launch/resurface-launch.mp4`](../docs/launch/resurface-launch.mp4).

- **Format:** 1080×1350 (4:5, LinkedIn/Instagram feed), 30 fps, burned-in captions
- **Voiceover:** ElevenLabs Eleven v4 (voice "Brian"), generated via fal, one clip per scene in `public/vo/`
- **Music:** ElevenLabs Music v2.5 instrumental bed (`public/music.mp3`)
- **Numbers:** every figure on screen comes from the benchmark in `../scripts/benchmark.mts`

```bash
cd video
npm i
npm run dev                                             # Remotion Studio
npx remotion render ResurfaceLaunch out/launch.mp4 --codec=h264 --crf=18
```

Scenes live in `src/scenes/`; the script, voiceover timings and captions are in `src/scenes/data.ts`. Each scene is also registered as its own composition under the "Scenes" folder in Studio.
