import { useState, useCallback, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type Player from 'video.js/dist/types/player';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';

// Function to detect YouTube URL pattern
const isYoutubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

// Function to convert YouTube URL to proper format for VideoJS
const getYoutubeId = (url: string): string | null => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
};

// Function to convert time string to seconds
const timeToSeconds = (timeStr: string): number | null => {
  if (!timeStr) return null;

  // Handle different time formats: HH:MM:SS, MM:SS, or SS
  const parts = timeStr.split(':').map((part) => parseInt(part, 10));

  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS format
    return parts[0];
  }

  return null;
};

const VideoPlayerContainer = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startSeconds, setStartSeconds] = useState<number | null>(null);
  const [endSeconds, setEndSeconds] = useState<number | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isYoutube, setIsYoutube] = useState(false);

  const handleLoadVideo = useCallback(() => {
    if (videoUrl) {
      // First check if it's a YouTube video
      const isYT = isYoutubeUrl(videoUrl);
      setIsYoutube(isYT);

      // Convert start and end times to seconds
      const start = timeToSeconds(startTime);
      const end = timeToSeconds(endTime);

      setStartSeconds(start);
      setEndSeconds(end);

      // Set the current video URL last to trigger player update
      setCurrentVideoUrl(videoUrl);
    }
  }, [videoUrl, startTime, endTime]);

  // Apply time controls when player or time values change
  useEffect(() => {
    if (!player || isYoutube) return; // Skip for YouTube videos, handled by URL params

    // Start time handling for direct videos
    if (startSeconds !== null) {
      player.currentTime(startSeconds);
    }

    // End time handling for direct videos
    if (endSeconds !== null) {
      const timeUpdateHandler = () => {
        const currentTime = player.currentTime();
        if (
          currentTime !== undefined &&
          endSeconds !== null &&
          currentTime >= endSeconds
        ) {
          player.pause();
          player.off('timeupdate', timeUpdateHandler);
        }
      };

      player.on('timeupdate', timeUpdateHandler);

      // Clean up the event handler when component unmounts or values change
      return () => {
        player.off('timeupdate', timeUpdateHandler);
      };
    }
  }, [player, startSeconds, endSeconds, isYoutube]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLoadVideo();
      }
    },
    [handleLoadVideo]
  );

  const getVideoSource = useCallback(() => {
    if (!currentVideoUrl) return [];

    if (isYoutubeUrl(currentVideoUrl)) {
      const youtubeId = getYoutubeId(currentVideoUrl);
      if (youtubeId) {
        // Use YouTube embed URL format instead of watch URL format
        // This is the format that properly supports both start and end times
        let youtubeUrl = `https://www.youtube.com/embed/${youtubeId}`;

        // Add query parameters
        const params = new URLSearchParams();

        // Add start and end times if specified
        if (startSeconds !== null) {
          params.append('start', startSeconds.toString());
        }

        if (endSeconds !== null) {
          params.append('end', endSeconds.toString());
        }

        // Add parameters to URL
        if (params.toString()) {
          youtubeUrl += `?${params.toString()}`;
        }

        return [
          {
            src: youtubeUrl,
            type: 'video/youtube',
          },
        ];
      }
    }

    // For direct video URLs, try to determine type or default to mp4
    return [
      {
        src: currentVideoUrl,
        type: currentVideoUrl.includes('.mp4')
          ? 'video/mp4'
          : currentVideoUrl.includes('.webm')
          ? 'video/webm'
          : currentVideoUrl.includes('.ogg')
          ? 'video/ogg'
          : 'video/mp4',
      },
    ];
  }, [currentVideoUrl, startSeconds, endSeconds]);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: getVideoSource(),
  };

  const handlePlayerReady = useCallback((videoPlayer: Player) => {
    // Store the player instance to use in effects
    setPlayer(videoPlayer);

    // No need for special handling of YouTube end times anymore
    // The embed URL with end parameter will handle it automatically
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Video Player</CardTitle>
      </CardHeader>
      <CardContent>
        {currentVideoUrl ? (
          <VideoPlayer
            options={videoJsOptions}
            onReady={handlePlayerReady}
            startTime={startSeconds}
            endTime={endSeconds}
          />
        ) : (
          <div className="w-full aspect-video bg-slate-800 flex items-center justify-center text-white">
            Enter a video URL to start playing
          </div>
        )}
        <div className="mt-4 space-y-3">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter video URL (direct link or YouTube)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleLoadVideo}>Load Video</Button>
          </div>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Start time (HH:MM:SS, MM:SS, or SS) - Optional"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="End time (HH:MM:SS, MM:SS, or SS) - Optional"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        Supports direct video links and YouTube URLs with optional start and end
        times
      </CardFooter>
    </Card>
  );
};

export default VideoPlayerContainer;
