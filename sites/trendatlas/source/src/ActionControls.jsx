import React from 'react';
import { Check, Plus } from 'lucide-react';

export function PlanAction({ trend, planned, onPlan }) {
  return <button type="button" className={`plan-action ${planned ? 'is-planned' : ''}`} onClick={() => onPlan(trend)} aria-label={planned ? `查看${trend.title}的企划` : `将${trend.title}加入企划`}>
    {planned ? <Check size={15} /> : <Plus size={15} />}
    <span>{planned ? '查看企划' : '加入企划'}</span>
  </button>;
}
