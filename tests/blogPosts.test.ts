import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BLOG_POSTS } from '../src/data/blogPosts.ts';

describe('Blog Posts & Content Integrity Suite', () => {
  test('contains at least 24 high-quality enterprise blogs', () => {
    assert.ok(BLOG_POSTS.length >= 24, `Expected >= 24 blogs, found ${BLOG_POSTS.length}`);
  });

  test('all blogs have unique slugs and valid metadata', () => {
    const slugSet = new Set<string>();
    const validCategories = new Set([
      'Healthcare & HIPAA',
      'Finance & PCI-DSS',
      'Legal & Compliance',
      'DevOps & Security'
    ]);

    for (const post of BLOG_POSTS) {
      assert.ok(post.slug && post.slug.length > 3, `Invalid slug: ${post.slug}`);
      assert.ok(!slugSet.has(post.slug), `Duplicate slug detected: ${post.slug}`);
      slugSet.add(post.slug);

      assert.ok(post.title && post.title.length > 10, `Title too short for ${post.slug}`);
      assert.ok(post.subtitle && post.subtitle.length > 15, `Subtitle too short for ${post.slug}`);
      assert.ok(validCategories.has(post.category), `Invalid category ${post.category} for ${post.slug}`);
      assert.ok(post.readTime && post.readTime.includes('read'), `Invalid readTime for ${post.slug}`);
      assert.ok(post.summary && post.summary.length > 30, `Summary too short for ${post.slug}`);
      assert.ok(Array.isArray(post.tags) && post.tags.length >= 3, `Tags missing for ${post.slug}`);
      assert.ok(post.content && post.content.length > 500, `Content too short for ${post.slug}`);
    }
  });

  test('maintains balanced representation across all compliance verticals', () => {
    const counts: Record<string, number> = {
      'Healthcare & HIPAA': 0,
      'Finance & PCI-DSS': 0,
      'Legal & Compliance': 0,
      'DevOps & Security': 0
    };

    for (const post of BLOG_POSTS) {
      counts[post.category]++;
    }

    assert.strictEqual(counts['Healthcare & HIPAA'], 6, 'Expected 6 healthcare articles');
    assert.strictEqual(counts['Finance & PCI-DSS'], 6, 'Expected 6 finance articles');
    assert.strictEqual(counts['Legal & Compliance'], 6, 'Expected 6 legal articles');
    assert.strictEqual(counts['DevOps & Security'], 6, 'Expected 6 devops articles');
  });
});
