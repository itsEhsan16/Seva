import { z } from "zod";

export const bookingFormSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  providerId: z.string().min(1, "Provider is required"),
  bookingDate: z.string().min(1, "Date is required"),
  bookingTime: z.string().min(1, "Time is required"),
  customerAddress: z.string().min(10, "Address must be at least 10 characters"),
  customerNotes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  recurringEndDate: z.string().optional(),
  recurringDays: z.array(z.number().min(0).max(6)).optional(), // 0-6 for days of week
});

export const recurringBookingSchema = z.object({
  isRecurring: z.boolean(),
  recurringType: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  recurringEndDate: z.string().optional(),
  recurringDays: z.array(z.number().min(0).max(6)).optional(),
}).refine((data) => {
  if (data.isRecurring) {
    return data.recurringType && data.recurringEndDate;
  }
  return true;
}, {
  message: "Recurring type and end date are required for recurring bookings",
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type RecurringBookingData = z.infer<typeof recurringBookingSchema>;

export const validateBookingTime = (date: string, time: string): boolean => {
  const bookingDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  
  // Must be at least 2 hours in the future
  const minBookingTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return bookingDateTime >= minBookingTime;
};

export const validateBusinessHours = (time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Business hours: 9 AM to 6 PM
  const startTime = 9 * 60; // 9:00 AM
  const endTime = 18 * 60; // 6:00 PM
  
  return timeInMinutes >= startTime && timeInMinutes <= endTime;
};