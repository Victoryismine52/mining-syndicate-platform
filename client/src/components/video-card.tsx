
import React, { useState } from 'react';
import { FormTemplate } from '@shared/schema';

interface VideoCardProps {
  template: FormTemplate;
  className?: string;
}

export function VideoCard({ template, className = "" }: VideoCardProps) {
  const config = template.config;
  
  // Determine video platform and ID
  let embedUrl = '';
  let platform = '';
  
  if (config.youtubeVideoId) {
    platform = 'YouTube';
    embedUrl = `https://www.youtube.com/embed/${config.youtubeVideoId}?` + 
      new URLSearchParams({
        autoplay: config.autoplay ? '1' : '0',
        controls: config.showControls ? '1' : '0',
        rel: '0', // Don't show related videos
        modestbranding: '1', // Minimal YouTube branding
      }).toString();
  } else if (config.vimeoVideoId) {
    platform = 'Vimeo';
    // Clean the video ID - remove any URL parts if user pasted full URL
    const cleanVideoId = config.vimeoVideoId.toString().replace(/.*vimeo\.com\//, '').split('?')[0];
    
    const vimeoParams: Record<string, string> = {
      autoplay: config.autoplay ? '1' : '0',
      controls: config.showControls ? '1' : '0',
      title: '0', // Hide title
      byline: '0', // Hide byline  
      portrait: '0', // Hide portrait
      dnt: '1', // Do not track
    };
    
    // Add hash parameter if provided
    if (config.vimeoHash) {
      vimeoParams.h = config.vimeoHash;
    }
    
    embedUrl = `https://player.vimeo.com/video/${cleanVideoId}?` + 
      new URLSearchParams(vimeoParams).toString();
    
    // Debug logging for Vimeo videos
    console.log('Vimeo Video Debug:', {
      originalId: config.vimeoVideoId,
      cleanId: cleanVideoId,
      finalUrl: embedUrl
    });
  } else {
    return (
      <div className={`bg-red-500/20 border border-red-500 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">Invalid video configuration - no video ID provided</p>
      </div>
    );
  }

  // Add error display for videos that might not load
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-amber-500/20 border border-amber-500 rounded-lg p-6 ${className}`}>
        <h3 className="text-amber-400 font-medium mb-2">Video Loading Issue</h3>
        <p className="text-amber-300 text-sm mb-3">
          This {platform} video couldn't be loaded. This might be because:
        </p>
        <ul className="text-amber-300 text-sm space-y-1 mb-4">
          <li>• The video is private or restricted</li>
          <li>• The video ID is incorrect</li>
          <li>• Embedding is disabled for this video</li>
        </ul>
        <p className="text-amber-400 text-xs">
          Video ID: <code className="bg-amber-900/30 px-1 rounded">{platform === 'Vimeo' ? config.vimeoVideoId : config.youtubeVideoId}</code>
        </p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-3 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Card Header */}
      {(config.title || config.subtitle) && (
        <div className="p-6 pb-4">
          {config.title && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {config.title}
            </h3>
          )}
          {config.subtitle && (
            <p className="text-gray-600 dark:text-gray-400">
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Video Embed */}
      <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <iframe
          src={embedUrl}
          title={config.title || `${platform} Video`}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          data-testid={`${platform.toLowerCase()}-embed`}
          onError={(e) => {
            console.error(`${platform} video failed to load:`, e);
            console.error('Failed URL:', embedUrl);
            setHasError(true);
          }}
        />
      </div>

      {/* Card Footer */}
      {config.description && (
        <div className="p-6 pt-4">
          <p className="text-gray-700 dark:text-gray-300">
            {config.description}
          </p>
        </div>
      )}
    </div>
  );
}
