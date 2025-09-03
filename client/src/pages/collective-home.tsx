import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageCircle, FileText, CheckSquare, Users, Calendar, Settings, LogOut, Send, Plus, Edit } from 'lucide-react';
import { Link } from 'wouter';

interface CollectiveHomeProps {
  siteId: string;
  membershipData?: {
    isMember: boolean;
    collectiveRole?: string;
    membershipStatus?: string;
  };
}

export function CollectiveHome({ siteId, membershipData }: CollectiveHomeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('feed');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [feedType, setFeedType] = useState<'published' | 'drafts'>('published');
  // --- Task Details dialog state ---
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const openTaskDetails = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };


  // Permission helper - checks if user can create content (Brehon or higher)
  const canCreateContent = () => {
    const role = membershipData?.collectiveRole;
    return role === 'brehon' || role === 'ard_brehon';
  };

  // Helper function to open edit dialog with post data
  const openEditDialog = (post: any) => {
    setEditingPost(post);
    editForm.reset({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      status: post.status,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : ''
    });
    setShowEditDialog(true);
  };

  // Blog post form schema
  const blogPostSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().optional(),
    status: z.enum(['draft', 'published']).default('published'),
    tags: z.string().optional()
  });

  // Task assignment form schema
  const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    dueDate: z.string().optional(),
    taskType: z.enum(['general', 'document_review', 'verification', 'upload']).default('general'),
    assignTo: z.enum(['all_members', 'brehons_only', 'members_only', 'specific_users']).default('all_members'),
    specificUsers: z.array(z.string()).optional(),
    documentUrl: z.string().optional(),
    requiresUpload: z.boolean().default(false),
    uploadFileTypes: z.string().optional(),
    instructions: z.string().optional()
  });

  const blogForm = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      status: 'published' as const,
      tags: ''
    }
  });

  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium' as const,
      dueDate: '',
      taskType: 'general' as const,
      assignTo: 'all_members' as const,
      specificUsers: [],
      documentUrl: '',
      requiresUpload: false,
      uploadFileTypes: '',
      instructions: ''
    }
  });

  // Edit form - separate from create form to handle existing data
  const editForm = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      status: 'published' as const,
      tags: ''
    }
  });

  // Blog post creation mutation
  const createBlogMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/sites/${siteId}/blog-posts`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      blogForm.reset();
      setShowBlogDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/blog-posts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post",
        variant: "destructive",
      });
    }
  });

  // Blog post update mutation
  const updateBlogMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/sites/${siteId}/blog-posts/${editingPost.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      editForm.reset();
      setShowEditDialog(false);
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/blog-posts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update blog post",
        variant: "destructive",
      });
    }
  });

  // Blog post publish/unpublish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: 'published' | 'draft' }) => {
      const res = await apiRequest('PATCH', `/api/sites/${siteId}/blog-posts/${postId}/status`, { status });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: variables.status === 'published' ? "Post published successfully" : "Post unpublished successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/blog-posts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update post status",
        variant: "destructive",
      });
    }
  });
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest('POST', `/api/sites/${siteId}/tasks/${taskId}/start`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Task started" });
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/tasks/user`] });
      setShowTaskDetails(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start task", variant: "destructive" });
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest('POST', `/api/sites/${siteId}/tasks/${taskId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Task completed" });
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/tasks/user`] });
      setShowTaskDetails(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to complete task", variant: "destructive" });
    }
  });

  
  // Task assignment mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/sites/${siteId}/tasks`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task assigned successfully",
      });
      taskForm.reset();
      setShowTaskDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/tasks`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive",
      });
    }
  });

  // Get blog posts based on feed type
  const { data: blogPosts = [], isLoading: loadingBlogPosts, error: blogPostsError } = useQuery({
    queryKey: [`/api/sites/${siteId}/blog-posts`, feedType],
    queryFn: async () => {
      const url = feedType === 'drafts' 
        ? `/api/sites/${siteId}/blog-posts?status=draft`
        : `/api/sites/${siteId}/blog-posts?status=published`;
      const res = await apiRequest('GET', url);
      const data = await res.json();
      return data;
    },
    enabled: !!membershipData?.isMember // Enable for all members
  });

  // Force cache invalidation on mount to ensure fresh data
  useEffect(() => {
    if (membershipData?.isMember) {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/sites/${siteId}/blog-posts`] 
      });
    }
  }, [membershipData?.isMember, siteId]);

  const handleCreateBlog = (data: any) => {
    // Always set visibility to members_only since collective blogs are behind login
    createBlogMutation.mutate({
      ...data,
      visibility: 'members_only'
    });
  };

  const handleUpdateBlog = (data: any) => {
    if (!editingPost) return;
    // Always set visibility to members_only since collective blogs are behind login
    updateBlogMutation.mutate({
      ...data,
      visibility: 'members_only'
    });
  };

  const formatBlogDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateTask = (data: any) => {
    createTaskMutation.mutate(data);
  };

  // Get site info
  const { data: site } = useQuery({
    queryKey: [`/api/sites/${siteId}`],
  });

  // Get members list
  const { data: members } = useQuery({
    queryKey: [`/api/sites/${siteId}/members`],
  });

  // Get user's tasks
  const { data: userTasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: [`/api/sites/${siteId}/tasks/user`],
    enabled: !!siteId, // Ensure the query only runs when siteId is available
  });

  // Get messages for the collective
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: [`/api/sites/${siteId}/messages`],
    refetchInterval: 3000, // Poll every 3 seconds for new messages
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/sites/${siteId}/messages`, {
        content: content.trim()
      });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/messages`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ard_brehon':
        return 'bg-red-600/20 text-red-400';
      case 'brehon':
        return 'bg-yellow-600/20 text-yellow-400';
      default:
        return 'bg-green-600/20 text-green-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ard_brehon':
        return 'Ard Brehon';
      case 'brehon':
        return 'Brehon';
      default:
        return 'Member';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">{(site as any)?.name || 'Collective'}</h1>
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                {getRoleLabel(membershipData?.collectiveRole || 'member')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = `/site/${siteId}`}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Public Site
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Panel - Personal Profile */}
          <div className="col-span-3">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarImage src={user?.profilePicture || undefined} />
                    <AvatarFallback>{user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-white font-medium">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                  <Badge 
                    variant="secondary" 
                    className={`mt-2 ${getRoleColor(membershipData?.collectiveRole || 'member')}`}
                  >
                    {getRoleLabel(membershipData?.collectiveRole || 'member')}
                  </Badge>
                </div>
                
                <div className="border-t border-slate-600 pt-4">
                  <h4 className="text-slate-300 font-medium mb-3">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Tasks Assigned:</span>
                      <span className="text-white">{(userTasks as any)?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Member Since:</span>
                      <span className="text-white">Jan 2025</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-green-400">Active</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Main Content with Tabs */}
          <div className="col-span-6">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardHeader>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                    <TabsTrigger 
                      value="feed" 
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Blog Feed
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Community Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tasks" 
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Your Tasks
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <Tabs value={selectedTab} className="h-full">
                  
                  {/* Blog Feed Tab */}
                  <TabsContent value="feed" className="h-full mt-0">
                    <div className="h-full overflow-y-auto space-y-4">
                      {/* Top Controls - Only for Brehons+ */}
                      {canCreateContent() && (
                        <div className="flex justify-between items-center mb-4">
                          {/* Feed Type Switcher */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setFeedType('published')}
                              variant={feedType === 'published' ? 'default' : 'outline'}
                              size="sm"
                              className={feedType === 'published' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                              }
                              data-testid="button-published-feed"
                            >
                              Published Posts
                            </Button>
                            <Button
                              onClick={() => setFeedType('drafts')}
                              variant={feedType === 'drafts' ? 'default' : 'outline'}
                              size="sm"
                              className={feedType === 'drafts' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                              }
                              data-testid="button-drafts-feed"
                            >
                              Drafts
                            </Button>
                          </div>
                          
                          {/* Create Post Button */}
                          <Dialog open={showBlogDialog} onOpenChange={setShowBlogDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-create-blog-post">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Post
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">Create Blog Post</DialogTitle>
                              </DialogHeader>
                              <Form {...blogForm}>
                                <form onSubmit={blogForm.handleSubmit(handleCreateBlog)} className="space-y-4">
                                  <FormField
                                    control={blogForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Title</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="Enter post title..."
                                            data-testid="input-blog-title"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="excerpt"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Excerpt (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="Brief summary..."
                                            data-testid="input-blog-excerpt"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="content"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Content</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                                            placeholder="Write your blog post content..."
                                            data-testid="textarea-blog-content"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="status"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-blog-status">
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="bg-slate-700 border-slate-600">
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="tags"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Tags (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="mining, crypto, investment (comma-separated)"
                                            data-testid="input-blog-tags"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowBlogDialog(false)}
                                      className="border-slate-600 text-slate-300"
                                      data-testid="button-cancel-blog"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={createBlogMutation.isPending}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      data-testid="button-submit-blog"
                                    >
                                      {createBlogMutation.isPending ? 'Creating...' : 'Create Post'}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          {/* Edit Blog Post Dialog */}
                          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">Edit Blog Post</DialogTitle>
                              </DialogHeader>
                              <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit(handleUpdateBlog)} className="space-y-4">
                                  <FormField
                                    control={editForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Title</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="Enter post title..."
                                            data-testid="input-edit-blog-title"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="excerpt"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Excerpt (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="Brief summary..."
                                            data-testid="input-edit-blog-excerpt"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="content"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Content</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                                            placeholder="Write your blog post content..."
                                            data-testid="textarea-edit-blog-content"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="status"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-edit-blog-status">
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="bg-slate-700 border-slate-600">
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editForm.control}
                                    name="tags"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Tags (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="mining, crypto, investment (comma-separated)"
                                            data-testid="input-edit-blog-tags"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowEditDialog(false)}
                                      className="border-slate-600 text-slate-300"
                                      data-testid="button-cancel-edit-blog"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={updateBlogMutation.isPending}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      data-testid="button-submit-edit-blog"
                                    >
                                      {updateBlogMutation.isPending ? 'Updating...' : 'Update Post'}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      
                      {/* Blog Posts Content */}
                      {loadingBlogPosts ? (
                        <div className="flex justify-center py-8">
                          <div className="text-slate-400">Loading {feedType === 'drafts' ? 'drafts' : 'posts'}...</div>
                        </div>
                      ) : blogPosts.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-slate-400 text-lg mb-2">
                            {feedType === 'drafts' ? 'No Drafts Yet' : 'No Posts Yet'}
                          </h3>
                          <p className="text-slate-500 text-sm">
                            {canCreateContent() 
                              ? feedType === 'drafts' 
                                ? 'Your draft blog posts will appear here.'
                                : 'Create your first blog post to share with the community.'
                              : 'Brehons can add blog posts and articles here for the community.'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {blogPosts.map((post: any) => (
                            <Card key={post.id} className="bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 transition-colors" data-testid={`blog-post-${post.id}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <Link href={`/site/${siteId}/blog/${post.id}`}>
                                      <h3 className="text-white font-semibold text-lg mb-1 hover:text-cyan-400 cursor-pointer transition-colors" data-testid={`link-blog-post-${post.id}`}>
                                        {post.title}
                                      </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                      <span>By {post.authorFirstName} {post.authorLastName}</span>
                                      <span>•</span>
                                      <span>{formatBlogDate(post.createdAt)}</span>
                                      {feedType === 'drafts' && (
                                        <>
                                          <span>•</span>
                                          <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                                            Draft
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {canCreateContent() && feedType === 'drafts' && (
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                                        onClick={() => openEditDialog(post)}
                                        data-testid={`button-edit-draft-${post.id}`}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => togglePublishMutation.mutate({ postId: post.id, status: 'published' })}
                                        disabled={togglePublishMutation.isPending}
                                        data-testid={`button-publish-${post.id}`}
                                      >
                                        Publish
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {post.excerpt && (
                                  <p className="text-slate-300 text-sm mb-3 italic">
                                    {post.excerpt}
                                  </p>
                                )}
                                
                                <div className="text-slate-300 text-sm leading-relaxed">
                                  {post.content.length > 200 
                                    ? `${post.content.substring(0, 200)}...` 
                                    : post.content
                                  }
                                </div>
                                
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {(Array.isArray(post.tags) ? post.tags : post.tags.split(',')).map((tag: string, index: number) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-purple-600/20 text-purple-400 text-xs"
                                      >
                                        {tag.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Community Chat Tab */}
                  <TabsContent value="chat" className="h-full mt-0">
                    <div className="flex flex-col h-full">
                      {/* Messages Area */}
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 pb-4">
                          {loadingMessages ? (
                            <div className="flex justify-center py-8">
                              <div className="text-slate-400">Loading messages...</div>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                              <h3 className="text-slate-400 text-lg mb-2">No messages yet</h3>
                              <p className="text-slate-500 text-sm">
                                Be the first to start a conversation with the collective!
                              </p>
                            </div>
                          ) : (
                            messages.map((message: any) => (
                              <div key={message.id} className="flex gap-3">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage 
                                    src={message.senderProfilePicture} 
                                    alt={`${message.senderFirstName} ${message.senderLastName}`} 
                                  />
                                  <AvatarFallback className="bg-purple-600/20 text-purple-400">
                                    {(message.senderFirstName?.[0] || '') + (message.senderLastName?.[0] || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium text-sm">
                                      {message.senderFirstName} {message.senderLastName}
                                    </span>
                                    <span className="text-slate-500 text-xs">
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 text-sm leading-relaxed break-words">
                                    {message.content}
                                  </div>
                                  {message.isEdited && (
                                    <span className="text-slate-500 text-xs italic">edited</span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="border-t border-slate-700 pt-4 mt-4">
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                            disabled={sendMessageMutation.isPending}
                            data-testid="input-chat-message"
                          />
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            data-testid="button-send-message"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Tasks Tab */}
                  <TabsContent value="tasks" className="h-full mt-0">
                    <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            {selectedTask?.title ?? "Task"}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3 text-sm">
                          {selectedTask?.description ? (
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {selectedTask.description}
                            </p>
                          ) : (
                            <p className="italic text-slate-400">No description provided.</p>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-slate-600 p-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">Priority</div>
                              <div className="text-slate-200">{selectedTask?.priority?.toUpperCase?.() ?? '—'}</div>
                            </div>
                            <div className="rounded-lg border border-slate-600 p-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">Status</div>
                              <div className="text-slate-200">{selectedTask?.status?.replace?.('_',' ')?.toUpperCase?.() ?? '—'}</div>
                            </div>
                            <div className="rounded-lg border border-slate-600 p-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">Due</div>
                              <div className="text-slate-2 00">
                                {selectedTask?.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : '—'}
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-600 p-2">
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">ID</div>
                              <div className="text-slate-200">{selectedTask?.id ?? '—'}</div>
                            </div>
                          </div>

                          {selectedTask?.task_type === 'document_review' && selectedTask?.task_config?.document_url && (
                            <div className="bg-slate-600/30 p-3 rounded">
                              <p className="text-slate-400 text-xs mb-1">Document to Review:</p>
                              <a 
                                href={selectedTask.task_config.document_url}
                                target="_blank" rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                              >
                                {selectedTask.task_config.document_url}
                              </a>
                            </div>
                          )}

                          {selectedTask?.task_type === 'upload' && selectedTask?.task_config?.file_types && (
                            <div className="bg-slate-600/30 p-3 rounded">
                              <p className="text-slate-400 text-xs mb-1">Allowed File Types:</p>
                              <p className="text-slate-300 text-sm">
                                {Array.isArray(selectedTask.task_config.file_types)
                                  ? selectedTask.task_config.file_types.join(', ')
                                  : String(selectedTask.task_config.file_types)}
                              </p>
                            </div>
                          )}

                          {(selectedTask?.task_type === 'verification' && selectedTask?.task_config?.verification_requirements) && (
                            <div className="bg-slate-600/30 p-3 rounded">
                              <p className="text-slate-400 text-xs mb-2">Verification Requirements:</p>
                              <ul className="text-slate-300 text-sm space-y-1">
                                {selectedTask.task_config.verification_requirements.map((req: string, idx: number) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedTask?.task_config?.instructions && (
                            <div className="bg-blue-600/10 border border-blue-600/20 p-3 rounded">
                              <p className="text-blue-400 text-xs mb-1">Special Instructions:</p>
                              <p className="text-slate-300 text-sm">{selectedTask.task_config.instructions}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          {selectedTask?.status !== 'completed' && selectedTask?.status !== 'in_progress' && (
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => startTaskMutation.mutate(selectedTask.id)}
                            >
                              {startTaskMutation.isPending ? "Starting..." : "Start Task"}
                            </Button>
                          )}
                          {selectedTask?.status === 'in_progress' && (
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => completeTaskMutation.mutate(selectedTask.id)}
                            >
                              {completeTaskMutation.isPending ? "Completing..." : "Mark Complete"}
                            </Button>
                          )}
                          <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowTaskDetails(false)}>
                            Close
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="h-full overflow-y-auto space-y-4">
                      {/* Assign Task Button - Only for Brehons+ */}
                      {canCreateContent() && (
                        <div className="flex justify-end mb-4">
                          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-assign-task">
                                <Plus className="w-4 h-4 mr-2" />
                                Assign Task
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 max-w-xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">Assign New Task</DialogTitle>
                              </DialogHeader>
                              <Form {...taskForm}>
                                <form onSubmit={taskForm.handleSubmit(handleCreateTask)} className="space-y-4">
                                  <FormField
                                    control={taskForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Task Title</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            placeholder="Enter task title..."
                                            data-testid="input-task-title"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={taskForm.control}
                                      name="taskType"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Task Type</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-task-type">
                                                <SelectValue placeholder="Select task type" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-700 border-slate-600">
                                              <SelectItem value="general">General Task</SelectItem>
                                              <SelectItem value="document_review">Document Review</SelectItem>
                                              <SelectItem value="verification">Verification</SelectItem>
                                              <SelectItem value="upload">File Upload</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={taskForm.control}
                                      name="assignTo"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Assign To</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-assign-to">
                                                <SelectValue placeholder="Select assignment target" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-700 border-slate-600">
                                              <SelectItem value="all_members">All Members</SelectItem>
                                              <SelectItem value="brehons_only">Brehons Only</SelectItem>
                                              <SelectItem value="members_only">Members Only</SelectItem>
                                              <SelectItem value="specific_users">Specific Users</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <FormField
                                    control={taskForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-slate-300">Description</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                                            placeholder="Describe the task details..."
                                            data-testid="textarea-task-description"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {/* Document URL field - only for document_review tasks */}
                                  {taskForm.watch('taskType') === 'document_review' && (
                                    <FormField
                                      control={taskForm.control}
                                      name="documentUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Document URL</FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              className="bg-slate-700 border-slate-600 text-white"
                                              placeholder="https://example.com/document.pdf"
                                              data-testid="input-document-url"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}

                                  {/* Upload configuration - for upload tasks */}
                                  {taskForm.watch('taskType') === 'upload' && (
                                    <div className="space-y-4">
                                      <FormField
                                        control={taskForm.control}
                                        name="uploadFileTypes"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-slate-300">Allowed File Types</FormLabel>
                                            <FormControl>
                                              <Input
                                                {...field}
                                                className="bg-slate-700 border-slate-600 text-white"
                                                placeholder="pdf,doc,docx,jpg,png"
                                                data-testid="input-file-types"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  )}

                                  {/* Additional instructions for complex tasks */}
                                  {(taskForm.watch('taskType') === 'document_review' || taskForm.watch('taskType') === 'verification') && (
                                    <FormField
                                      control={taskForm.control}
                                      name="instructions"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Special Instructions</FormLabel>
                                          <FormControl>
                                            <Textarea
                                              {...field}
                                              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                                              placeholder="Any special instructions for this task..."
                                              data-testid="textarea-instructions"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={taskForm.control}
                                      name="priority"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Priority</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-task-priority">
                                                <SelectValue placeholder="Select priority" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-700 border-slate-600">
                                              <SelectItem value="low">Low</SelectItem>
                                              <SelectItem value="medium">Medium</SelectItem>
                                              <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={taskForm.control}
                                      name="dueDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-slate-300">Due Date (Optional)</FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              type="date"
                                              className="bg-slate-700 border-slate-600 text-white"
                                              data-testid="input-task-due-date"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowTaskDialog(false)}
                                      className="border-slate-600 text-slate-300"
                                      data-testid="button-cancel-task"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={createTaskMutation.isPending}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      data-testid="button-submit-task"
                                    >
                                      {createTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      
                      {/* Task List */}
                      {userTasks && (userTasks as any).length > 0 ? (
                        <div className="space-y-4">
                          {(userTasks as any).map((task: any) => (
                            <Card key={task.id} className="bg-slate-700/30 border-slate-600">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-white font-medium">{task.title}</h4>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${
                                          task.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                                          task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                                          'bg-green-600/20 text-green-400'
                                        }`}
                                      >
                                        {task.priority?.toUpperCase() || 'MEDIUM'}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs border-slate-500 text-slate-300"
                                      >
                                        {task.task_type?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                                      </Badge>
                                    </div>
                                    <p className="text-slate-300 text-sm mb-3">{task.description}</p>
                                    
                                    {/* Task-specific content */}
                                    {task.task_config && (
                                      <div className="space-y-2">
                                        {/* Document Review */}
                                        {task.task_type === 'document_review' && task.task_config.document_url && (
                                          <div className="bg-slate-600/30 p-3 rounded">
                                            <p className="text-slate-400 text-xs mb-1">Document to Review:</p>
                                            <a 
                                              href={task.task_config.document_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 text-sm underline"
                                            >
                                              {task.task_config.document_url}
                                            </a>
                                          </div>
                                        )}
                                        
                                        {/* File Upload */}
                                        {task.task_type === 'upload' && task.task_config.file_types && (
                                          <div className="bg-slate-600/30 p-3 rounded">
                                            <p className="text-slate-400 text-xs mb-1">Allowed File Types:</p>
                                            <p className="text-slate-300 text-sm">{task.task_config.file_types.join(', ')}</p>
                                            {task.task_config.max_files && (
                                              <p className="text-slate-400 text-xs mt-1">Max files: {task.task_config.max_files}</p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Verification Requirements */}
                                        {task.task_type === 'verification' && task.task_config.verification_requirements && (
                                          <div className="bg-slate-600/30 p-3 rounded">
                                            <p className="text-slate-400 text-xs mb-2">Verification Requirements:</p>
                                            <ul className="text-slate-300 text-sm space-y-1">
                                              {task.task_config.verification_requirements.map((req: string, idx: number) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                                  {req}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        
                                        {/* Special Instructions */}
                                        {task.task_config.instructions && (
                                          <div className="bg-blue-600/10 border border-blue-600/20 p-3 rounded">
                                            <p className="text-blue-400 text-xs mb-1">Special Instructions:</p>
                                            <p className="text-slate-300 text-sm">{task.task_config.instructions}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${
                                        task.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                        task.status === 'in_progress' ? 'bg-blue-600/20 text-blue-400' :
                                        'bg-slate-600/20 text-slate-400'
                                      }`}
                                    >
                                      {task.status?.replace('_', ' ').toUpperCase() || 'ASSIGNED'}
                                    </Badge>
                                    
                                    {task.due_date && (
                                      <div className="text-right">
                                        <p className="text-slate-400 text-xs">Due:</p>
                                        <p className="text-slate-300 text-sm">
                                          {new Date(task.due_date).toLocaleDateString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-3 border-t border-slate-600">
                                  {task.status !== 'completed' && (
                                    <>
                                      {task.status !== 'in_progress' && (
                                        <Button 
                                          size="sm" 
                                          className="bg-blue-600 hover:bg-blue-700 text-white"
                                          data-testid={`button-start-task-${task.id}`}
                                        >
                                          Start Task
                                        </Button>
                                      )}
                                      
                                      {task.status === 'in_progress' && (
                                        <Button 
                                          size="sm" 
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                          data-testid={`button-complete-task-${task.id}`}
                                        >
                                          Mark Complete
                                        </Button>
                                      )}
                                      
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                        onClick={() => openTaskDetails(task)}
                                        data-testid={`button-view-task-${task.id}`}
                                      >
                                        View Details
                                      </Button>
                                    </>
                                  )}
                                  
                                  {task.status === 'completed' && (
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                      <CheckSquare className="w-4 h-4" />
                                      Completed {task.completed_at && `on ${new Date(task.completed_at).toLocaleDateString()}`}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-slate-400 text-lg mb-2">No Tasks Assigned</h3>
                          <p className="text-slate-500 text-sm">
                            {canCreateContent() ? 'Assign tasks to collective members to organize activities.' : 'Your assigned tasks and to-do items will appear here.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Members List */}
          <div className="col-span-3">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({(members as any)?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto">
                {(members as any)?.length ? (
                  (members as any).map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback>{member.firstName?.[0]}{member.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{member.firstName} {member.lastName}</p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRoleColor(member.collectiveRole)}`}
                        >
                          {getRoleLabel(member.collectiveRole)}
                        </Badge>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full" title="Online" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Loading members...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}