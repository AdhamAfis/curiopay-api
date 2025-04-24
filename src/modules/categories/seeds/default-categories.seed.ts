import { CategoryTypeEnum } from '../dto/create-category.dto';

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: CategoryTypeEnum;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Food & Dining',
    icon: '🍽️',
    color: '#FF5733',
    type: CategoryTypeEnum.EXPENSE,
  },
  {
    name: 'Transportation',
    icon: '🚗',
    color: '#33FF57',
    type: CategoryTypeEnum.EXPENSE,
  },
  {
    name: 'Housing',
    icon: '🏠',
    color: '#3357FF',
    type: CategoryTypeEnum.EXPENSE,
  },
  {
    name: 'Utilities',
    icon: '💡',
    color: '#FF33F5',
    type: CategoryTypeEnum.EXPENSE,
  },
  {
    name: 'Healthcare',
    icon: '🏥',
    color: '#33FFF5',
    type: CategoryTypeEnum.EXPENSE,
  },
  {
    name: 'Salary',
    icon: '💰',
    color: '#5733FF',
    type: CategoryTypeEnum.INCOME,
  },
  {
    name: 'Investments',
    icon: '📈',
    color: '#F5FF33',
    type: CategoryTypeEnum.INCOME,
  },
]; 