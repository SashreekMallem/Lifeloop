'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, SkipForward, SkipBack, Shuffle, Music, Clock, Heart, List, User, AlertCircle } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration?: number;
  playbackPosition?: number;
  isPlaying?: boolean;
  isLiked?: boolean;
  genre?: string;
  previewUrl?: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  artwork?: string;
  isPublic?: boolean;
  owner?: string;
}

interface AmazonMusicData {
  status: 'success' | 'requires_authentication' | 'error';
  currentlyPlaying?: Track;
  recentlyPlayed?: Track[];
  recommendations?: Track[];
  topPlaylists?: Playlist[];
  listeningStats?: {
    totalPlayTime: number;
    songsPlayed: number;
    topGenre: string;
    topArtist: string;
  };
  quickActions?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  error?: string;
}

interface AmazonMusicWidgetProps {
  data?: AmazonMusicData;
  className?: string;
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatPlayTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const AmazonMusicWidget: React.FC<AmazonMusicWidgetProps> = ({ 
  data, 
  className = '' 
}) => {
  // Handle authentication required state
  if (data?.status === 'requires_authentication') {
    return (
      <Card className={`amazon-music-widget auth-required ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Amazon Music</h3>
              <p className="text-sm text-gray-500">Connect to see your music</p>
            </div>
          </div>

          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Connect your Amazon Music account to see your listening activity</p>
            <button className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-yellow-700 transition-colors text-sm font-medium">
              Connect Amazon Music  
            </button>
          </div>

          {data.quickActions && (
            <div className="flex gap-2 mt-4">
              {data.quickActions.map((action) => (
                <button
                  key={action.id}
                  className="flex-1 p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  {action.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (data?.status === 'error') {
    return (
      <Card className={`amazon-music-widget error ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Amazon Music</h3>
              <p className="text-sm text-red-500">Connection error</p>
            </div>
          </div>

          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">{data.error || 'Unable to connect to Amazon Music'}</p>
          </div>

          {data.quickActions && (
            <div className="flex gap-2 mt-4">
              {data.quickActions.map((action) => (
                <button
                  key={action.id}
                  className="flex-1 p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  {action.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Success state - show music data
  const { currentlyPlaying, recentlyPlayed, recommendations, listeningStats, quickActions } = data || {};

  return (
    <Card className={`amazon-music-widget ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Amazon Music</h3>
              <p className="text-sm text-gray-500">
                {currentlyPlaying?.isPlaying ? 'Now Playing' : 'Connected'}
              </p>
            </div>
          </div>
          {listeningStats && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{listeningStats.songsPlayed}</p>
              <p className="text-xs text-gray-500">songs played</p>
            </div>
          )}
        </div>

        {/* Currently Playing */}
        {currentlyPlaying && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-3">
              {currentlyPlaying.albumArt ? (
                <img 
                  src={currentlyPlaying.albumArt} 
                  alt={currentlyPlaying.album}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{currentlyPlaying.name}</p>
                <p className="text-sm text-gray-600 truncate">{currentlyPlaying.artist}</p>
                {currentlyPlaying.album && (
                  <p className="text-xs text-gray-500 truncate">{currentlyPlaying.album}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                {currentlyPlaying.isPlaying && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-orange-500 rounded animate-pulse"></div>
                    <div className="w-1 h-4 bg-orange-500 rounded animate-pulse delay-100"></div>
                    <div className="w-1 h-2 bg-orange-500 rounded animate-pulse delay-200"></div>
                  </div>
                )}
                {currentlyPlaying.isLiked && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
              </div>
            </div>
            
            {/* Progress bar */}
            {currentlyPlaying.duration && currentlyPlaying.playbackPosition !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{formatDuration(currentlyPlaying.playbackPosition)}</span>
                  <span>{formatDuration(currentlyPlaying.duration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(currentlyPlaying.playbackPosition / currentlyPlaying.duration) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Tracks */}
        {recentlyPlayed && recentlyPlayed.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">Recently Played</h4>
            </div>
            <div className="space-y-2">
              {recentlyPlayed.slice(0, 3).map((track, index) => (
                <div key={`${track.id}-${index}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{track.name}</p>
                    <p className="text-xs text-gray-600 truncate">{track.artist}</p>
                  </div>
                  {track.duration && (
                    <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listening Stats */}
        {listeningStats && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Your Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-lg font-semibold text-orange-600">
                  {formatPlayTime(listeningStats.totalPlayTime)}
                </p>
                <p className="text-xs text-gray-600">Total listening</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-lg font-semibold text-yellow-600">{listeningStats.topGenre}</p>
                <p className="text-xs text-gray-600">Top genre</p>
              </div>
            </div>
            {listeningStats.topArtist && (
              <div className="mt-3 text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{listeningStats.topArtist}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Top artist</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <div className="flex gap-2">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                className="flex-1 p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
                title={action.description}
              >
                {action.name}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!currentlyPlaying && (!recentlyPlayed || recentlyPlayed.length === 0) && (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No music activity yet</p>
            <p className="text-sm text-gray-400">Start playing music to see your activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AmazonMusicWidget;
