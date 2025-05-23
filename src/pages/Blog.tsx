
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: "AI-Driven Business Finance: The Future is Now",
      excerpt: "Discover how artificial intelligence is revolutionizing small business financing and what it means for entrepreneurs.",
      author: "Clearfund AI Team",
      date: "2024-01-15",
      category: "AI Finance",
      readTime: "5 min read",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Working Capital Solutions for Growing Businesses",
      excerpt: "Learn about different working capital options and how to choose the right financing for your business growth.",
      author: "Financial Experts",
      date: "2024-01-10",
      category: "Business Finance",
      readTime: "7 min read",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Credit Repair: A Step-by-Step Guide",
      excerpt: "Understanding the credit repair process and how it can impact your business financing opportunities.",
      author: "Credit Specialists",
      date: "2024-01-05",
      category: "Credit Repair",
      readTime: "6 min read",
      image: "/placeholder.svg"
    },
    {
      id: 4,
      title: "Micro Funding for Gig Economy Workers",
      excerpt: "Explore instant funding solutions designed specifically for freelancers and gig economy professionals.",
      author: "Gig Finance Team",
      date: "2023-12-28",
      category: "Micro Funding",
      readTime: "4 min read",
      image: "/placeholder.svg"
    },
    {
      id: 5,
      title: "Understanding Business Term Loans",
      excerpt: "A comprehensive guide to term loans, including rates, terms, and application processes for small businesses.",
      author: "Lending Experts",
      date: "2023-12-20",
      category: "Term Loans",
      readTime: "8 min read",
      image: "/placeholder.svg"
    },
    {
      id: 6,
      title: "Equipment Financing: Fund Your Business Growth",
      excerpt: "Learn how equipment financing can help you acquire the tools and machinery needed to scale your operations.",
      author: "Equipment Finance Team",
      date: "2023-12-15",
      category: "Equipment Finance",
      readTime: "6 min read",
      image: "/placeholder.svg"
    }
  ];

  const categories = ["All", "AI Finance", "Business Finance", "Credit Repair", "Micro Funding", "Term Loans", "Equipment Finance"];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-clearfund-pale-blue to-white py-16">
          <div className="container-custom">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-clearfund-dark-blue mb-4">
                Clearfund AI Blog
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Stay informed with the latest insights on business financing, AI-driven solutions, and financial growth strategies.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-8 bg-white border-b">
          <div className="container-custom">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-clearfund-blue hover:text-white transition-colors"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video bg-gradient-to-br from-clearfund-pale-blue to-clearfund-blue rounded-t-lg"></div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-clearfund-dark-blue hover:text-clearfund-blue transition-colors">
                      <Link to={`/blog/${post.id}`} className="block">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/blog/${post.id}`}
                        className="flex items-center gap-1 text-clearfund-blue hover:text-clearfund-dark-blue transition-colors"
                      >
                        Read more
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-clearfund-dark-blue text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-clearfund-pale-blue mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest insights on business financing and AI-driven financial solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <button className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue px-6 py-3 rounded-lg font-semibold transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
