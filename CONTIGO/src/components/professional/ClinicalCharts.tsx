'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ClinicalChartsProps {
  type: 'pie' | 'bar';
  data: any[];
}

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24'];

export function ClinicalCharts({ type, data }: ClinicalChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
        No hay datos suficientes
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className='h-[300px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={data}
              cx='50%'
              cy='50%'
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey='value'
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className='h-[300px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={data}
            layout='vertical'
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' horizontal={false} />
            <XAxis type='number' />
            <YAxis
              type='category'
              dataKey='name'
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey='value' fill='#f87171' radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
