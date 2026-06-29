import React from "react";
import { Composition } from "remotion";
import {
  LineupIntro,
  lineupIntroSchema,
  calculateLineupMetadata,
  FPS,
} from "./compositions/LineupIntro";
import { defaultProps } from "./compositions/defaultProps";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LineupIntro"
      component={LineupIntro}
      // Duration is computed from the clip(s) via calculateMetadata — no cap.
      // The static value here is just a placeholder before metadata resolves.
      durationInFrames={Math.round(FPS * 4)}
      fps={FPS}
      width={1080}
      height={1920}           // 9:16
      defaultProps={defaultProps}
      schema={lineupIntroSchema}
      calculateMetadata={calculateLineupMetadata}
    />
  </>
);
