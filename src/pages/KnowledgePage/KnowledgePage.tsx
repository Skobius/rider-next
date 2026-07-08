import { knowledgeArticles } from '../../data/knowledgeArticles';
import { getMissionForStatus } from '../../data/missions';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function KnowledgePage() {
  const status = useRiderStore((state) => state.profile.status);
  const mission = getMissionForStatus(status);
  const missionArticles = knowledgeArticles.filter((article) => mission.articleIds.includes(article.id));
  const otherArticles = knowledgeArticles.filter((article) => !mission.articleIds.includes(article.id)).slice(0, 4);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Коротко по делу"
        title="Советы к миссии"
        description="Сначала только то, что помогает выполнить текущую миссию. Остальное ниже и без давления."
      />

      <div className="focus-strip">
        <span>Текущая миссия</span>
        <strong>{mission.title}</strong>
      </div>

      <div className="article-list">
        {missionArticles.map((article) => (
          <article className="article-card article-card--focus" key={article.id}>
            <div>
              <span>{article.tag}</span>
              <strong>Нужно сейчас</strong>
            </div>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <p>{article.body}</p>
          </article>
        ))}
      </div>

      <section className="section-block section-block--quiet">
        <h2>Можно посмотреть позже</h2>
        <div className="mini-list">
          {otherArticles.map((article) => (
            <article key={article.id}>
              <span>{article.tag}</span>
              <strong>{article.title}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
