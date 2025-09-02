"use client";

import Link from "next/link";
import React from "react";
import Header from "@/components/frontend/Header";
import Footer from "@/components/frontend/Footer";

const BlogPage = () => {
  const featuredArticles = [
    {
      id: 1,
      title: "Understanding Your Birth Chart: A Complete Guide for Beginners",
      excerpt: "Learn how to read your birth chart and understand the cosmic influences that shape your personality and life path.",
      author: "Pandit Rajesh Kumar",
      date: "March 15, 2024",
      readTime: "8 min read",
      category: "Vedic Astrology",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      featured: true
    },
    {
      id: 2,
      title: "Mercury Retrograde 2024: What Each Zodiac Sign Should Expect",
      excerpt: "Navigate through Mercury retrograde with confidence. Discover how this cosmic event affects your sign and practical tips to thrive.",
      author: "Dr. Priya Sharma",
      date: "March 12, 2024",
      readTime: "6 min read",
      category: "Planetary Movements",
      image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&h=300&fit=crop",
      featured: true
    },
    {
      id: 3,
      title: "Love and Compatibility: Venus Signs in Relationships",
      excerpt: "Explore how Venus signs influence your romantic relationships and discover your perfect astrological match.",
      author: "Acharya Vikram Singh",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Love & Relationships",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2260?w=400&h=300&fit=crop",
      featured: false
    }
  ];

  const categories = [
    { name: "Vedic Astrology", count: 24 },
    { name: "Love & Relationships", count: 18 },
    { name: "Career Guidance", count: 15 },
    { name: "Planetary Movements", count: 12 },
    { name: "Numerology", count: 9 },
    { name: "Tarot Reading", count: 7 },
    { name: "Vastu Shastra", count: 6 },
    { name: "Gemstones", count: 4 }
  ];

  const recentPosts = [
    {
      title: "Jupiter Transit 2024: Impact on All Zodiac Signs",
      date: "March 14, 2024",
      category: "Planetary Movements"
    },
    {
      title: "Best Gemstones for Success and Prosperity",
      date: "March 13, 2024",
      category: "Gemstones"
    },
    {
      title: "Vastu Tips for Home Office",
      date: "March 11, 2024",
      category: "Vastu Shastra"
    },
    {
      title: "Daily Horoscope Accuracy: Fact vs Fiction",
      date: "March 9, 2024",
      category: "Vedic Astrology"
    }
  ];

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
                <h1 className="display-4 font-weight-bold text-dark mb-3">Astrology Blog</h1>
                <p className="lead text-muted">
                  Discover insights about astrology, horoscopes, and spiritual guidance from our expert astrologers
                </p>
              </div>

              <div className="row">
                {/* Main Content */}
                <div className="col-lg-8 mb-5">
                  {/* Featured Article */}
                  {featuredArticles.filter(article => article.featured).slice(0, 1).map((article) => (
                    <div key={article.id} className="card border-0 shadow-sm mb-5 overflow-hidden">
                      <div className="row no-gutters">
                        <div className="col-md-6">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="img-fluid h-100"
                            style={{objectFit: 'cover', minHeight: '300px'}}
                          />
                        </div>
                        <div className="col-md-6">
                          <div className="card-body p-4">
                            <span className="badge badge-primary mb-3">Featured Article</span>
                            <h3 className="card-title font-weight-bold">{article.title}</h3>
                            <p className="card-text text-muted">{article.excerpt}</p>
                            <div className="d-flex flex-wrap text-muted small mb-3">
                              <span className="mr-3 mb-1">📅 {article.date}</span>
                              <span className="mr-3 mb-1">👤 {article.author}</span>
                              <span className="mr-3 mb-1">⏱️ {article.readTime}</span>
                            </div>
                            <Link href={`/blog/${article.id}`} className="btn btn-primary">
                              Read Article
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Recent Articles Grid */}
                  <h3 className="mb-4">Recent Articles</h3>
                  <div className="row">
                    {featuredArticles.slice(1).map((article) => (
                      <div key={article.id} className="col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="card-img-top"
                            style={{height: '200px', objectFit: 'cover'}}
                          />
                          <div className="card-body d-flex flex-column">
                            <span className="badge badge-secondary mb-2 align-self-start">{article.category}</span>
                            <h5 className="card-title font-weight-bold">{article.title}</h5>
                            <p className="card-text text-muted">{article.excerpt}</p>
                            <div className="mt-auto">
                              <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
                                <span>👤 {article.author}</span>
                                <span>📅 {article.date}</span>
                              </div>
                              <Link href={`/blog/${article.id}`} className="btn btn-outline-primary btn-sm">
                                Read More
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  <div className="text-center mt-5">
                    <button className="btn btn-primary btn-lg">Load More Articles</button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                  {/* Categories */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0">
                      <h5 className="mb-0 font-weight-bold">Categories</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled mb-0">
                        {categories.map((category, index) => (
                          <li key={index} className="mb-2">
                            <Link href={`/blog/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}>
                              <a className="d-flex justify-content-between text-decoration-none text-dark">
                                <span>{category.name}</span>
                                <span className="badge badge-light">{category.count}</span>
                              </a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0">
                      <h5 className="mb-0 font-weight-bold">Recent Posts</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled mb-0">
                        {recentPosts.map((post, index) => (
                          <li key={index} className="mb-3">
                            <Link href={`/blog/post-${index}`}>
                              <a className="text-decoration-none text-dark">
                                <h6 className="mb-1 font-weight-medium">{post.title}</h6>
                                <div className="d-flex justify-content-between text-muted small">
                                  <span>{post.category}</span>
                                  <span>{post.date}</span>
                                </div>
                              </a>
                            </Link>
                            {index < recentPosts.length - 1 && <hr className="mt-3" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Newsletter Signup */}
                  <div className="card border-0 shadow-sm bg-primary text-white">
                    <div className="card-body text-center p-4">
                      <h5 className="card-title">Stay Updated</h5>
                      <p className="card-text">Get the latest astrological insights delivered to your inbox.</p>
                      <form className="mt-3">
                        <div className="form-group">
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <button type="submit" className="btn btn-light btn-block">
                          Subscribe
                        </button>
                      </form>
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

export default BlogPage;