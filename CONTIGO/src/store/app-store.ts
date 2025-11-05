import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Child, PointsTransaction, PointsSummary, RoutineHabit } from '@/types/index';

interface AppStore {
  user: User | null;
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
  
  // Estado del sistema de puntos
  pointsTransactions: PointsTransaction[];
  pointsSummary: PointsSummary | null;
  routineHabits: RoutineHabit[];
  
  // Acciones básicas
  setUser: (user: User | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChild: (child: Child | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addChild: (child: Child) => void;
  updateChild: (childId: string, updates: Partial<Child>) => void;
  removeChild: (childId: string) => void;
  clearStore: () => void;
  
  // Acciones del sistema de puntos
  setPointsTransactions: (transactions: PointsTransaction[]) => void;
  addPointsTransaction: (transaction: PointsTransaction) => void;
  setPointsSummary: (summary: PointsSummary) => void;
  setRoutineHabits: (routineHabits: RoutineHabit[]) => void;
  addRoutineHabit: (routineHabit: RoutineHabit) => void;
  updateRoutineHabit: (id: string, updates: Partial<RoutineHabit>) => void;
  removeRoutineHabit: (id: string) => void;
  
  // Acciones específicas de puntos
  updateChildPoints: (childId: string, newBalance: number) => void;
  refreshChildPoints: (childId: string) => Promise<void>;
  fetchChildrenWithPoints: () => Promise<void>;
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
        
        // Estado del sistema de puntos
        pointsTransactions: [],
        pointsSummary: null,
        routineHabits: [],

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
          error: null,
          pointsTransactions: [],
          pointsSummary: null,
          routineHabits: []
        }),
        
        // Acciones del sistema de puntos
        setPointsTransactions: (transactions) => set({ pointsTransactions: transactions }),
        
        addPointsTransaction: (transaction) => set((state) => ({
          pointsTransactions: [transaction, ...state.pointsTransactions]
        })),
        
        setPointsSummary: (summary) => set({ pointsSummary: summary }),
        
        setRoutineHabits: (routineHabits) => set({ routineHabits }),
        
        addRoutineHabit: (routineHabit) => set((state) => ({
          routineHabits: [...state.routineHabits, routineHabit]
        })),
        
        updateRoutineHabit: (id, updates) => set((state) => ({
          routineHabits: state.routineHabits.map(rh =>
            rh.id === id ? { ...rh, ...updates } : rh
          )
        })),
        
        removeRoutineHabit: (id) => set((state) => ({
          routineHabits: state.routineHabits.filter(rh => rh.id !== id)
        })),
        
        // Acciones específicas de puntos
        updateChildPoints: (childId, newBalance) => set((state) => ({
          children: state.children.map(child =>
            child.id === childId ? { ...child, points_balance: newBalance } : child
          ),
          selectedChild: state.selectedChild?.id === childId
            ? { ...state.selectedChild, points_balance: newBalance }
            : state.selectedChild
        })),
        
        refreshChildPoints: async (childId) => {
          try {
            const { createBrowserClient } = await import('@/lib/supabase/client');
            const supabase = createBrowserClient();
            
            const { data, error } = await supabase
              .rpc('get_child_points_balance', { p_child_id: childId });
            
            if (error) throw error;
            
            get().updateChildPoints(childId, data);
          } catch (error) {
            console.error('Error refreshing child points:', error);
            get().setError('Error al actualizar los puntos del niño');
          }
        },
        
        fetchChildrenWithPoints: async () => {
          try {
            get().setLoading(true);
            
            const response = await fetch('/api/children', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch children');
            }

            const children = await response.json();
            get().setChildren(children);
          } catch (error) {
            console.error('Error fetching children with points:', error);
            get().setError('Error al cargar los hijos con sus puntos');
          } finally {
            get().setLoading(false);
          }
        },
      }),
      {
        name: 'contigo-storage',
        partialize: (state) => ({
          user: state.user,
          children: state.children,
          selectedChild: state.selectedChild,
          pointsTransactions: state.pointsTransactions.slice(0, 50), // Solo persistir las últimas 50 transacciones
        }),
      }
    ),
    {
      name: 'contigo-store',
    }
  )
);