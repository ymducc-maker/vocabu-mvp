import type { Goals, Plan } from '../../types';
import { buildPackage } from './buildPackage';

export function calcPlan(goals: Goals): Plan {
  const daily = goals.wordsPerDay;
  const weekly = daily * 7;
  const totalWords = daily * goals.horizonDays;

  const { week, today } = buildPackage(goals);

  return {
    daily,
    weekly,
    totalWords,
    contextId: goals.contextId,
    horizonDays: goals.horizonDays,
    weekPackage: week,
    todaySet: today,
  };
}
