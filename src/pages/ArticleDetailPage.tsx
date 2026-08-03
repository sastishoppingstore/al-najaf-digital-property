import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, User, Calendar, Tag, ChevronRight, Share2, BookOpen } from 'lucide-react';
import { getArticleBySlug, getRelatedArticles } from '@/data/articles';
import { SEOHead } from '@/lib/seo';
import { getArticleSchema, getBreadcrumbSchema } from '@/lib/seoUtils';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <BookOpen className="h-12 w-12 text-navy-300" />
        <p className="mt-3 text-lg font-semibold text-navy-700">Article not found</p>
        <Link to="/articles" className="mt-2 text-sm text-gold-600 hover:underline">
          Back to articles
        </Link>
      </div>
    );
  }

  const related = getRelatedArticles(article);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Articles', url: '/articles' },
    { name: article.title, url: `/articles/${article.slug}` },
  ]);

  return (
    <div>
      <SEOHead
        title={article.title}
        description={article.description}
        canonical={`/articles/${article.slug}`}
        ogImage={article.image}
        ogType="article"
        schema={getArticleSchema(article)}
      />

      <div className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm text-navy-500 sm:px-6">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1 hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" /> Articles
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-navy-300" />
          <span className="line-clamp-1 text-navy-700">{article.title}</span>
        </div>
      </div>

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
              {article.category}
            </span>
            {article.featured && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Featured
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-navy-800 sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-navy-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4 text-gold-500" /> {article.author.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gold-500" />{' '}
              {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold-500" /> {article.readingTime} min read
            </span>
          </div>
        </div>

        <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-navy-100">
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-10">
          <div
            className="prose prose-navy max-w-none prose-headings:font-serif prose-headings:text-navy-800 prose-p:text-navy-600 prose-p:leading-relaxed prose-a:text-gold-600 prose-strong:text-navy-700"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-2 border-t border-navy-100 pt-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-600"
            >
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>

         <div className="card-3d tilt-3d mt-10 rounded-2xl border border-navy-100 bg-navy-50/30 p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold-100 font-serif text-xl font-bold text-gold-700">
              {article.author.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-navy-800">{article.author.name}</h3>
              <p className="text-sm text-navy-500">{article.author.bio}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  text: article.description,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
          >
            <Share2 className="h-4 w-4" /> Share this article
          </button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-navy-100 bg-gradient-to-b from-white to-amber-50/30 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-serif text-2xl font-bold text-navy-800">
              Related Articles
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/articles/${r.slug}`}
                  className="card-3d group flex flex-col overflow-hidden border border-gold-200/40"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-navy-100">
                    <img
                      src={r.image}
                      alt={r.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-semibold text-navy-800">
                        {r.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 font-serif text-lg font-bold text-navy-800 group-hover:text-gold-700 transition">
                      {r.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-navy-500">
                      {r.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3 text-xs text-navy-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {r.readingTime} min read
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-gold-600 transition group-hover:gap-2">
                        Read More <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
