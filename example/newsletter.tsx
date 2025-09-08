import { createTSXTemplate } from "../src/templates/tsx-renderer";
import type { TemplateData } from "../src/templates/types";

interface NewsletterData extends TemplateData {
  companyName: string;
  recipientName: string;
  month: string;
  year: string;
  articles: Array<{
    title: string;
    summary: string;
    link: string;
    category: string;
  }>;
  featuredArticle?: {
    title: string;
    summary: string;
    link: string;
    imageUrl?: string;
  };
  unsubscribeLink: string;
}

function NewsletterEmail(data: NewsletterData) {
  return (
    <div className="email-container p-5">
      <header className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl text-gray-800">{data.companyName} Newsletter</h1>
        <p className="text-gray-600 text-lg">
          {data.month} {data.year}
        </p>
      </header>

      <p className="mb-6 text-gray-700">Hi {data.recipientName},</p>

      <p className="mb-8 text-gray-700">Here's what's new this month at {data.companyName}:</p>

      {data.featuredArticle && (
        <div className="mb-8 border-blue-400 border-l-4 bg-blue-50 p-6">
          <h2 className="mb-3 font-bold text-2xl text-blue-800">Featured Article</h2>
          <h3 className="mb-3 font-semibold text-gray-800 text-xl">{data.featuredArticle.title}</h3>
          <p className="mb-4 text-gray-700">{data.featuredArticle.summary}</p>
          <a
            className="email-button bg-blue-600 hover:bg-blue-700"
            href={data.featuredArticle.link}
          >
            Read More
          </a>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-6 font-bold text-2xl text-gray-800">Latest Articles</h2>
        <div className="space-y-6">
          {data.articles.map((article, index) => (
            <article
              className="border-gray-200 border-b pb-6 last:border-b-0"
              key={`article-${index}-${article.title}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-gray-600 text-sm">
                    {article.category}
                  </span>
                  <h3 className="mb-2 font-semibold text-gray-800 text-lg">{article.title}</h3>
                  <p className="mb-3 text-gray-600">{article.summary}</p>
                </div>
              </div>
              <a
                className="font-medium text-blue-600 text-sm underline hover:text-blue-800"
                href={article.link}
              >
                Read Article →
              </a>
            </article>
          ))}
        </div>
      </div>

      <footer className="mt-8 border-gray-200 border-t pt-6">
        <p className="mb-4 text-center text-gray-600 text-sm">
          Thank you for being part of the {data.companyName} community!
        </p>
        <p className="text-center text-gray-500 text-xs">
          <a className="text-gray-400 underline hover:text-gray-600" href={data.unsubscribeLink}>
            Unsubscribe
          </a>{" "}
          | {data.companyName}
        </p>
      </footer>
    </div>
  );
}

const template = createTSXTemplate({
  name: "newsletter",
  subject: "{{companyName}} Newsletter - {{month}} {{year}}",
  text: `{{companyName}} Newsletter - {{month}} {{year}}

Hi {{recipientName}},

Here's what's new this month at {{companyName}}:

{{#if featuredArticle}}
Featured Article: {{featuredArticle.title}}
{{featuredArticle.summary}}
Read more: {{featuredArticle.link}}

{{/if}}
Latest Articles:
{{#each articles}}
- {{title}} ({{category}})
  {{summary}}
  Read more: {{link}}

{{/each}}
Thank you for being part of the {{companyName}} community!

Unsubscribe: {{unsubscribeLink}}`,
  component: NewsletterEmail,
  description: "Newsletter email template with TSX support and dynamic content",
  variables: [
    "companyName",
    "recipientName",
    "month",
    "year",
    "articles",
    "featuredArticle",
    "unsubscribeLink",
  ],
});

export default template;
