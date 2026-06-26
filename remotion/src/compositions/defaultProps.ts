import { CompositionProps } from "./LineupIntro";

export const defaultProps: CompositionProps = {
  players: [
    {
      id: "preview-player",
      name: "Themba Zwane",
      country: "ZA",
      position: "CAM",
      shirtNumber: 10,
      clipPath: "",
    },
  ],
  template: "world-cup-gold",
  aspectRatio: "9:16",
  watermark: true,
  resolution: 480,
};
