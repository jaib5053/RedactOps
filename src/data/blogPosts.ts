import { healthcarePosts } from './blogs/healthcare';
import { financePosts } from './blogs/finance';
import { legalPosts } from './blogs/legal';
import { devopsPosts } from './blogs/devops';

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  category: 'Healthcare & HIPAA' | 'Finance & PCI-DSS' | 'Legal & Compliance' | 'DevOps & Security';
  readTime: string;
  date: string;
  author: string;
  summary: string;
  tags: string[];
  samplePresetId: 'healthcare' | 'financial' | 'legal' | 'technical';
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  ...healthcarePosts,
  ...financePosts,
  ...legalPosts,
  ...devopsPosts
];
