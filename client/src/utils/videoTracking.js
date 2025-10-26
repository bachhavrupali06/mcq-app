// Video Tracking Utility for YouTube IFrame Player API
// This file handles all video tracking logic for exam results

let YouTubePlayerAPI = null;
let playersMap = new Map(); // Store multiple players by session ID

// Generate unique session ID for each video instance
export const generateSessionId = (questionId, videoUrl) => {
  return `video-${questionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Load YouTube IFrame Player API
export const loadYouTubeAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      YouTubePlayerAPI = window.YT;
      resolve(window.YT);
      return;
    }

    // Check if script is already loading
    if (window.onYouTubeIframeAPIReady) {
      // Script is loading, wait for it
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalCallback();
        YouTubePlayerAPI = window.YT;
        resolve(window.YT);
      };
      return;
    }

    // Load the script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      YouTubePlayerAPI = window.YT;
      resolve(window.YT);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!YouTubePlayerAPI) {
        reject(new Error('YouTube API failed to load'));
      }
    }, 10000);
  });
};

// Extract YouTube video ID from URL
export const getYouTubeVideoId = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
  } catch (e) {
    // If URL parsing fails, try regex
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/);
    return match ? match[1] : null;
  }
  return null;
};

// Track video event to backend
export const trackVideoEvent = async (eventData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found for video tracking');
      return;
    }

    await fetch('/api/video-watch-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error('Error tracking video event:', error);
    // Fail silently to not disrupt student experience
  }
};

// Create and initialize a tracked YouTube player
export const createTrackedPlayer = async (containerId, videoUrl, questionId, examResultId, onReady = null) => {
  const sessionId = generateSessionId(questionId, videoUrl);
  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    console.error('Invalid YouTube URL:', videoUrl);
    return null;
  }

  try {
    // Ensure YouTube API is loaded
    if (!YouTubePlayerAPI) {
      await loadYouTubeAPI();
    }

    let playerData = {
      sessionId,
      questionId,
      examResultId,
      videoUrl,
      startTime: null,
      lastProgressUpdate: 0,
      totalDuration: 0,
      watchDuration: 0,
      hasStarted: false,
      progressInterval: null
    };

    // Create player
    const player = new YouTubePlayerAPI.Player(containerId, {
      videoId: videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          playerData.totalDuration = event.target.getDuration();
          if (onReady) onReady(event);
        },
        onStateChange: (event) => {
          handleStateChange(event, player, playerData);
        }
      }
    });

    playersMap.set(sessionId, { player, data: playerData });
    return { player, sessionId };
  } catch (error) {
    console.error('Error creating tracked player:', error);
    return null;
  }
};

// Handle player state changes
const handleStateChange = (event, player, playerData) => {
  const state = event.data;

  // Playing
  if (state === YouTubePlayerAPI.PlayerState.PLAYING) {
    if (!playerData.hasStarted) {
      playerData.hasStarted = true;
      playerData.startTime = Date.now();
      
      // Track start event
      trackVideoEvent({
        question_id: playerData.questionId,
        exam_result_id: playerData.examResultId,
        video_url: playerData.videoUrl,
        session_id: playerData.sessionId,
        watch_duration_seconds: 0,
        video_total_duration_seconds: playerData.totalDuration,
        completion_percentage: 0,
        event_type: 'start'
      });
    }

    // Start progress tracking interval
    if (!playerData.progressInterval) {
      playerData.progressInterval = setInterval(() => {
        updateProgress(player, playerData);
      }, 10000); // Every 10 seconds
    }
  }

  // Paused or Buffering
  if (state === YouTubePlayerAPI.PlayerState.PAUSED || 
      state === YouTubePlayerAPI.PlayerState.BUFFERING) {
    // Clear progress interval
    if (playerData.progressInterval) {
      clearInterval(playerData.progressInterval);
      playerData.progressInterval = null;
    }
    
    // Update progress one last time
    updateProgress(player, playerData);
  }

  // Ended
  if (state === YouTubePlayerAPI.PlayerState.ENDED) {
    if (playerData.progressInterval) {
      clearInterval(playerData.progressInterval);
      playerData.progressInterval = null;
    }
    
    // Final update with 100% completion
    const completion = 100;
    trackVideoEvent({
      question_id: playerData.questionId,
      exam_result_id: playerData.examResultId,
      video_url: playerData.videoUrl,
      session_id: playerData.sessionId,
      watch_duration_seconds: playerData.watchDuration,
      video_total_duration_seconds: playerData.totalDuration,
      completion_percentage: completion,
      event_type: 'end'
    });
  }
};

// Update watch progress
const updateProgress = (player, playerData) => {
  try {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    if (duration > 0) {
      const completion = Math.min((currentTime / duration) * 100, 100);
      
      // Update watch duration (time actually spent watching)
      const now = Date.now();
      if (playerData.startTime) {
        const elapsedSeconds = (now - playerData.startTime) / 1000;
        playerData.watchDuration = Math.min(elapsedSeconds, duration);
      }

      playerData.totalDuration = duration;

      // Don't track too frequently (at least 5 seconds between updates)
      const timeSinceLastUpdate = now - playerData.lastProgressUpdate;
      if (timeSinceLastUpdate >= 5000) {
        playerData.lastProgressUpdate = now;

        trackVideoEvent({
          question_id: playerData.questionId,
          exam_result_id: playerData.examResultId,
          video_url: playerData.videoUrl,
          session_id: playerData.sessionId,
          watch_duration_seconds: playerData.watchDuration,
          video_total_duration_seconds: playerData.totalDuration,
          completion_percentage: completion,
          event_type: 'progress'
        });
      }
    }
  } catch (error) {
    console.error('Error updating progress:', error);
  }
};

// Cleanup player on unmount
export const cleanupPlayer = (sessionId) => {
  const playerInfo = playersMap.get(sessionId);
  if (playerInfo) {
    if (playerInfo.data.progressInterval) {
      clearInterval(playerInfo.data.progressInterval);
    }
    if (playerInfo.player && playerInfo.player.destroy) {
      playerInfo.player.destroy();
    }
    playersMap.delete(sessionId);
  }
};

// Cleanup all players
export const cleanupAllPlayers = () => {
  playersMap.forEach((playerInfo, sessionId) => {
    cleanupPlayer(sessionId);
  });
  playersMap.clear();
};
