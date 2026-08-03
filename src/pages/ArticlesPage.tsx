import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, BookOpen, Tag, ChevronRight } from 'lucide-react';
import { ARTICLES, getArticleCategories, getArticlesByCategory } from '@/data/articles';
import { SEOHead } from '@/lib/seo';

export function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const categories = getArticleCategories();
  const filtered = getArticlesByCategory(activeCategory).filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <SEOHead
        title="Articles & Guides"
        description="Read our latest articles about real estate, property laws, and legal guides for Pakistan. Topics cover property buying, legal documentation, tax guides, and more."
        canonical="/articles"
      />

      <section className="bg-gradient-to-br from-amber-900 via-navy-800 to-amber-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
              <BookOpen className="h-3.5 w-3.5" /> Knowledge Base
            </span>
            <h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl">
              Articles & Guides
            </h1>
            <p className="mt-3 text-navy-100">
              Expert guides on real estate, property laws, taxes, and legal documentation in Pakistan
            </p>
          </div>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-xl border border-gold-300/30 bg-white/10 py-3.5 pl-12 pr-4 text-white placeholder-navy-300 backdrop-blur focus:border-gold-400 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-gold-400 text-navy-800'
                  : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-navy-300" />
            <p className="mt-3 text-lg font-semibold text-navy-700">No articles found</p>
            <p className="text-sm text-navy-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article, i) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="card-3d group flex flex-col overflow-hidden border border-gold-200/40"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-navy-100">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-semibold text-navy-800">
                      {article.category}
                    </span>
                  </div>
                  {article.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      Featured
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="line-clamp-2 font-serif text-lg font-bold text-navy-800 group-hover:text-gold-700 transition">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-navy-500">
                    {article.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3 text-xs text-navy-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {article.readingTime} min read
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-gold-600 transition group-hover:gap-2">
                      Read More <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] text-navy-500"
                      >
                        <Tag className="h-2.5 w-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
