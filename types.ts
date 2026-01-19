
export enum LessonCategory {
  FOUNDATIONS = 'Foundations',
  SUPERVISED = 'Supervised Learning',
  UNSUPERVISED = 'Unsupervised Learning',
  ETHICS = 'Ethics & Bias'
}

export interface LessonStep {
  title: string;
  description: string;
  actionLabel?: string;
  interactiveComponent?: string;
}

export interface Lesson {
  id: string;
  title: string;
  shortDescription: string;
  category: LessonCategory;
  steps: LessonStep[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface UserContext {
  role: string;
  industry: string;
  skillLevel: string;
  goals: string;
  constraints: string;
}
