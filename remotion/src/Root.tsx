import React from "react";
import { Composition } from "remotion";
import { LineupIntro, lineupIntroSchema, PLAYER_SECONDS } from "./compositions/LineupIntro";
import { defaultProps } from "./compositions/defaultProps";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LineupIntro"
      component={LineupIntro}
      // 1s opener + 3s player clip per player, no outro.
      durationInFrames={Math.round(FPS * PLAYER_SECONDS * defaultProps.players.length)}
      fps={FPS}
      width={1080}
      height={1920}           // 9:16
      defaultProps={defaultProps}
      schema={lineupIntroSchema}
    />
  </>
);
