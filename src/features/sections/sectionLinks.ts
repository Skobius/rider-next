import { guides } from '../../data/guides';
import type { SectionTask } from '../../data/sectionTasks';

export function buildSearchPath(params?: Record<string, string>, query?: string) {
  const next = new URLSearchParams();

  if (query) next.set('q', query);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });

  const queryString = next.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

export function getGuidePathById(id: string | undefined) {
  const guide = guides.find((item) => item.id === id);
  return guide ? `/guides/${guide.slug}` : undefined;
}

export function getTaskPath(task: SectionTask) {
  if (task.targetType === 'search' || task.targetType === 'category') {
    return buildSearchPath(task.filters, task.query);
  }

  if (task.targetType === 'guide') {
    return getGuidePathById(task.id) ?? `/placeholder/${task.id}`;
  }

  return `/placeholder/${task.id}`;
}
