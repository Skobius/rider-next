import { searchContent, type SearchItem, type SearchItemType } from '../../data/searchContent';

const detailPathByType: Record<SearchItemType, string> = {
  place: 'place',
  route: 'route',
  event: 'event',
};

export function getSearchItemPath(item: Pick<SearchItem, 'id' | 'type'>) {
  return `/${detailPathByType[item.type]}/${item.id}`;
}

export function findSearchItem(type: SearchItemType, id: string | undefined) {
  if (!id) return undefined;
  return searchContent.find((item) => item.type === type && item.id === id);
}
