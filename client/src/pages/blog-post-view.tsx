import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { MemberRoute } from '@/lib/member-route';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'published' | 'draft';
  tags?: string[];
  authorFirstName: string;
  authorLastName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  likeCount?: number;
}

interface BlogPostViewProps {
  membershipData?: {
    isMember: boolean;
    collectiveRole?: string;
  };
}

function BlogPostViewComponent({ membershipData }: BlogPostViewProps) {
  const { siteId, postId } = useParams() as { siteId: string; postId: string };

  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/sites/${siteId}/blog-posts/${postId}`],
    enabled: !!siteId && !!postId,
  }) as { data: BlogPost | undefined; isLoading: boolean; error: any };

  const formatBlogDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('## ')) {
          return `<h2 class="text-xl font-semibold text-white mt-6 mb-3">${line.substring(3)}</h2>`;
        }
        if (line.startsWith('### ')) {
          return `<h3 class="text-lg font-semibold text-white mt-4 mb-2">${line.substring(4)}</h3>`;
        }
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
        // Code/emphasis
        line = line.replace(/`(.*?)`/g, '<code class="bg-slate-600 px-1 py-0.5 rounded text-sm text-cyan-400">$1</code>');
        
        // Empty lines become spacing
        if (line.trim() === '') {
          return '<div class="h-2"></div>';
        }
        
        // List items
        if (line.startsWith('- ')) {
          return `<li class="text-slate-300 ml-4">${line.substring(2)}</li>`;
        }
        
        // Regular paragraphs
        return `<p class="text-slate-300 mb-3">${line}</p>`;
      })
      .join('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Article not found or access denied</p>
          <Link href={`/site/${siteId}/home`}>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collective
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link href={`/site/${siteId}/home`}>
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
                data-testid="back-to-collective-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collective
              </Button>
            </Link>
            <div className="text-sm text-slate-400">
              <span className="text-cyan-400">Article</span> / {post.title}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="bg-slate-800/50 border-slate-700" data-testid="blog-post-content">
            <CardContent className="p-8">
              {/* Article Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  {post.status === 'draft' && (
                    <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                      Draft
                    </Badge>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.map((tag: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="border-cyan-600/30 text-cyan-400 bg-cyan-600/10"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-white mb-4" data-testid="blog-post-title">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="text-lg text-slate-400 mb-6 italic" data-testid="blog-post-excerpt">
                    {post.excerpt}
                  </p>
                )}

                {/* Author and Date Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 border-b border-slate-700 pb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>By <span className="text-white">{post.authorFirstName} {post.authorLastName}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Published {formatBlogDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                  {post.publishedAt !== post.createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatBlogDate(post.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Article Body */}
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                data-testid="blog-post-body"
              />

              {/* Article Footer */}
              <div className="mt-12 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    <p>Views: {post.viewCount || 0} • Likes: {post.likeCount || 0}</p>
                  </div>
                  <Link href={`/site/${siteId}/home`}>
                    <Button 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      data-testid="back-to-feed-button"
                    >
                      Back to Feed
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
}

export default function BlogPostView() {
  const { siteId } = useParams() as { siteId: string };
  
  return (
    <MemberRoute 
      component={BlogPostViewComponent}
      siteId={siteId}
    />
  );
}