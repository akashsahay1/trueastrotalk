"use client";

import Link from "next/link";
import React, { useState } from "react";
import Header from "@/components/frontend/Header";
import Footer from "@/components/frontend/Footer";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Header />
      
      <main style={{paddingTop: '120px', paddingBottom: '80px'}}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              {/* Back to Home */}
              <div className="mb-4">
                <Link href="/" className="btn btn-outline-primary">
                  ← Back to Home
                </Link>
              </div>

              {/* Page Header */}
              <div className="text-center mb-5">
                <h1 className="display-4 font-weight-bold text-dark mb-3">Contact Us</h1>
                <p className="lead text-muted">
                  Get in touch with our team for any questions or support
                </p>
              </div>

              <div className="row">
                {/* Contact Information */}
                <div className="col-lg-4 mb-5">
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body text-center p-4">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px', fontSize: '24px'}}>
                        📞
                      </div>
                      <h5 className="card-title">Call Us</h5>
                      <p className="text-success font-weight-bold">+91 9876543210</p>
                      <small className="text-muted">Available 24/7 for immediate assistance</small>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body text-center p-4">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px', fontSize: '24px'}}>
                        💬
                      </div>
                      <h5 className="card-title">WhatsApp</h5>
                      <p className="text-success font-weight-bold">+91 9876543210</p>
                      <small className="text-muted">Quick responses via WhatsApp</small>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body text-center p-4">
                      <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px', fontSize: '24px'}}>
                        📧
                      </div>
                      <h5 className="card-title">Email Us</h5>
                      <p className="text-primary font-weight-bold">support@trueastrotalk.com</p>
                      <small className="text-muted">We respond within 4 hours</small>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body text-center p-4">
                      <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px', fontSize: '24px'}}>
                        📍
                      </div>
                      <h5 className="card-title">Visit Us</h5>
                      <p className="text-info font-weight-bold">Mumbai, Maharashtra, India</p>
                      <small className="text-muted">Corporate Office</small>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-5">
                      <h3 className="mb-4">Send us a Message</h3>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="name" className="form-label">Full Name *</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              placeholder="Enter your full name"
                            />
                          </div>
                          
                          <div className="col-md-6 mb-3">
                            <label htmlFor="email" className="form-label">Email Address *</label>
                            <input
                              type="email"
                              className="form-control form-control-lg"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input
                              type="tel"
                              className="form-control form-control-lg"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="Enter your phone number"
                            />
                          </div>
                          
                          <div className="col-md-6 mb-3">
                            <label htmlFor="subject" className="form-label">Subject *</label>
                            <select
                              className="form-control form-control-lg"
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select a subject</option>
                              <option value="consultation">Consultation Inquiry</option>
                              <option value="technical">Technical Support</option>
                              <option value="billing">Billing Question</option>
                              <option value="feedback">Feedback</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label htmlFor="message" className="form-label">Message *</label>
                          <textarea
                            className="form-control"
                            id="message"
                            name="message"
                            rows={6}
                            value={formData.message}
                            onChange={handleChange}
                            required
                            placeholder="Please describe how we can help you..."
                          ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-block">
                          Send Message 📤
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="row mt-5">
                <div className="col-12">
                  <div className="card border-0 shadow-sm bg-light">
                    <div className="card-body p-5 text-center">
                      <h4 className="mb-4">Business Hours</h4>
                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <h6 className="text-primary">🕒 24/7 Chat Support</h6>
                          <p className="mb-0 text-muted">Always available online</p>
                        </div>
                        <div className="col-md-3 mb-3">
                          <h6 className="text-success">📞 Phone Support</h6>
                          <p className="mb-0 text-muted">Mon - Sun: 9 AM - 11 PM</p>
                        </div>
                        <div className="col-md-3 mb-3">
                          <h6 className="text-info">📧 Email Support</h6>
                          <p className="mb-0 text-muted">Response within 4 hours</p>
                        </div>
                        <div className="col-md-3 mb-3">
                          <h6 className="text-warning">🏢 Office Hours</h6>
                          <p className="mb-0 text-muted">Mon - Fri: 10 AM - 6 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ContactPage;