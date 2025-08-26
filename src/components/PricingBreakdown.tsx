import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Info, Percent, CreditCard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PricingItem {
  id: string;
  name: string;
  basePrice: number;
  quantity?: number;
  duration?: number; // in minutes
  provider?: string;
}

interface PricingBreakdownProps {
  items: PricingItem[];
  platformFeeRate?: number; // as decimal (e.g., 0.05 for 5%)
  taxRate?: number; // as decimal (e.g., 0.18 for 18%)
  discountAmount?: number;
  discountLabel?: string;
  showDetailedBreakdown?: boolean;
  currency?: string;
}

const PricingBreakdown = ({
  items,
  platformFeeRate = 0.05, // 5% platform fee
  taxRate = 0.18, // 18% GST
  discountAmount = 0,
  discountLabel = 'Discount',
  showDetailedBreakdown = true,
  currency = 'INR'
}: PricingBreakdownProps) => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.basePrice * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // Calculate platform fee
  const platformFee = subtotal * platformFeeRate;

  // Calculate amount after discount
  const discountedAmount = Math.max(0, subtotal - discountAmount);

  // Calculate tax on discounted amount + platform fee
  const taxableAmount = discountedAmount + platformFee;
  const taxAmount = taxableAmount * taxRate;

  // Calculate total
  const total = discountedAmount + platformFee + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pricing Breakdown
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {item.provider && (
                  <div className="text-sm text-muted-foreground">by {item.provider}</div>
                )}
                {showDetailedBreakdown && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.duration && `${item.duration} min • `}
                    {formatCurrency(item.basePrice)}
                    {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(item.basePrice * (item.quantity || 1))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Calculations */}
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                {discountLabel}
                <Badge variant="secondary" className="text-xs">
                  -{formatCurrency(discountAmount)}
                </Badge>
              </span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {/* Platform Fee */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              Platform Fee
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Service fee for platform maintenance and support</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant="outline" className="text-xs">
                <Percent className="w-2 h-2 mr-1" />
                {(platformFeeRate * 100).toFixed(1)}%
              </Badge>
            </span>
            <span>{formatCurrency(platformFee)}</span>
          </div>

          {/* Tax */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              GST
              <Badge variant="outline" className="text-xs">
                <Percent className="w-2 h-2 mr-1" />
                {(taxRate * 100).toFixed(0)}%
              </Badge>
            </span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Amount</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Payment Security Notice */}
        <div className="bg-accent/30 rounded-lg p-3 mt-4">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-1">Payment Information:</div>
            <ul className="text-xs space-y-1">
              <li>• Secure payment processing via Stripe</li>
              <li>• Payment will be processed after service completion</li>
              <li>• Full refund available for cancellations within 24 hours</li>
              <li>• GST invoice will be provided after payment</li>
            </ul>
          </div>
        </div>

        {/* Savings Display */}
        {discountAmount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm font-medium text-green-800">
              You're saving {formatCurrency(discountAmount)} on this booking!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;