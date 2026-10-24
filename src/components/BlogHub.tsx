import React, { useState } from 'react';
import { BLOG_POSTS, BlogPost } from '../data/blogPosts';
import { BookOpen, ArrowLeft, ArrowRight, Clock, Calendar, User, Sparkles, Tag, ShieldCheck } from 'lucide-react';

interface BlogHubProps {
  onSelectPresetAndLaunch: (presetId: 'healthcare' | 'financial' | 'legal' | 'technical') => void;
}

export const BlogHub: React.FC<BlogHubProps> = ({ onSelectPresetAndLaunch }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Healthcare & HIPAA', 'Finance & PCI-DSS', 'Legal & Compliance', 'DevOps & Security'];

  const filteredPosts = activeCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  // Render Single Post View
  if (selectedPost) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Back navigation */}
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition group"
        >
          <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" />
          <span>Back to All Compliance & AI Guides</span>
        </button>

        {/* Article Container */}
        <article className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          
          {/* Metadata pill */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {selectedPost.category}
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedPost.readTime}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedPost.date}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedPost.author}</span>
            </div>
          </div>

          {/* Titles */}
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {selectedPost.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mt-3 leading-relaxed">
              {selectedPost.subtitle}
            </p>
          </div>

          {/* Interactive Scenario CTA Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-950 to-indigo-950/60 border border-sky-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Test This Compliance Scenario In Real-Time
                </h4>
                <p className="text-xs text-slate-300">
                  Load this article's dataset directly into the RedactOps Studio with 0 bytes server egress.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectPresetAndLaunch(selectedPost.samplePresetId)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-md shadow-sky-500/20 flex items-center space-x-1.5 flex-shrink-0"
            >
              <span>Launch Studio Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Markdown Content Parser */}
          <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-sm sm:text-base leading-relaxed border-t border-slate-800 pt-6">
            {selectedPost.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg sm:text-xl font-bold text-white pt-4 pb-1">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={index} className="text-base sm:text-lg font-semibold text-sky-400 pt-2">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('```')) {
                const codeContent = paragraph.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
                return (
                  <pre key={index} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-sky-300 overflow-x-auto">
                    {codeContent}
                  </pre>
                );
              }
              if (paragraph.startsWith('* ')) {
                const items = paragraph.split('\n* ').map(i => i.replace(/^\* /, ''));
                return (
                  <ul key={index} className="list-disc list-inside space-y-1.5 text-slate-300 pl-2">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          <div className="border-t border-slate-800 pt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 mr-2">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {selectedPost.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950 border border-slate-800 text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>

        </article>

      </div>
    );
  }

  // Render Grid / Hub View
  return (
    <div className="space-y-6">
      
      {/* Blog Hub Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900 border border-slate-800">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Compliance, LegalTech & AI Privacy Guides</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How to Scale Generative AI Safely
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            In-depth architectural playbooks for handling HIPAA medical notes, PCI cardholder data, attorney-client privileged depositions, and cloud infrastructure secrets.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.slug}
            onClick={() => setSelectedPost(post)}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition group cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-sky-500/5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition leading-snug">
                {post.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {post.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {post.date}
              </span>
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* SEO Programmatic Keyword Footer Banner */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Need a customized compliance report or BAA for your clinic or enterprise team?</span>
        </div>
        <a
          href="mailto:thinklabs76@gmail.com"
          className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 flex-shrink-0"
        >
          Contact thinklabs76@gmail.com
        </a>
      </div>

    </div>
  );
};
