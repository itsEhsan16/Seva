import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Clock,
  Search,
  Filter
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

interface Dispute {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  customer_address: string;
  customer_notes: string | null;
  provider_notes: string | null;
  created_at: string;
  dispute_reason?: string;
  dispute_status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  customer: {
    id: string;
    full_name: string | null;
    phone: string | null;
    user_id: string;
  };
  provider: {
    id: string;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
    user_id: string;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
}

interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_type: 'admin' | 'customer' | 'provider';
  sender_name: string;
  message: string;
  created_at: string;
}

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    filterDisputes();
  }, [disputes, searchTerm, statusFilter]);

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(id, full_name, phone, user_id),
          provider:profiles!provider_id(id, full_name, business_name, phone, user_id),
          service:services(id, name, duration_minutes)
        `)
        .in('status', ['disputed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform bookings to disputes with additional dispute fields
      const disputesData = (data || []).map(booking => ({
        ...booking,
        dispute_status: booking.status === 'disputed' ? 'open' : 'closed',
        dispute_reason: booking.provider_notes || 'No reason provided'
      }));

      setDisputes(disputesData);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch disputes"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    if (searchTerm) {
      filtered = filtered.filter(dispute => 
        dispute.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.provider.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(dispute => dispute.dispute_status === statusFilter);
    }

    setFilteredDisputes(filtered);
  };

  const fetchDisputeMessages = async (disputeId: string) => {
    try {
      // For now, we'll simulate dispute messages since we don't have a messages table
      // In a real implementation, you'd fetch from a dispute_messages table
      const mockMessages: DisputeMessage[] = [
        {
          id: '1',
          dispute_id: disputeId,
          sender_type: 'customer',
          sender_name: 'Customer',
          message: 'The service was not completed as promised.',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          dispute_id: disputeId,
          sender_type: 'provider',
          sender_name: 'Provider',
          message: 'Customer was not available at the scheduled time.',
          created_at: new Date(Date.now() - 43200000).toISOString()
        }
      ];
      
      setDisputeMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching dispute messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dispute messages"
      });
    }
  };

  const updateDisputeStatus = async (disputeId: string, newStatus: string, notes?: string) => {
    setActionLoading(true);
    try {
      const updateData: any = { 
        status: newStatus === 'resolved' ? 'completed' : newStatus
      };
      
      if (notes) {
        updateData.provider_notes = notes;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Dispute ${newStatus === 'resolved' ? 'resolved' : 'updated'} successfully`
      });
      
      fetchDisputes();
      setShowDetailsDialog(false);
      setResolutionNotes("");
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const addDisputeMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;

    try {
      // In a real implementation, you'd save to a dispute_messages table
      const newMsg: DisputeMessage = {
        id: Date.now().toString(),
        dispute_id: selectedDispute.id,
        sender_type: 'admin',
        sender_name: 'Admin',
        message: newMessage,
        created_at: new Date().toISOString()
      };

      setDisputeMessages(prev => [...prev, newMsg]);
      setNewMessage("");

      toast({
        title: "Success",
        description: "Message added to dispute"
      });
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: "Error",
        description: "Failed to add message"
      });
    }
  };

  const viewDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    fetchDisputeMessages(dispute.id);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLevel = (dispute: Dispute) => {
    // Simple severity calculation based on amount and time
    const amount = parseFloat(dispute.total_amount.toString());
    const daysSinceCreated = Math.floor((Date.now() - new Date(dispute.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (amount > 5000 || daysSinceCreated > 7) return 'high';
    if (amount > 2000 || daysSinceCreated > 3) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h2 className="text-2xl font-bold">Dispute Resolution</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dispute Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Open Disputes</p>
              <p className="text-2xl font-bold">
                {disputes.filter(d => d.dispute_status === 'open').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Investigating</p>
              <p className="text-2xl font-bold">
                {disputes.filter(d => d.dispute_status === 'investigating').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">
                {disputes.filter(d => d.dispute_status === 'resolved').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                ₹{disputes.reduce((sum, d) => sum + parseFloat(d.total_amount.toString()), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Disputes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDisputes.map((dispute) => {
          const severity = getSeverityLevel(dispute);
          return (
            <Card key={dispute.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{dispute.service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Dispute ID: {dispute.id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(dispute.dispute_status)}>
                    {dispute.dispute_status}
                  </Badge>
                  <Badge className={getSeverityColor(severity)}>
                    {severity} priority
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>
                    <strong>Customer:</strong> {dispute.customer.full_name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>
                    <strong>Provider:</strong> {dispute.provider.business_name || dispute.provider.full_name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(dispute.booking_date).toLocaleDateString()} at {dispute.booking_time}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>₹{dispute.total_amount}</span>
                </div>

                {dispute.dispute_reason && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>
                      <strong>Reason:</strong> {dispute.dispute_reason}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewDisputeDetails(dispute)}
                  className="flex items-center gap-2 flex-1"
                >
                  <Eye className="w-4 h-4" />
                  Investigate
                </Button>
                
                {dispute.dispute_status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => updateDisputeStatus(dispute.id, 'investigating')}
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Start Investigation
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredDisputes.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No disputes found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "No disputes match your current filters."
              : "No active disputes at the moment."}
          </p>
        </div>
      )}

      {/* Dispute Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Investigation</DialogTitle>
            <DialogDescription>
              Review dispute details and communicate with involved parties
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-6">
              {/* Dispute Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Booking Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Service:</strong> {selectedDispute.service.name}</p>
                    <p><strong>Date:</strong> {new Date(selectedDispute.booking_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedDispute.booking_time}</p>
                    <p><strong>Amount:</strong> ₹{selectedDispute.total_amount}</p>
                    <p><strong>Address:</strong> {selectedDispute.customer_address}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Parties Involved</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Customer:</strong> {selectedDispute.customer.full_name}</p>
                    <p><strong>Phone:</strong> {selectedDispute.customer.phone}</p>
                    <p><strong>Provider:</strong> {selectedDispute.provider.business_name || selectedDispute.provider.full_name}</p>
                    <p><strong>Phone:</strong> {selectedDispute.provider.phone}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDispute.customer_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Customer Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded">{selectedDispute.customer_notes}</p>
                  </div>
                )}
                
                {selectedDispute.provider_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Provider Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded">{selectedDispute.provider_notes}</p>
                  </div>
                )}
              </div>

              {/* Communication Thread */}
              <div>
                <h4 className="font-semibold mb-4">Communication Thread</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto border rounded p-3">
                  {disputeMessages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.sender_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.sender_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Message */}
                <div className="flex gap-2 mt-3">
                  <Textarea
                    placeholder="Add a message to the dispute thread..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button onClick={addDisputeMessage} disabled={!newMessage.trim()}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>

              {/* Resolution */}
              {selectedDispute.dispute_status !== 'resolved' && selectedDispute.dispute_status !== 'closed' && (
                <div>
                  <h4 className="font-semibold mb-2">Resolution</h4>
                  <Textarea
                    placeholder="Enter resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDispute?.dispute_status === 'open' && (
              <Button
                onClick={() => selectedDispute && updateDisputeStatus(selectedDispute.id, 'investigating')}
                disabled={actionLoading}
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Start Investigation
              </Button>
            )}
            
            {selectedDispute?.dispute_status === 'investigating' && (
              <Button
                onClick={() => selectedDispute && updateDisputeStatus(selectedDispute.id, 'resolved', resolutionNotes)}
                disabled={actionLoading || !resolutionNotes.trim()}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Dispute
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;