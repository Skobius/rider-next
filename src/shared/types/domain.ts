export type RiderStatus =
  | 'dreaming'
  | 'category'
  | 'licensed'
  | 'first-bike'
  | 'first-season'
  | 'confident'
  | 'travel'
  | 'skills'
  | 'mg67-student';

export type RiderStage = {
  id: string;
  order: number;
  title: string;
  goal: string;
  checklist: string[];
  achievement: string;
  linkedArticleIds: string[];
  linkedSkillIds: string[];
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  stageIds: string[];
  tag: string;
  summary: string;
  body: string;
};

export type TrainingSkill = {
  id: string;
  title: string;
  difficulty: 'Легко' | 'Средне' | 'Сложно';
  why: string;
  check: string;
  mistakes: string[];
};

export type MotorcycleProfile = {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  purchaseDate: string;
  notes: string;
};

export type MaintenanceRecord = {
  id: string;
  title: string;
  mileage: string;
  date: string;
};
