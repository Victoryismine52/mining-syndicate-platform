import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, UserCheck, User, Edit3, Plus, Mail, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UserType {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  googleId?: string;
  profilePicture?: string;
  role: 'admin' | 'site_manager' | 'generic';
  isAdmin: boolean;
  createdAt: string;
}

interface AccessListEntry {
  id: string;
  email: string;
  addedBy: string | null;
  createdAt: string;
}

const getRoleBadge = (role: string, isAdmin: boolean) => {
  if (role === 'admin' || isAdmin) {
    return <Badge variant="destructive" className="bg-red-600"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
  } else if (role === 'site_manager') {
    return <Badge variant="secondary" className="bg-blue-600"><UserCheck className="w-3 h-3 mr-1" />Site Manager</Badge>;
  } else {
    return <Badge variant="outline" className="text-slate-400"><User className="w-3 h-3 mr-1" />User</Badge>;
  }
};

export function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddAccessDialogOpen, setIsAddAccessDialogOpen] = useState(false);
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  const { data: accessList = [], isLoading: isAccessListLoading } = useQuery({
    queryKey: ['/api/access-list'],
    retry: false,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToAccessListMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/access-list', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to add user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Added",
        description: "User has been added to the access list.",
      });
      setIsAddAccessDialogOpen(false);
      setNewUserEmail('');
    },
    onError: (error) => {
      console.error('Error adding user to access list:', error);
      toast({
        title: "Error",
        description: "Failed to add user to access list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromAccessListMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/access-list/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Removed",
        description: "User has been removed from the access list.",
      });
    },
    onError: (error) => {
      console.error('Error removing user from access list:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from access list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async ({ email, firstName, lastName }: { email: string; firstName: string; lastName: string }) => {
      const response = await fetch('/api/users/admin', {
        method: 'POST',
        body: JSON.stringify({ email, firstName, lastName }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create admin user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddAdminDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminFirstName('');
      setNewAdminLastName('');
      toast({
        title: "Admin Created",
        description: "New admin user has been successfully created.",
      });
    },
    onError: (error) => {
      console.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleUpdate = (newRole: string) => {
    if (editingUser) {
      updateUserRoleMutation.mutate({ userId: editingUser.id, newRole });
    }
  };

  const handleAddToAccessList = () => {
    if (newUserEmail.trim()) {
      addToAccessListMutation.mutate(newUserEmail.trim());
    }
  };

  const handleCreateAdmin = () => {
    if (newAdminEmail.trim() && newAdminFirstName.trim() && newAdminLastName.trim()) {
      createAdminMutation.mutate({
        email: newAdminEmail.trim(),
        firstName: newAdminFirstName.trim(),
        lastName: newAdminLastName.trim(),
      });
    }
  };

  if (isLoading || isAccessListLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div className="text-center text-slate-400">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage system administrators and site managers
              </CardDescription>
            </div>
            <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-500 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Admin</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a new admin user with full system access. They can log in immediately after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email" className="text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      data-testid="input-admin-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-first-name" className="text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="admin-first-name"
                      type="text"
                      placeholder="John"
                      value={newAdminFirstName}
                      onChange={(e) => setNewAdminFirstName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      data-testid="input-admin-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-last-name" className="text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="admin-last-name"
                      type="text"
                      placeholder="Doe"
                      value={newAdminLastName}
                      onChange={(e) => setNewAdminLastName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      data-testid="input-admin-last-name"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddAdminDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="button-cancel-add-admin"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateAdmin}
                      disabled={!newAdminEmail.trim() || !newAdminFirstName.trim() || !newAdminLastName.trim() || createAdminMutation.isPending}
                      className="bg-red-600 hover:bg-red-500 text-white"
                      data-testid="button-create-admin"
                    >
                      {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(users as UserType[]).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No users found
              </div>
            ) : (
              <div className="space-y-3">
                {(users as UserType[]).map((user: UserType) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center space-x-4">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.firstName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-slate-400 text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="text-slate-500 text-xs">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getRoleBadge(user.role, user.isAdmin)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setIsEditDialogOpen(true);
                        }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        data-testid={`button-edit-user-${user.email.replace('@', '-').replace('.', '-')}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access List Management */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Access List Management
              </CardTitle>
              <CardDescription className="text-slate-400">
                Control who can access the platform. New users need to be on this list to sign in.
              </CardDescription>
            </div>
            <Dialog open={isAddAccessDialogOpen} onOpenChange={setIsAddAccessDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add User to Access List</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Enter the email address of the user you want to grant access to.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      data-testid="input-new-user-email"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddAccessDialogOpen(false);
                        setNewUserEmail('');
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToAccessList}
                      disabled={!newUserEmail.trim() || addToAccessListMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                      data-testid="button-add-user-to-access-list"
                    >
                      {addToAccessListMutation.isPending ? 'Adding...' : 'Add User'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(accessList as AccessListEntry[]).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No users in access list
              </div>
            ) : (
              (accessList as AccessListEntry[]).map((entry: AccessListEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{entry.email}</div>
                      <div className="text-slate-400 text-sm">
                        Added: {new Date(entry.createdAt).toLocaleDateString()}
                        {entry.addedBy && ` by ${entry.addedBy}`}
                      </div>
                    </div>
                  </div>
                  {entry.email !== "bnelson523@gmail.com" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromAccessListMutation.mutate(entry.email)}
                      disabled={removeFromAccessListMutation.isPending}
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                      data-testid={`button-remove-access-${entry.email.replace('@', '-').replace('.', '-')}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User Role</DialogTitle>
            <DialogDescription className="text-slate-400">
              Change the role for {editingUser?.firstName} {editingUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Current Role</Label>
              <div className="mt-2">
                {editingUser && getRoleBadge(editingUser.role, editingUser.isAdmin)}
              </div>
            </div>
            <div>
              <Label className="text-slate-300">New Role</Label>
              <Select onValueChange={handleRoleUpdate}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="admin" className="text-white hover:bg-slate-600">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      Admin - Full system access
                    </div>
                  </SelectItem>
                  <SelectItem value="site_manager" className="text-white hover:bg-slate-600">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      Site Manager - Can manage sites
                    </div>
                  </SelectItem>
                  <SelectItem value="generic" className="text-white hover:bg-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      User - Basic access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-400 p-3 bg-slate-700/30 rounded-lg">
              <strong>Role Permissions:</strong>
              <ul className="mt-2 space-y-1">
                <li>• <strong>Admin:</strong> Full access to all features, can manage other users</li>
                <li>• <strong>Site Manager:</strong> Can create and manage individual sites</li>
                <li>• <strong>User:</strong> Basic access, requires approval for most actions</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}