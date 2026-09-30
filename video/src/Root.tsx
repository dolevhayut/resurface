import React from "react";
import { Composition, Folder } from "remotion";
import { Launch } from "./Launch";
import { FPS, SCENES, TOTAL, sceneFrames } from "./scenes/data";
import { H, W } from "./theme";
import { Hook } from "./scenes/Hook";
import { Write } from "./scenes/Write";
import { Decide } from "./scenes/Decide";
import { How } from "./scenes/How";
import { Race } from "./scenes/Race";
import { Agree } from "./scenes/Agree";
import { OpenAI } from "./scenes/OpenAI";
import { CTA } from "./scenes/CTA";

const SCENE_COMPONENTS = [Hook, Write, Decide, How, Race, Agree, OpenAI, CTA];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ResurfaceLaunch" component={Launch} width={W} height={H} fps={FPS} durationInFrames={TOTAL} defaultProps={{ music: true }} />
    <Folder name="Scenes">
      {SCENES.map((s, i) => (
        <Composition key={s.id} id={s.id} component={SCENE_COMPONENTS[i]} width={W} height={H} fps={FPS} durationInFrames={sceneFrames(i)} />
      ))}
    </Folder>
  </>
);
