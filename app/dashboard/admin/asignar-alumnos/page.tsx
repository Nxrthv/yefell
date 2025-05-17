"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowLeft, Loader2 } from "lucide-react"
import { getGrupos, getAlumnosGrupo, getAlumnosDisponibles, asignarAlumnoGrupo, removerAlumnoGrupo } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import type { Grupo, Usuario, GrupoAlumno } from "@/lib/supabase"

export default function AsignarAlumnosPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const grupoId = searchParams.get("grupo")

  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [alumnosAsignados, setAlumnosAsignados] = useState<GrupoAlumno[]>([])
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Usuario[]>([])
  const [searchTermAsignados, setSearchTermAsignados] = useState("")
  const [searchTermDisponibles, setSearchTermDisponibles] = useState("")
  const [selectedAlumnosToRemove, setSelectedAlumnosToRemove] = useState<string[]>([])
  const [selectedAlumnosToAdd, setSelectedAlumnosToAdd] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAsignados, setLoadingAsignados] = useState(false)
  const [loadingDisponibles, setLoadingDisponibles] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Cargar grupo y alumnos asignados
  useEffect(() => {
    const fetchGrupoYAlumnos = async () => {
      if (!grupoId) return

      try {
        setLoading(true)

        // Obtener información del grupo
        const grupos = await getGrupos({ busqueda: "" })
        const grupoEncontrado = grupos.find((g) => g.id === grupoId)

        if (!grupoEncontrado) {
          toast({
            title: "Error",
            description: "Grupo no encontrado",
            variant: "destructive",
          })
          return
        }

        setGrupo(grupoEncontrado)

        // Obtener alumnos asignados al grupo
        const alumnosData = await getAlumnosGrupo(grupoId)
        setAlumnosAsignados(alumnosData)

        // Obtener alumnos disponibles
        const disponiblesData = await getAlumnosDisponibles(
          grupoEncontrado.grado_id,
          grupoEncontrado.seccion_id
        )

        // Filtrar alumnos que ya están asignados
        const alumnosAsignadosIds = alumnosData.map((a) => a.alumno_id)
        const alumnosDisponiblesFiltrados = disponiblesData.filter((a) => !alumnosAsignadosIds.includes(a.id))

        setAlumnosDisponibles(alumnosDisponiblesFiltrados)
      } catch (error) {
        console.error("Error al cargar grupo y alumnos:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del grupo y alumnos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGrupoYAlumnos()
  }, [grupoId, toast])

  // Filtrar alumnos asignados
  const filteredAlumnosAsignados = alumnosAsignados.filter((alumno) => {
    if (!alumno.alumno) return false

    const nombreCompleto = `${alumno.alumno.nombre} ${alumno.alumno.apellidos}`.toLowerCase()
    const dni = alumno.alumno.dni?.toLowerCase() || ""
    const email = alumno.alumno.email.toLowerCase()

    return (
      nombreCompleto.includes(searchTermAsignados.toLowerCase()) ||
      dni.includes(searchTermAsignados.toLowerCase()) ||
      email.includes(searchTermAsignados.toLowerCase())
    )
  })

  // Filtrar alumnos disponibles
  const filteredAlumnosDisponibles = alumnosDisponibles.filter((alumno) => {
    const nombreCompleto = `${alumno.nombre} ${alumno.apellidos}`.toLowerCase()
    const dni = alumno.dni?.toLowerCase() || ""
    const email = alumno.email.toLowerCase()

    return (
      nombreCompleto.includes(searchTermDisponibles.toLowerCase()) ||
      dni.includes(searchTermDisponibles.toLowerCase()) ||
      email.includes(searchTermDisponibles.toLowerCase())
    )
  })

  // Manejar selección de alumnos para remover
  const handleToggleSelectToRemove = (alumnoId: string) => {
    setSelectedAlumnosToRemove((prev) =>
      prev.includes(alumnoId) ? prev.filter((id) => id !== alumnoId) : [...prev, alumnoId],
    )
  }

  // Manejar selección de alumnos para agregar
  const handleToggleSelectToAdd = (alumnoId: string) => {
    setSelectedAlumnosToAdd((prev) =>
      prev.includes(alumnoId) ? prev.filter((id) => id !== alumnoId) : [...prev, alumnoId],
    )
  }

  // Manejar remover alumnos seleccionados
  const handleRemoveSelectedAlumnos = async () => {
    if (!grupoId || selectedAlumnosToRemove.length === 0) return

    try {
      setSubmitting(true)

      // Remover cada alumno seleccionado
      await Promise.all(selectedAlumnosToRemove.map((alumnoId) => removerAlumnoGrupo(grupoId, alumnoId)))

      // Actualizar la lista de alumnos asignados
      const updatedAlumnosAsignados = alumnosAsignados.filter(
        (alumno) => !selectedAlumnosToRemove.includes(alumno.alumno_id),
      )
      setAlumnosAsignados(updatedAlumnosAsignados)

      // Actualizar la lista de alumnos disponibles
      const alumnosRemovidosData = alumnosAsignados
        .filter((alumno) => selectedAlumnosToRemove.includes(alumno.alumno_id))
        .map((alumno) => alumno.alumno)
        .filter(Boolean) as Usuario[]

      setAlumnosDisponibles([...alumnosDisponibles, ...alumnosRemovidosData])

      // Limpiar selección
      setSelectedAlumnosToRemove([])

      toast({
        title: "Alumnos removidos",
        description: `Se han removido ${selectedAlumnosToRemove.length} alumnos del grupo`,
      })
    } catch (error) {
      console.error("Error al remover alumnos:", error)
      toast({
        title: "Error",
        description: "No se pudieron remover algunos alumnos",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Manejar agregar alumnos seleccionados
  const handleAddSelectedAlumnos = async () => {
    if (!grupoId || selectedAlumnosToAdd.length === 0) return

    try {
      setSubmitting(true)

      // Agregar cada alumno seleccionado
      await Promise.all(selectedAlumnosToAdd.map((alumnoId) => asignarAlumnoGrupo(grupoId, alumnoId)))

      // Obtener alumnos asignados actualizados
      const updatedAlumnosAsignados = await getAlumnosGrupo(grupoId)
      setAlumnosAsignados(updatedAlumnosAsignados)

      // Actualizar la lista de alumnos disponibles
      const updatedAlumnosDisponibles = alumnosDisponibles.filter((alumno) => !selectedAlumnosToAdd.includes(alumno.id))
      setAlumnosDisponibles(updatedAlumnosDisponibles)

      // Limpiar selección
      setSelectedAlumnosToAdd([])

      toast({
        title: "Alumnos asignados",
        description: `Se han asignado ${selectedAlumnosToAdd.length} alumnos al grupo`,
      })
    } catch (error) {
      console.error("Error al asignar alumnos:", error)
      toast({
        title: "Error",
        description: "No se pudieron asignar algunos alumnos",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }

    // Limpiar la búsqueda para mostrar los resultados actualizados
    setSearchTermDisponibles("")
    setSearchTermAsignados("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Cargando información del grupo...</span>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/admin/grupos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Grupos
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Grupo no encontrado</CardTitle>
            <CardDescription>El grupo especificado no existe o no tienes permisos para acceder a él.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard/admin/grupos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Grupos
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asignar Alumnos - {grupo.nombre}</CardTitle>
          <CardDescription>
            Gestiona los alumnos asignados al grupo {grupo.nombre}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="asignados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="asignados">Alumnos Asignados</TabsTrigger>
          <TabsTrigger value="disponibles">Alumnos Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="asignados" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alumnos asignados..."
              value={searchTermAsignados}
              onChange={(e) => setSearchTermAsignados(e.target.value)}
              className="h-8"
            />
          </div>
        </TabsContent>

        <TabsContent value="disponibles" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alumnos disponibles..."
              value={searchTermDisponibles}
              onChange={(e) => setSearchTermDisponibles(e.target.value)}
              className="h-8"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
