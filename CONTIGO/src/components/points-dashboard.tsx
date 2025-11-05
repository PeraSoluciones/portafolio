'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PointsTransaction, 
  PointsSummary, 
  Child 
} from '@/types/database';
import { 
  getChildPointsBalance, 
  getChildPointsHistory, 
  getChildPointsSummary 
} from '@/lib/services/points-service';
import { useAppStore } from '@/store/app-store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react';

interface PointsDashboardProps {
  child: Child;
}

export function PointsDashboard({ child }: PointsDashboardProps) {
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateChildPoints = useAppStore((state) => state.updateChildPoints);

  useEffect(() => {
    loadPointsData();
  }, [child.id]);

  const loadPointsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [summary, history] = await Promise.all([
        getChildPointsSummary(child.id, 'month'),
        getChildPointsHistory(child.id, { limit: 10 })
      ]);

      setPointsSummary(summary);
      setTransactions(history);
      
      // Actualizar el balance en el store
      updateChildPoints(child.id, summary.current_balance);
    } catch (err) {
      console.error('Error loading points data:', err);
      setError('No se pudieron cargar los datos de puntos');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: PointsTransaction['transaction_type']) => {
    switch (type) {
      case 'BEHAVIOR':
        return <TrendingUp className="h-4 w-4" />;
      case 'HABIT':
      case 'ROUTINE':
        return <Coins className="h-4 w-4" />;
      case 'REWARD_REDEMPTION':
        return <Gift className="h-4 w-4" />;
      case 'ADJUSTMENT':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTransactionBadgeVariant = (points: number) => {
    return points > 0 ? 'default' : 'destructive';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">{error}</p>
            <Button onClick={loadPointsData} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pointsSummary) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Actual
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {pointsSummary.current_balance}
            </div>
            <p className="text-xs text-muted-foreground">
              Puntos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganados esta Semana
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{pointsSummary.earned_this_week}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganados este Mes
            </CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{pointsSummary.earned_this_month}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastados este Mes
            </CardTitle>
            <Gift className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              -{pointsSummary.spent_this_month}
            </div>
            <p className="text-xs text-muted-foreground">
              En recompensas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Puntos</CardTitle>
          <CardDescription>
            Últimas transacciones de {child.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recientes</TabsTrigger>
              <TabsTrigger value="all">Ver Todo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay transacciones recientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getTransactionBadgeVariant(transaction.points)}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Saldo: {transaction.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Vista completa del historial próximamente disponible
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}