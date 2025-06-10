import { z } from 'zod';

// Input schema for Amazon Music data
const AmazonMusicInputSchema = z.object({
  oauthToken: z.string().optional(),
  includeCurrentlyPlaying: z.boolean().optional().default(true),
  includeRecentlyPlayed: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true),
  includeLibrary: z.boolean().optional().default(false),
  limit: z.number().min(1).max(50).optional().default(20)
});

// Track schema
const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArt: z.string().optional(),
  duration: z.number().optional(), // in milliseconds
  playbackPosition: z.number().optional(), // current position in milliseconds
  isPlaying: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  genre: z.string().optional(),
  releaseDate: z.string().optional(),
  playCount: z.number().optional(),
  previewUrl: z.string().optional()
});

// Playlist schema
const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  trackCount: z.number(),
  artwork: z.string().optional(),
  isPublic: z.boolean().optional(),
  lastModified: z.string().optional(),
  owner: z.string().optional()
});

// Output schema
const AmazonMusicOutputSchema = z.object({
  status: z.enum(['success', 'requires_authentication', 'error']),
  currentlyPlaying: TrackSchema.optional(),
  recentlyPlayed: z.array(TrackSchema).optional(),
  recommendations: z.array(TrackSchema).optional(),
  topPlaylists: z.array(PlaylistSchema).optional(),
  listeningStats: z.object({
    totalPlayTime: z.number(), // in minutes
    songsPlayed: z.number(),
    topGenre: z.string(),
    topArtist: z.string()
  }).optional(),
  quickActions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string()
  })).optional(),
  error: z.string().optional()
});

export type AmazonMusicInput = z.infer<typeof AmazonMusicInputSchema>;
export type AmazonMusicOutput = z.infer<typeof AmazonMusicOutputSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;

// Amazon Music Web API base URL
const AMAZON_MUSIC_API_BASE = 'https://music-api.amazon.dev/v1';

// Amazon Music API integration
const fetchAmazonMusicData = async (token: string, input: AmazonMusicInput): Promise<AmazonMusicOutput> => {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const results: Partial<AmazonMusicOutput> = { status: 'success' };

    // Fetch currently playing track
    if (input.includeCurrentlyPlaying) {
      try {
        const response = await fetch(`${AMAZON_MUSIC_API_BASE}/me/player/currently-playing`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            results.currentlyPlaying = {
              id: data.item.id,
              name: data.item.name,
              artist: data.item.artists?.[0]?.name || 'Unknown Artist',
              album: data.item.album?.name || 'Unknown Album',
              albumArt: data.item.album?.images?.[0]?.url,
              duration: data.item.duration_ms,
              playbackPosition: data.progress_ms,
              isPlaying: data.is_playing,
              genre: data.item.genres?.[0],
              releaseDate: data.item.album?.release_date,
              previewUrl: data.item.preview_url
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch currently playing:', error);
      }
    }

    // Fetch recently played tracks
    if (input.includeRecentlyPlayed) {
      try {
        const response = await fetch(`${AMAZON_MUSIC_API_BASE}/me/player/recently-played?limit=${input.limit}`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          results.recentlyPlayed = data.items?.map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists?.[0]?.name || 'Unknown Artist',
            album: item.track.album?.name || 'Unknown Album',
            albumArt: item.track.album?.images?.[0]?.url,
            duration: item.track.duration_ms,
            genre: item.track.genres?.[0],
            releaseDate: item.track.album?.release_date,
            previewUrl: item.track.preview_url
          })) || [];
        }
      } catch (error) {
        console.warn('Failed to fetch recently played:', error);
      }
    }

    // Fetch recommendations
    if (input.includeRecommendations) {
      try {
        const response = await fetch(`${AMAZON_MUSIC_API_BASE}/recommendations/tracks?limit=${input.limit}`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          results.recommendations = data.tracks?.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists?.[0]?.name || 'Unknown Artist',
            album: track.album?.name || 'Unknown Album',
            albumArt: track.album?.images?.[0]?.url,
            duration: track.duration_ms,
            genre: track.genres?.[0],
            releaseDate: track.album?.release_date,
            previewUrl: track.preview_url
          })) || [];
        }
      } catch (error) {
        console.warn('Failed to fetch recommendations:', error);
      }
    }

    // Fetch user playlists
    if (input.includeLibrary) {
      try {
        const response = await fetch(`${AMAZON_MUSIC_API_BASE}/me/playlists?limit=${input.limit}`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          results.topPlaylists = data.items?.map((playlist: any) => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            trackCount: playlist.tracks?.total || 0,
            artwork: playlist.images?.[0]?.url,
            isPublic: playlist.public,
            owner: playlist.owner?.display_name
          })) || [];
        }
      } catch (error) {
        console.warn('Failed to fetch playlists:', error);
      }
    }

    // Generate listening stats (mock data for now, as Amazon Music API might not provide detailed stats)
    results.listeningStats = {
      totalPlayTime: Math.floor(Math.random() * 500) + 100, // Mock data
      songsPlayed: Math.floor(Math.random() * 100) + 20,
      topGenre: results.recentlyPlayed?.[0]?.genre || 'Pop',
      topArtist: results.recentlyPlayed?.[0]?.artist || 'Various Artists'
    };

    // Add quick actions
    results.quickActions = [
      {
        id: 'play-pause',
        name: 'Play/Pause',
        description: 'Control playback',
        icon: 'Play'
      },
      {
        id: 'next-track',
        name: 'Next Track',
        description: 'Skip to next song',
        icon: 'SkipForward'
      },
      {
        id: 'previous-track',
        name: 'Previous Track',
        description: 'Go to previous song',
        icon: 'SkipBack'
      },
      {
        id: 'shuffle',
        name: 'Shuffle',
        description: 'Toggle shuffle mode',
        icon: 'Shuffle'
      }
    ];

    return results as AmazonMusicOutput;

  } catch (error) {
    console.error('Error with Amazon Music integration:', error);
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Amazon Music integration error'
    };
  }
};

// Main flow
export async function getAmazonMusicData(input: AmazonMusicInput): Promise<AmazonMusicOutput> {
  console.log('[Amazon Music Flow] Starting with input:', input);

  // Check for OAuth token
  if (!input.oauthToken) {
    console.log('[Amazon Music Flow] No OAuth token provided, authentication required');
    return {
      status: 'requires_authentication' as const,
      error: 'Amazon Music authentication required. Please connect your Amazon account and ensure you have an active Amazon Music subscription.',
      quickActions: [
        {
          id: 'connect-amazon',
          name: 'Connect Amazon Music',
          description: 'Sign in with your Amazon account',
          icon: 'Music'
        },
        {
          id: 'learn-more',
          name: 'Learn More',
          description: 'About Amazon Music integration',
          icon: 'Info'
        }
      ]
    };
  }

  try {
    // Fetch data from Amazon Music API
    const result = await fetchAmazonMusicData(input.oauthToken, input);
    console.log('[Amazon Music Flow] Amazon Music integration completed');
    return result;
  } catch (error) {
    console.error('[Amazon Music Flow] Error:', error);
    
    return {
      status: 'error' as const,
      error: `Failed to fetch Amazon Music data: ${error instanceof Error ? error.message : String(error)}`,
      quickActions: [
        {
          id: 'retry-connection',
          name: 'Retry',
          description: 'Try connecting again',
          icon: 'RefreshCw'
        },
        {
          id: 'check-subscription',
          name: 'Check Subscription',
          description: 'Verify Amazon Music subscription',
          icon: 'AlertCircle'
        }
      ]
    };
  }
}
