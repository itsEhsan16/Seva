import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Copy, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  CreditCard,
  FileText,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { type PaymentConfirmationData } from '@/lib/stripe';

interface BookingDetails {
  id: string;
  service_name: string;
  provider_name: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  amount: number;
  customer_address: string;
}

interface PaymentReceiptProps {
  paymentData: PaymentConfirmationData;
  bookingDetails: BookingDetails[];
  onClose: () => void;
  onDownloadReceipt?: () => void;
  onEmailReceipt?: () => void;
}

const PaymentReceipt = ({
  paymentData,
  bookingDetails,
  onClose,
  onDownloadReceipt,
  onEmailReceipt
}: PaymentReceiptProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const copyReceiptDetails = () => {
    const receiptText = `
PAYMENT RECEIPT
===============

Payment ID: ${paymentData.paymentIntentId}
Date: ${format(new Date(paymentData.created * 1000), 'PPP')}
Amount: ${formatCurrency(paymentData.amount)}
Status: ${paymentData.status.toUpperCase()}

BOOKING DETAILS:
${bookingDetails.map(booking => `
- ${booking.service_name}
  Provider: ${booking.provider_name}
  Date: ${formatDate(booking.booking_date)}
  Time: ${booking.booking_time}
  Duration: ${booking.duration_minutes} minutes
  Amount: ${formatCurrency(booking.amount * 100)}
  Address: ${booking.customer_address}
`).join('\n')}

Total Amount: ${formatCurrency(paymentData.amount)}
    `.trim();

    navigator.clipboard.writeText(receiptText);
    toast({
      title: "Copied",
      description: "Receipt details copied to clipboard.",
    });
  };

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      if (onDownloadReceipt) {
        await onDownloadReceipt();
      } else {
        // Generate and download receipt as text file
        const receiptContent = generateReceiptContent();
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${paymentData.paymentIntentId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Downloaded",
        description: "Receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    setIsEmailing(true);
    try {
      if (onEmailReceipt) {
        await onEmailReceipt();
      } else {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: "Email Sent",
        description: "Receipt has been sent to your email address.",
      });
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send receipt email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const generateReceiptContent = () => {
    return `
SEVA MARKETPLACE - PAYMENT RECEIPT
==================================

Receipt #: ${paymentData.paymentIntentId}
Payment Date: ${format(new Date(paymentData.created * 1000), 'PPPp')}
Payment Status: ${paymentData.status.toUpperCase()}

BOOKING DETAILS:
${bookingDetails.map((booking, index) => `
${index + 1}. ${booking.service_name}
   Provider: ${booking.provider_name}
   Date & Time: ${formatDate(booking.booking_date)} at ${booking.booking_time}
   Duration: ${booking.duration_minutes} minutes
   Service Amount: ${formatCurrency(booking.amount * 100)}
   Location: ${booking.customer_address}
   Booking ID: ${booking.id}
`).join('\n')}

PAYMENT SUMMARY:
Total Amount Paid: ${formatCurrency(paymentData.amount)}
Payment Method: Card ending in ****
Currency: ${paymentData.currency.toUpperCase()}

Thank you for using Seva Marketplace!
For support, contact us at support@seva.com
    `.trim();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'requires_action':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
          <p className="text-muted-foreground">
            Your payment has been processed successfully
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Payment Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Transaction ID: {paymentData.paymentIntentId}
                  </p>
                </div>
                <Badge className={getStatusColor(paymentData.status)}>
                  {paymentData.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Amount: {formatCurrency(paymentData.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{format(new Date(paymentData.created * 1000), 'PPP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Booking Details</h3>
            {bookingDetails.map((booking, index) => (
              <Card key={booking.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{booking.service_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Booking #{booking.id.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(booking.amount * 100)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>{booking.provider_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{booking.booking_time} ({booking.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span className="line-clamp-2">{booking.customer_address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Total Amount */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Paid:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentData.amount)}
              </span>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Important Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Service providers will contact you before the scheduled time</li>
              <li>• You can track your bookings in the "My Bookings" section</li>
              <li>• Cancellation policy: Full refund within 24 hours</li>
              <li>• GST invoice will be sent to your registered email</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={copyReceiptDetails}
              className="flex-1 min-w-[120px]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Details
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="flex-1 min-w-[120px]"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleEmailReceipt}
              disabled={isEmailing}
              className="flex-1 min-w-[120px]"
            >
              {isEmailing ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Receipt
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} className="flex-1">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReceipt;