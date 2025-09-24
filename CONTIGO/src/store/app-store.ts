import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Child, AppState } from '@/types';

interface AppStore extends AppState {
  setUser: (user: User | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChild: (child: Child | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addChild: (child: Child) => void;
  updateChild: (childId: string, updates: Partial<Child>) => void;
  removeChild: (childId: string) => void;
  clearStore: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        children: [],
        selectedChild: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user }),
        
        setChildren: (children) => set({ children }),
        
        setSelectedChild: (child) => set({ selectedChild: child }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        addChild: (child) => set((state) => ({
          children: [...state.children, child]
        })),
        
        updateChild: (childId, updates) => set((state) => ({
          children: state.children.map(child =>
            child.id === childId ? { ...child, ...updates } : child
          ),
          selectedChild: state.selectedChild?.id === childId
            ? { ...state.selectedChild, ...updates }
            : state.selectedChild
        })),
        
        removeChild: (childId) => set((state) => ({
          children: state.children.filter(child => child.id !== childId),
          selectedChild: state.selectedChild?.id === childId ? null : state.selectedChild
        })),
        
        clearStore: () => set({
          user: null,
          children: [],
          selectedChild: null,
          isLoading: false,
          error: null
        }),
      }),
      {
        name: 'contigo-storage',
        partialize: (state) => ({
          user: state.user,
          children: state.children,
          selectedChild: state.selectedChild,
        }),
      }
    ),
    {
      name: 'contigo-store',
    }
  )
);