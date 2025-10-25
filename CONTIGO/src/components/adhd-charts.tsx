'use client';

import { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const tooltipTitleCallback = (tooltipItems: any) => {
  const item = tooltipItems[0];
  let label = item.chart.data.labels[item.dataIndex];
  if (Array.isArray(label)) {
    return label.join(' ');
  } else {
    return label;
  }
};

export const SymptomChart = () => {
  const data = {
    labels: ['Falta de Atención', 'Hiperactividad', 'Impulsividad'],
    datasets: [
      {
        label: 'Síntomas Nucleares',
        data: [33.3, 33.3, 33.3],
        backgroundColor: [
          '#00A1E4',
          '#FDBB30',
          '#0055A4'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', height: '350px', maxHeight: '400px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export const AdaptationsChart = () => {
  const wrappedLabels = [
    ['Instrucciones', 'Claras'],
    ['Ubicación', 'Estratégica'],
    ['Tiempo Adicional', 'en Exámenes'],
    ['Pausas Activas', 'Programadas'],
    ['Tarjeta', 'Casa-Escuela']
  ];

  const data = {
    labels: wrappedLabels,
    datasets: [
      {
        label: 'Efectividad Percibida (%)',
        data: [90, 85, 75, 80, 95],
        backgroundColor: [
          '#00A1E4',
          '#00A1E4',
          '#00A1E4',
          '#00A1E4',
          '#FDBB30'
        ],
        borderRadius: 4
      }
    ]
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          autoSkip: false
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', height: '400px', maxHeight: '450px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};