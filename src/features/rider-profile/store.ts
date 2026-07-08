import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MaintenanceRecord, MotorcycleProfile, RiderStatus } from '../../shared/types/domain';

type RiderProfile = {
  status: RiderStatus | null;
  completedChecklist: string[];
  completedSkills: string[];
  repeatSkills: string[];
  motorcycle: MotorcycleProfile | null;
  maintenance: MaintenanceRecord[];
};

type RiderState = {
  profile: RiderProfile;
  setStatus: (status: RiderStatus) => void;
  toggleChecklist: (item: string) => void;
  toggleSkillDone: (skillId: string) => void;
  toggleSkillRepeat: (skillId: string) => void;
  saveMotorcycle: (motorcycle: MotorcycleProfile) => void;
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  resetProfile: () => void;
};

const initialProfile: RiderProfile = {
  status: null,
  completedChecklist: [],
  completedSkills: [],
  repeatSkills: [],
  motorcycle: null,
  maintenance: [],
};

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const useRiderStore = create<RiderState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      setStatus: (status) => set((state) => ({ profile: { ...state.profile, status } })),
      toggleChecklist: (item) =>
        set((state) => ({
          profile: { ...state.profile, completedChecklist: toggleInList(state.profile.completedChecklist, item) },
        })),
      toggleSkillDone: (skillId) =>
        set((state) => ({
          profile: { ...state.profile, completedSkills: toggleInList(state.profile.completedSkills, skillId) },
        })),
      toggleSkillRepeat: (skillId) =>
        set((state) => ({
          profile: { ...state.profile, repeatSkills: toggleInList(state.profile.repeatSkills, skillId) },
        })),
      saveMotorcycle: (motorcycle) => set((state) => ({ profile: { ...state.profile, motorcycle } })),
      addMaintenance: (record) =>
        set((state) => ({
          profile: {
            ...state.profile,
            maintenance: [{ ...record, id: crypto.randomUUID() }, ...state.profile.maintenance],
          },
        })),
      resetProfile: () => set({ profile: initialProfile }),
    }),
    { name: 'rider-next-profile' },
  ),
);
