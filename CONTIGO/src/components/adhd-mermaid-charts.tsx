'use client';

import React from 'react';

/**
 * Componente para la línea de tiempo del "Flujo de un Día Estructurado".
 * Utiliza Flexbox para una alineación precisa y colores del tema definidos en globals.css.
 */
const TimelineChart: React.FC = () => {
  const steps = [
    {
      title: 'Mañana',
      description:
        'Horarios fijos para despertar, desayunar, asearse y preparar la mochila.',
    },
    {
      title: 'Tareas y Estudio',
      description:
        'Espacio de estudio fijo. Tareas divididas en bloques (ej. 20 min) con pausas activas (ej. 5 min).',
    },
    {
      title: 'Juego y Ocio',
      description:
        'Tiempo definido para actividades de su interés, vital para su autoestima.',
    },
    {
      title: 'Noche',
      description:
        'Rutina de cena, baño y sueño consistente. La previsibilidad reduce la resistencia a dormir.',
    },
  ];

  return (
    <div className='relative flex flex-col pl-2 border-l-4 border-chart-1 py-4'>
      {steps.map((step, index) => (
        <div key={index} className='relative'>
          <div
            className='absolute w-8 h-8 bg-chart-1 rounded-full -left-[1.375rem] top-1 flex items-center justify-center text-white font-bold text-sm'
            aria-hidden='true'
          >
            {index + 1}
          </div>
          <h4 className='font-bold text-lg ml-6'>{step.title}</h4>
          <p className='text-muted-foreground ml-6'>{step.description}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Componente para la "Jerarquía del Refuerzo".
 * Renderiza una pirámide invertida utilizando Flexbox para un control preciso del tamaño y la superposición.
 * Los colores se mapean desde la paleta de gráficos del tema.
 */
const PyramidChart: React.FC = () => {
  return (
    <div className='flex flex-col items-center justify-end h-64 space-y-[-1px]'>
      <div className='w-40 bg-accent text-accent-foreground p-3 text-center font-bold shadow-md z-30 flex items-center justify-center'>
        Recompensa Mayor
      </div>
      <div className='w-56 bg-primary text-primary-foreground p-3 text-center font-bold shadow-md z-20 flex items-center justify-center'>
        Gráfico de Progreso
      </div>
      <div className='w-72 bg-chart-5 text-primary-foreground p-3 text-center font-bold shadow-md z-10 flex items-center justify-center'>
        Elogios Específicos (Base Diaria)
      </div>
    </div>
  );
};

/**
 * Componente para el diagrama de Venn de "Colaboración para el Éxito".
 * Usa posicionamiento absoluto y relativo para superponer los círculos y el texto central.
 * Los colores provienen de la paleta del tema.
 */
const VennChart: React.FC = () => {
  return (
    <div className='relative w-full h-64 max-w-md mx-auto flex items-center justify-center'>
      <div
        className='w-40 h-40 bg-chart-1 rounded-full flex items-center justify-center text-center p-4 absolute left-1/2 top-1/2 transform -translate-x-3/4 -translate-y-1/2 text-primary-foreground'
        style={{ opacity: 0.85 }}
      >
        <span className='font-bold text-xl'>Hogar</span>
      </div>
      <div
        className='w-40 h-40 bg-chart-3 rounded-full flex items-center justify-center text-center p-4 absolute left-1/2 top-1/2 transform -translate-x-1/4 -translate-y-1/2 text-foreground'
        style={{ opacity: 0.85 }}
      >
        <span className='font-bold text-xl'>Escuela</span>
      </div>
      <div className='absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 p-4 bg-card/25 rounded-lg shadow-lg border'>
        <span className='font-extrabold text-lg text-primary text-center block'>
          ÉXITO DEL NIÑO
        </span>
      </div>
    </div>
  );
};

// Objeto para exportar todos los gráficos y facilitar su uso
export const ADHDMermaidCharts = {
  TimelineChart,
  PyramidChart,
  VennChart,
};

// Exportaciones individuales para mayor flexibilidad si se necesita importar solo una
export { TimelineChart, PyramidChart, VennChart };
