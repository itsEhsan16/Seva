import React, { useState, useEffect } from "react";
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  Download,
  MessageSquare,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentUrl } from "@/lib/documentUtils";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  business_name: string | null;
  experience_years: number | null;
  created_at: string;
  verification_documents?: string[];
  business_description?: string | null;
  skills?: string[];
  service_areas?: string[];
  business_license?: string | null;
  tax_id?: string | null;
  rejection_reason?: string | null;
  is_suspended?: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.verification_status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const approveProvider = async (userId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: true,
          verification_status: 'approved',
          rejection_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Provider Approved",
        description: "Provider has been successfully approved and can now offer services."
      });
      
      fetchUsers();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error approving provider:', error);
      toast({
        title: "Error",
        description: "Failed to approve provider",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const rejectProvider = async (userId: string, reason: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: false,
          verification_status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Provider Rejected",
        description: "Provider application has been rejected with feedback."
      });
      
      fetchUsers();
      setShowRejectDialog(false);
      setShowDetailsDialog(false);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting provider:', error);
      toast({
        title: "Error",
        description: "Failed to reject provider",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserVerification = async (userId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: verified,
          verification_status: verified ? 'approved' : 'pending'
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${verified ? 'verified' : 'unverified'} successfully`
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast({
        title: "Error",
        description: "Failed to update user verification"
      });
    }
  };

  const suspendUser = async (userId: string, suspended: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: suspended,
          suspended_at: suspended ? new Date().toISOString() : null,
          suspension_reason: suspended ? 'Suspended by admin' : null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user suspension:', error);
      toast({
        title: "Error",
        description: "Failed to update user suspension"
      });
    }
  };

  const viewProviderDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'provider':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {user.full_name || 'Unnamed User'}
                  </h3>
                  {user.role === 'provider' && user.business_name && (
                    <p className="text-sm text-muted-foreground">
                      {user.business_name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
                <Badge className={getStatusBadgeColor(user.verification_status)}>
                  {getStatusText(user.verification_status)}
                </Badge>
                {user.is_suspended && (
                  <Badge variant="destructive">
                    Suspended
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              
              {(user.city || user.state) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{[user.city, user.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>

              {user.role === 'provider' && user.experience_years && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>{user.experience_years} years experience</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {user.role === 'provider' && user.verification_status === 'pending' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewProviderDetails(user)}
                  className="flex items-center gap-2 flex-1"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Button>
              ) : user.role === 'provider' && user.verification_status === 'rejected' ? (
                <div className="flex gap-1 flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewProviderDetails(user)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              ) : user.role !== 'provider' ? (
                <div className="flex gap-1 flex-1">
                  {!user.is_verified ? (
                    <Button
                      size="sm"
                      onClick={() => updateUserVerification(user.id, true)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserVerification(user.id, false)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Unverify
                    </Button>
                  )}
                </div>
              ) : null}
              
              {/* Suspension controls for all users */}
              {user.role !== 'admin' && (
                <div className="flex gap-1 w-full mt-2">
                  {!user.is_suspended ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => suspendUser(user.id, true)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => suspendUser(user.id, false)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Unsuspend
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Provider Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provider Application Details</DialogTitle>
            <DialogDescription>
              Review the provider's application and documents
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedUser.full_name}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone}</p>
                    <p><strong>Location:</strong> {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Business Name:</strong> {selectedUser.business_name}</p>
                    <p><strong>Experience:</strong> {selectedUser.experience_years} years</p>
                    {selectedUser.business_license && (
                      <p><strong>License:</strong> {selectedUser.business_license}</p>
                    )}
                    {selectedUser.tax_id && (
                      <p><strong>Tax ID:</strong> {selectedUser.tax_id}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Description */}
              {selectedUser.business_description && (
                <div>
                  <h4 className="font-semibold mb-2">Business Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedUser.business_description}</p>
                </div>
              )}

              {/* Skills and Service Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUser.skills && selectedUser.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedUser.service_areas && selectedUser.service_areas.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Service Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.service_areas.map((area) => (
                        <Badge key={area} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              {selectedUser.verification_documents && selectedUser.verification_documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Verification Documents</h4>
                  <div className="space-y-2">
                    {selectedUser.verification_documents.map((docPath, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="flex-1 text-sm">Document {index + 1}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(docPath, `document_${index + 1}`)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedUser.verification_status === 'rejected' && selectedUser.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="font-semibold text-red-700">Rejection Reason</h4>
                  </div>
                  <p className="text-sm text-red-600">{selectedUser.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedUser?.verification_status === 'pending' && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleRejectClick}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => approveProvider(selectedUser.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
            {selectedUser?.verification_status === 'rejected' && (
              <Button
                onClick={() => approveProvider(selectedUser.id)}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Provider Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This feedback will be sent to the provider.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && rejectProvider(selectedUser.id, rejectionReason)}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;