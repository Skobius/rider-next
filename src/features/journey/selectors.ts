import { riderStages, statusToStageId } from '../../data/riderStages';
import type { RiderStatus } from '../../shared/types/domain';

export function getCurrentStage(status: RiderStatus | null) {
  if (!status) return riderStages[0];
  return riderStages.find((stage) => stage.id === statusToStageId[status]) ?? riderStages[0];
}

export function getNextStage(status: RiderStatus | null) {
  const current = getCurrentStage(status);
  return riderStages.find((stage) => stage.order === current.order + 1) ?? current;
}
