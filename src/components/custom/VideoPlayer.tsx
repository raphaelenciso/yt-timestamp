/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';
import 'videojs-youtube';

// Add custom CSS for better time display and time range highlighting
const customStyles = `
.video-js .vjs-time-control {
  display: block !important;
}
.video-js .vjs-current-time {
  display: block !important;
  padding-right: 0;
}
.video-js .vjs-duration {
  display: block !important;
}
.video-js .vjs-time-divider {
  display: block !important;
}
.video-js .vjs-remaining-time {
  display: none !important;
}

/* Time range highlight styles */
.vjs-time-range-highlight {
  position: absolute;
  height: 100%;
  background-color: rgba(255, 204, 0, 0.3);
  pointer-events: none;
  z-index: 1;
  border-left: 2px solid rgba(255, 204, 0, 0.7);
  border-right: 2px solid rgba(255, 204, 0, 0.7);
}

.vjs-progress-control:hover .vjs-time-range-highlight {
  background-color: rgba(255, 204, 0, 0.5);
}
`;

interface VideoPlayerProps {
  options: {
    autoplay?: boolean;
    controls?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    controlBar?: Record<string, unknown>;
    sources: {
      src: string;
      type?: string;
    }[];
  };
  startTime?: number | null;
  endTime?: number | null;
  onReady?: (player: Player) => void;
}

const VideoPlayer = ({
  options,
  startTime,
  endTime,
  onReady,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Add custom CSS to document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to create and update time range highlight
  const updateTimeRangeHighlight = (player: Player) => {
    if (!player || !startTime || !endTime) return;

    // Get the progress control element
    const progressControl = player.el().querySelector('.vjs-progress-control');
    if (!progressControl) return;

    // Create highlight element if it doesn't exist
    if (!highlightRef.current) {
      const highlight = document.createElement('div');
      highlight.className = 'vjs-time-range-highlight';
      progressControl
        .querySelector('.vjs-progress-holder')
        ?.appendChild(highlight);
      highlightRef.current = highlight;
    }

    // Get video duration and calculate positions
    const duration = player.duration();
    if (!duration || duration <= 0) return;

    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;
    const widthPercent = endPercent - startPercent;

    // Apply styles to highlight element
    if (highlightRef.current) {
      highlightRef.current.style.left = `${startPercent}%`;
      highlightRef.current.style.width = `${widthPercent}%`;
    }
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Initialize the Video.js player
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const defaultOptions = {
        techOrder: ['youtube', 'html5'],
        youtube: { enablejsapi: 1 },
        controlBar: {
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          remainingTimeDisplay: false,
          progressControl: {
            seekBar: true,
          },
        },
      };

      const player = videojs(
        videoElement,
        {
          ...defaultOptions,
          ...options,
        },
        () => {
          if (onReady && playerRef.current) {
            onReady(playerRef.current);
          }
        }
      );

      playerRef.current = player;

      // Force time display to be visible through class modification
      player.on('loadedmetadata', () => {
        // Use querySelector to directly modify the elements
        const playerElement = player.el();
        const timeControls =
          playerElement.querySelectorAll('.vjs-time-control');
        timeControls.forEach((el) => {
          (el as HTMLElement).style.display = 'block';
        });

        // Update the time range highlight
        updateTimeRangeHighlight(player);
      });

      // Update highlight on time updates
      player.on('timeupdate', () => {
        updateTimeRangeHighlight(player);
      });

      player.on('play', () => {
        console.log('play');
      });

      // Add fcuntion on player on seeked
      // player.on('seeked', () => {
      //   const currentTime = player.currentTime();

      //   if (
      //     endTime !== null &&
      //     endTime !== undefined &&
      //     currentTime !== undefined &&
      //     currentTime > endTime
      //   ) {
      //     player.currentTime(endTime);
      //     player.pause();
      //   } else if (
      //     startTime !== null &&
      //     startTime !== undefined &&
      //     currentTime !== undefined &&
      //     currentTime < startTime
      //   ) {
      //     player.currentTime(startTime);
      //   }
      // });
    } else if (playerRef.current) {
      // Update player if sources change
      const player = playerRef.current;
      player.src(options.sources);

      // Update time range highlight when sources change
      player.on('loadedmetadata', () => {
        updateTimeRangeHighlight(player);
      });
    }
  }, [options, onReady, startTime, endTime]);

  // Update highlight when start or end time changes
  useEffect(() => {
    if (playerRef.current) {
      updateTimeRangeHighlight(playerRef.current);
    }
  }, [startTime, endTime]);

  // Dispose the player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
        highlightRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="w-full aspect-video" />
    </div>
  );
};

export default VideoPlayer;
