'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Plus, Edit, Trash2, Trophy, Star } from "lucide-react"
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import { Reward } from '@/types/database';

export default function RewardsPage() {
  const router = useRouter();
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (children.length === 0) {
      router.push('/children/new');
      return;
    }

    if (!selectedChild && children.length > 0) {
      setSelectedChild(children[0]);
    }
  }, [user, children, selectedChild, setSelectedChild, router]);

  useEffect(() => {
    if (selectedChild) {
      fetchRewards();
    }
  }, [selectedChild]);

  const fetchRewards = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('child_id', selectedChild.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
    } else {
      setRewards(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta recompensa?')) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
    } else {
      setRewards(rewards.filter(reward => reward.id !== rewardId));
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de hijo */}
        {children.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un hijo</h2>
            <div className="flex flex-wrap gap-4">
              {children.map((child) => (
                <Card
                  key={child.id}
                  className={`cursor-pointer transition-all ${
                    selectedChild?.id === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedChild(child)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-500">{child.age} años</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Recompensas de {selectedChild?.name}
              </h2>
              <p className="text-gray-600 mt-2">
                Gestiona las recompensas disponibles para motivar y celebrar logros
              </p>
            </div>
            <Link href="/rewards/new">
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                Nueva Recompensa
              </Button>
            </Link>
          </div>
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Trophy className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No hay recompensas</h3>
            <p className="text-gray-600 mb-8">
              Crea tu primera recompensa para motivar y celebrar los logros.
            </p>
            <Link href="/rewards/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear primera recompensa
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-semibold">{reward.title}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/rewards/${reward.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(reward.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {reward.description && (
                    <CardDescription>{reward.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {reward.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {reward.points_required} puntos
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Canjear recompensa
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}