
import React from "react";
const Footer = () => {
  return <footer className="w-full bg-background py-12 border-t border-border">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-pulse-500 mb-4">सेवा (Seva)</h3>
            <p className="text-muted-foreground mb-4">
              Professional home services at your doorstep. Trusted, verified, and affordable.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-pulse-500 transition-colors">
                Download App
              </a>
              <a href="#" className="text-muted-foreground hover:text-pulse-500 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Home Cleaning</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Electrician</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Plumbing</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Beauty & Spa</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">AC Repair</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-pulse-500 transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8">
          <p className="text-center text-muted-foreground text-sm">
            © 2024 सेवा (Seva). All rights reserved. | Bringing professional services to your doorstep.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;
