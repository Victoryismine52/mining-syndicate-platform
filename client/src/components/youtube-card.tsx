import React from 'react';
import { FormTemplate } from '@shared/schema';

interface YouTubeCardProps {
  template: FormTemplate;
  className?: string;
}

export function YouTubeCard({ template, className = "" }: YouTubeCardProps) {
  const config = template.config;
  
  if (!config.youtubeVideoId) {
    return (
      <div className={`bg-red-500/20 border border-red-500 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">Invalid YouTube video configuration</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${config.youtubeVideoId}?` + 
    new URLSearchParams({
      autoplay: config.autoplay ? '1' : '0',
      controls: config.showControls ? '1' : '0',
      rel: '0', // Don't show related videos
      modestbranding: '1', // Minimal YouTube branding
    }).toString();

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

      {/* YouTube Embed */}
      <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <iframe
          src={embedUrl}
          title={config.title || "YouTube Video"}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          data-testid="youtube-embed"
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