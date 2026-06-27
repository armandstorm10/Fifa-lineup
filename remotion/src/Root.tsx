import React from "react";
import { Composition } from "remotion";
import { LineupIntro, lineupIntroSchema } from "./compositions/LineupIntro";
import { defaultProps } from "./compositions/defaultProps";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LineupIntro"
      component={LineupIntro}
      durationInFrames={150}  // 5 seconds at 30fps
      fps={30}
      width={1080}
      height={1920}           // 9:16
      defaultProps={defaultProps}
      schema={lineupIntroSchema}
    />
  </>
);
