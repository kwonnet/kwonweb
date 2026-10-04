type Player = {
  play(): Promise<unknown>;
  pause(): Promise<unknown> | void;
};

/** Visibility may suspend playback, but must never override a user's pause. */
export function createVideoPlayback(player: Player, autoPlay: boolean) {
  let wantsPlayback = autoPlay;
  let available = false;
  let disposed = false;

  const pause = () => {
    void Promise.resolve()
      .then(() => {
        if (!disposed && (!available || !wantsPlayback)) return player.pause();
      })
      .catch(() => {});
  };

  return {
    userPlay() {
      wantsPlayback = true;
    },
    userPause() {
      wantsPlayback = false;
    },
    ended() {
      wantsPlayback = false;
    },
    update(inView: boolean, visible: boolean, canPlay: boolean) {
      const nextAvailable = inView && visible && canPlay;
      if (disposed || nextAvailable === available) return;
      available = nextAvailable;
      if (!available) {
        pause();
      } else if (wantsPlayback) {
        void player
          .play()
          .then(() => {
            // A slow play request must not win over a later pause or tab change.
            if (!disposed && (!available || !wantsPlayback)) pause();
          })
          .catch(() => {});
      }
    },
    dispose() {
      disposed = true;
    },
  };
}
