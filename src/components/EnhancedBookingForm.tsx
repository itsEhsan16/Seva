import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, User, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBooking } from "@/hooks/useBooking";
import { bookingFormSchema, type BookingFormData } from "@/lib/validations/booking";
import { format, addDays } from "date-fns";

interface EnhancedBookingFormProps {
  serviceId: string;
  providerId: string;
  serviceName: string;
  serviceDuration?: number;
  servicePrice: number;
  onBookingSuccess: (bookingIds: string[]) => void;
  onCancel: () => void;
}

const EnhancedBookingForm = ({
  serviceId,
  providerId,
  serviceName,
  serviceDuration = 60,
  servicePrice,
  onBookingSuccess,
  onCancel
}: EnhancedBookingFormProps) => {
  const {
    loading,
    submitting,
    availableSlots,
    alternatives,
    conflicts,
    checkAvailability,
    getTimeSlots,
    getAlternatives,
    createBooking,
    createRecurringBooking
  } = useBooking();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId,
      providerId,
      bookingDate: "",
      bookingTime: "",
      customerAddress: "",
      customerNotes: "",
      isRecurring: false,
      recurringType: undefined,
      recurringEndDate: "",
      recurringDays: []
    }
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const isRecurring = watch("isRecurring");
  const recurringType = watch("recurringType");

  // Load available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      getTimeSlots(providerId, selectedDate, serviceDuration);
      setValue("bookingDate", selectedDate);
    }
  }, [selectedDate, providerId, serviceDuration, getTimeSlots, setValue]);

  // Check availability when time is selected
  useEffect(() => {
    if (selectedDate && selectedTime) {
      setAvailabilityStatus('checking');
      checkAvailability(providerId, selectedDate, selectedTime, serviceDuration)
        .then(({ available }) => {
          setAvailabilityStatus(available ? 'available' : 'unavailable');
          if (!available) {
            // Automatically find alternatives
            getAlternatives(serviceId, selectedDate, selectedTime, serviceDuration);
            setShowAlternatives(true);
          }
        });
      setValue("bookingTime", selectedTime);
    }
  }, [selectedDate, selectedTime, providerId, serviceDuration, checkAvailability, getAlternatives, serviceId, setValue]);

  const onSubmit = async (data: BookingFormData) => {
    if (availabilityStatus !== 'available') {
      return;
    }

    try {
      let result;
      if (data.isRecurring) {
        result = await createRecurringBooking(data);
        if (result.success) {
          onBookingSuccess(result.bookingIds);
        }
      } else {
        result = await createBooking(data);
        if (result.success && result.bookingId) {
          onBookingSuccess([result.bookingId]);
        }
      }
    } catch (error) {
      console.error('Booking submission error:', error);
    }
  };

  const handleAlternativeSelect = (alternative: any) => {
    setSelectedDate(alternative.date);
    setSelectedTime(alternative.time);
    setShowAlternatives(false);
    setAvailabilityStatus(null);
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const displayString = format(date, 'EEEE, MMMM d, yyyy');
      
      options.push(
        <option key={`date-${i}-${dateString}`} value={dateString}>
          {displayString}
        </option>
      );
    }
    
    return options;
  };

  const renderTimeSlots = () => {
    if (!selectedDate || loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No available time slots for this date. Please select another date.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            onClick={() => slot.available && setSelectedTime(slot.time)}
            disabled={!slot.available}
            className={`p-3 rounded-lg border transition-all text-sm ${
              selectedTime === slot.time
                ? "bg-primary text-primary-foreground border-primary"
                : slot.available
                ? "border-input hover:border-primary hover:bg-accent"
                : "border-muted bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            title={slot.available ? undefined : slot.reason}
          >
            {slot.time}
            {!slot.available && (
              <div className="text-xs mt-1 opacity-70">{slot.reason}</div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Service Info */}
      <div className="bg-accent/50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{serviceName}</h3>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Duration: {serviceDuration} minutes</span>
          <span className="font-semibold text-foreground">₹{servicePrice}</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Select Date
        </Label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          <option value="">Choose a date</option>
          {generateDateOptions()}
        </select>
        {errors.bookingDate && (
          <p className="text-sm text-destructive">{errors.bookingDate.message}</p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Select Time
          {availabilityStatus === 'checking' && (
            <RefreshCw className="w-4 h-4 animate-spin ml-2" />
          )}
          {availabilityStatus === 'available' && (
            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
          )}
          {availabilityStatus === 'unavailable' && (
            <AlertTriangle className="w-4 h-4 text-destructive ml-2" />
          )}
        </Label>
        {renderTimeSlots()}
        {errors.bookingTime && (
          <p className="text-sm text-destructive">{errors.bookingTime.message}</p>
        )}
      </div>

      {/* Availability Status */}
      {availabilityStatus === 'unavailable' && conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This time slot conflicts with existing bookings. Please choose another time or check the alternatives below.
          </AlertDescription>
        </Alert>
      )}

      {/* Alternative Slots */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="space-y-3">
          <Label>Alternative Time Slots</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alternatives.map((alt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAlternativeSelect(alt)}
                className="w-full p-3 text-left border border-input rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {format(new Date(alt.date), 'EEEE, MMM d')} at {alt.time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Provider: {alt.provider_name}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    Select
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Booking Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setValue("isRecurring", !!checked)}
          />
          <Label htmlFor="recurring">Make this a recurring booking</Label>
        </div>

        {isRecurring && (
          <div className="space-y-4 pl-6 border-l-2 border-accent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Recurring Pattern</Label>
                <Select
                  value={recurringType}
                  onValueChange={(value: any) => setValue("recurringType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  {...form.register("recurringEndDate")}
                  min={selectedDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {(recurringType === 'weekly' || recurringType === 'biweekly') && (
              <div>
                <Label>Days of Week (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-1">
                      <Checkbox
                        id={`day-${index}`}
                        checked={watch("recurringDays")?.includes(index) || false}
                        onCheckedChange={(checked) => {
                          const currentDays = watch("recurringDays") || [];
                          if (checked) {
                            setValue("recurringDays", [...currentDays, index]);
                          } else {
                            setValue("recurringDays", currentDays.filter(d => d !== index));
                          }
                        }}
                      />
                      <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Service Address
        </Label>
        <Textarea
          {...form.register("customerAddress")}
          placeholder="Enter the complete address where the service should be provided"
          rows={3}
        />
        {errors.customerAddress && (
          <p className="text-sm text-destructive">{errors.customerAddress.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Special Requirements (Optional)</Label>
        <Textarea
          {...form.register("customerNotes")}
          placeholder="Any special instructions or requirements for the service provider"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || availabilityStatus !== 'available'}
          className="flex-1"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {isRecurring ? 'Creating Bookings...' : 'Creating Booking...'}
            </>
          ) : (
            `Book Service - ₹${servicePrice}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default EnhancedBookingForm;