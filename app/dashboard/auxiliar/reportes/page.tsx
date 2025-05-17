"use client"

import { useState } from "react"
import { subDays } from "date-fns"

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("semana")
  const [nivelSeleccionado, setNivelSeleccionado] = useState("todos")

  // Datos de ejemplo para los gráficos
  const datosAsistenciaSemanal = {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    alumnos: {
      presentes: [95, 92, 94, 90, 93],
      tardanzas: [3, 5, 4, 7, 5],
      ausentes: [2, 3, 2, 3, 2],
    },
    profesores: {
      presentes: [98, 97, 100, 96, 98],
      tardanzas: [2, 3, 0, 4, 2],
      ausentes: [0, 0, 0, 0, 0],
    },
  }

  // Función para renderizar un gráfico de barras simple
  const renderBarChart = (data, labels, title, colors) => {
    const maxValue = Math.max(...data.flat()) || 100
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="h-[200px] flex items-end justify-between gap-2">
          {data.map((series, seriesIndex) => (
            <div key={seriesIndex} className="flex-1 flex items-end justify-around">
              {series.map((value, i) => (
                <div key={i} className="relative flex flex-col items-center w-full">
                  <div
                    className={`w-full max-w-[30px] rounded-t-md ${colors[i]}`}
                    style={{ height: `${(value / maxValue) * 180}px` }}
                  ></div>
                  <span className="text-xs mt-1">{labels[i]}</span>
                  <span className="absolute top-0 -translate-y-5 text-xs font-bold">{value}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Función para renderizar un gráfico circular simple
  const renderPieChart = (data, labels, colors) => {
    const total = data.reduce((acc, val) => acc + val, 0)
    const startAngle = 0
    
    return (
      <div className="flex justify-center">
        <div className="relative w-[200px] h-[200px]">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((value, i) => {
              const angle = (value / total) * 360
              const largeArcFlag = angle > 180 ? 1 : 0
              
              // Convertir ángulos a radianes para calcular puntos en el círculo
              const endAngle = startAngle + angle
              const startX = 50 + 50 * Math.cos((startAngle * Math.PI) / 180)
              const startY = 50 + 50 * Math.sin((startAngle * Math.PI) / 180)
              const endX = 50 + 50 * Math.cos((endAngle * Math.PI) / 180)
              const endY = 50 + 50 * Math.sin((endAngle * Math.PI) / 180)

              const pathData = `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`

              return (
                <path
                  key={i}
                  d={pathData}
                  fill={colors[i]}
                  stroke="white"
                  strokeWidth="0.5"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}%</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes de Asistencia</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Asistencia de Alumnos */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asistencia de Alumnos</h2>
          {renderBarChart(
            [datosAsistenciaSemanal.alumnos.presentes],
            datosAsistenciaSemanal.labels,
            "Presentes",
            ["bg-green-500"]
          )}
        </div>

        {/* Gráfico de Asistencia de Profesores */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asistencia de Profesores</h2>
          {renderBarChart(
            [datosAsistenciaSemanal.profesores.presentes],
            datosAsistenciaSemanal.labels,
            "Presentes",
            ["bg-blue-500"]
          )}
        </div>
      </div>
    </div>
  )
}
