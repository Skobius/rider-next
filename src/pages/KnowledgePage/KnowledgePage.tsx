import { knowledgeArticles } from '../../data/knowledgeArticles';
import { getCurrentStage } from '../../features/journey/selectors';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function KnowledgePage() {
  const status = useRiderStore((state) => state.profile.status);
  const currentStage = getCurrentStage(status);
  const sortedArticles = [...knowledgeArticles].sort((a, b) => {
    const aRelevant = a.stageIds.includes(currentStage.id) ? 0 : 1;
    const bRelevant = b.stageIds.includes(currentStage.id) ? 0 : 1;
    return aRelevant - bRelevant;
  });

  return (
    <section className="page">
      <PageHeader
        eyebrow="Материалы по делу"
        title="База знаний"
        description="Сначала идут материалы, связанные с твоим текущим этапом."
      />

      <div className="article-list">
        {sortedArticles.map((article) => (
          <article className="article-card" key={article.id}>
            <div>
              <span>{article.tag}</span>
              {article.stageIds.includes(currentStage.id) ? <strong>Сейчас актуально</strong> : null}
            </div>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <p>{article.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
