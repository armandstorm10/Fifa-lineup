# Audio assets

Remotion renders are self-contained and can only use files under `remotion/public`
(via `staticFile`). Place the crowd-cheer bed here:

    remotion/public/audio/397434_foolboymedia__crowd-cheer.wav

The backend (`backend/src/services/renderer.ts`) checks for this exact file and
only enables the `crowdAudio` track in the render when it exists, so a missing
file never breaks rendering. Commit the WAV so renders work everywhere.
