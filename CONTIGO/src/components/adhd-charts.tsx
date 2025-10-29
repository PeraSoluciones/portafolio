'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
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
        backgroundColor: ['#00A1E4', '#FDBB30', '#0055A4'],
        borderColor: '#FFFFFF',
        borderWidth: 3,
      },
    ],
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
          title: tooltipTitleCallback,
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
        height: '350px',
        maxHeight: '400px',
      }}
    >
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
    ['Tarjeta', 'Casa-Escuela'],
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
          '#FDBB30',
        ],
        borderRadius: 4,
      },
    ],
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
          display: false,
        },
      },
      y: {
        ticks: {
          autoSkip: false,
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        height: '400px',
        maxHeight: '450px',
      }}
    >
      <Bar data={data} options={options} />
    </div>
  );
};

// --- Nuevos componentes para el recurso de Hábitos ---

export const BehavioralChart = () => {
  const data = {
    labels: [
      'Terapia Conductual (Entrenamiento Padres)',
      'Medicación (Niños < 6)',
      'Otros Enfoques',
    ],
    datasets: [
      {
        label: 'Recomendación de Primera Línea (Niños < 6)',
        data: [75, 15, 10],
        backgroundColor: ['#38A169', '#3B5998', '#8B9DC3'],
        borderColor: '#F7F7F7',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Recomendación de 1ra Línea (Niños < 6 años)',
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
  };

  return (
    <div
      className='chart-container'
      style={{ maxWidth: '400px', height: '300px', maxHeight: '300px' }}
    >
      <Doughnut data={data} options={options} />
    </div>
  );
};

export const RoutineChart = () => {
  const chartRef = useRef<any>(null);
  const data = {
    labels: [
      'Semana 1',
      'Semana 2',
      'Semana 3',
      'Semana 4',
      'Semana 5',
      'Semana 6',
      'Semana 7',
      'Semana 8',
    ],
    datasets: [
      {
        label: 'Conflictos en Tareas',
        data: [8, 7, 7, 6, 4, 3, 2, 2],
        borderColor: '#E53E3E',
        backgroundColor: 'rgba(229, 62, 62, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Tareas Completadas a Tiempo',
        data: [2, 3, 4, 5, 6, 7, 8, 9],
        borderColor: '#38A169',
        backgroundColor: 'rgba(56, 161, 105, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Impacto de la Rutina Constante (8 Semanas)',
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nivel de Frecuencia',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Semanas de Práctica',
        },
      },
    },
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='chart-container w-full' style={{ height: '350px' }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export const LifestyleChart = () => {
  const chartRef = useRef<any>(null);
  const data = {
    labels: ['Sueño Adecuado', 'Nutrición Balanceada', 'Ejercicio Diario'],
    datasets: [
      {
        label: 'Impacto Ideal',
        data: [9, 8, 8],
        fill: true,
        backgroundColor: 'rgba(56, 161, 105, 0.3)',
        borderColor: '#38A169',
        pointBackgroundColor: '#38A169',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#38A169',
      },
      {
        label: 'Desequilibrio Común',
        data: [5, 6, 4],
        fill: true,
        backgroundColor: 'rgba(229, 62, 62, 0.3)',
        borderColor: '#E53E3E',
        pointBackgroundColor: '#E53E3E',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#E53E3E',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Equilibrio de Hábitos de Estilo de Vida',
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
    scales: {
      r: {
        angleLines: {
          display: false,
        },
        suggestedMin: 0,
        suggestedMax: 10,
        pointLabels: {
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          color: '#3B5998',
        },
      },
    },
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='chart-container w-full' style={{ height: '350px' }}>
      <Radar ref={chartRef} data={data} options={options} />
    </div>
  );
};

// --- Componentes para la infografía 'Comportamientos.html' ---

export const HeredabilityChart = () => {
  const data = {
    labels: ['Genética Estimada', 'Otros Factores'],
    datasets: [
      {
        data: [80, 20],
        backgroundColor: [
          '#ff2930', // Salí rojo/rosado para 'brand-red'
          '#2a9ae5', // Gris oscuro para 'brand-dark'
        ],
        borderColor: '#f8fafc',
        borderWidth: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        height: '300px',
        maxHeight: '350px',
      }}
    >
      <Doughnut data={data} options={options} />
    </div>
  );
};

export const BehaviorRadarChart = () => {
  const data = {
    labels: ['Inatención', 'Hiperactividad', 'Impulsividad'],
    datasets: [
      {
        label: 'Perfil de Ejemplo',
        data: [8, 6, 9],
        backgroundColor: '#ff2930',
        borderColor: '#ff2930',
        pointBackgroundColor: '#ff2930',
        pointBorderColor: '#020817',
        pointHoverBackgroundColor: '#020817',
        pointHoverBorderColor: '#ff2930',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        ticks: {
          stepSize: 2,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        height: '300px',
        maxHeight: '350px',
      }}
    >
      <Radar data={data} options={options} />
    </div>
  );
};

export const TreatmentByAgeChart = () => {
  const data = {
    labels: ['4-5 Años', '6-17 Años'],
    datasets: [
      {
        label: 'Entrenamiento Padres (EPC)',
        data: [100, 50],
        backgroundColor: '#2a9ae5', // Verde para 'brand-green'
      },
      {
        label: 'Medicación',
        data: [0, 50],
        backgroundColor: '#5a9f1e', // Azul para 'brand-blue'
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
        },
      },
      y: {
        stacked: true,
        ticks: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback,
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += context.parsed.x + '%';
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        height: '400px',
      }}
    >
      <Bar data={data} options={options} />
    </div>
  );
};
