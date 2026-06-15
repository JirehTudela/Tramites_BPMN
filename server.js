const fastify = require('fastify')({ logger: true })
const path = require('path')
const fs = require('fs').promises

// Configurar archivos estáticos (frontend)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
})

// Helper: leer JSON
async function readJSON(file) {
  const data = await fs.readFile(path.join(__dirname, 'data', file), 'utf8')
  return JSON.parse(data)
}

// Helper: escribir JSON
async function writeJSON(file, data) {
  await fs.writeFile(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2))
}

// ============ ENDPOINTS: ESTUDIANTES ============
fastify.get('/api/estudiantes/:ci', async (request, reply) => {
  const { ci } = request.params
  const data = await readJSON('estudiantes.json')
  const estudiante = data.estudiantes.find(e => e.ci === ci)
  
  if (!estudiante) {
    return reply.code(404).send({ error: 'Estudiante no encontrado' })
  }
  return { success: true, estudiante }
})

// ============ ENDPOINTS: MENCIONES ============
fastify.get('/api/menciones', async (request, reply) => {
  const data = await readJSON('menciones.json')
  return { menciones: data.menciones }
})

// ============ ENDPOINTS: CAMBIO DE MENCIÓN ============

// Crear solicitud de cambio de mención
fastify.post('/api/cambios-mencion', async (request, reply) => {
  const { ci, mencion_destino, carta_motivo } = request.body
  
  // Validar campos requeridos
  if (!ci || !mencion_destino || !carta_motivo) {
    return reply.code(400).send({ error: 'Faltan campos: ci, mencion_destino, carta_motivo' })
  }
  
  // Validar longitud de carta (≥ 50 caracteres)
  if (carta_motivo.length < 50) {
    return reply.code(400).send({ error: 'La carta debe tener al menos 50 caracteres' })
  }
  
  // Validar existencia del estudiante
  const estudiantesData = await readJSON('estudiantes.json')
  const estudiante = estudiantesData.estudiantes.find(e => e.ci === ci)
  
  if (!estudiante) {
    return reply.code(404).send({ error: 'Estudiante no encontrado' })
  }
  
  // Validar que mención destino sea diferente a actual
  if (estudiante.mencion_actual === mencion_destino) {
    return reply.code(400).send({ error: 'La mención destino debe ser diferente a la actual' })
  }
  
  // Validar que mención destino exista en la lista
  const mencionesData = await readJSON('menciones.json')
  if (!mencionesData.menciones.includes(mencion_destino)) {
    return reply.code(400).send({ error: 'Mención destino no válida' })
  }
  
  // Generar ID único
  const cambiosData = await readJSON('cambios_mencion.json')
  const id = `CM-${new Date().getFullYear()}-${String(cambiosData.solicitudes.length + 1).padStart(3, '0')}`
  
  // Crear solicitud
  const nuevaSolicitud = {
    id,
    fecha_solicitud: new Date().toISOString(),
    estudiante_ci: ci,
    matricula: estudiante.matricula,
    nombre: estudiante.nombre,
    mencion_origen: estudiante.mencion_actual,
    mencion_destino,
    carta_motivo,
    estado: 'pendiente_kardex',
    historial: [
      {
        fecha: new Date().toISOString(),
        estado: 'solicitado',
        observacion: 'Solicitud creada por estudiante'
      }
    ],
    respuesta_kardex: null
  }
  
  cambiosData.solicitudes.push(nuevaSolicitud)
  await writeJSON('cambios_mencion.json', cambiosData)
  
  return reply.code(201).send({ success: true, solicitud: nuevaSolicitud })
})

// Listar todas las solicitudes de cambio de mención
fastify.get('/api/cambios-mencion', async (request, reply) => {
  const data = await readJSON('cambios_mencion.json')
  return { solicitudes: data.solicitudes }
})

// Obtener solicitud por ID
fastify.get('/api/cambios-mencion/:id', async (request, reply) => {
  const { id } = request.params
  const data = await readJSON('cambios_mencion.json')
  const solicitud = data.solicitudes.find(s => s.id === id)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  return { solicitud }
})

// Obtener solicitudes por CI de estudiante
fastify.get('/api/cambios-mencion/estudiante/:ci', async (request, reply) => {
  const { ci } = request.params
  const data = await readJSON('cambios_mencion.json')
  const solicitudes = data.solicitudes.filter(s => s.estudiante_ci === ci)
  return { solicitudes }
})

// Actualizar estado (Kardex)
fastify.put('/api/cambios-mencion/:id/estado', async (request, reply) => {
  const { id } = request.params
  const { estado, observacion } = request.body
  
  if (!estado || (estado !== 'aprobado' && estado !== 'rechazado')) {
    return reply.code(400).send({ error: 'Estado debe ser "aprobado" o "rechazado"' })
  }
  
  const data = await readJSON('cambios_mencion.json')
  const solicitud = data.solicitudes.find(s => s.id === id)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  
  solicitud.estado = estado === 'aprobado' ? 'aprobado' : 'rechazado'
  solicitud.respuesta_kardex = {
    fecha: new Date().toISOString(),
    estado,
    observacion: observacion || null
  }
  solicitud.historial.push({
    fecha: new Date().toISOString(),
    estado: solicitud.estado,
    observacion: observacion || `Solicitud ${estado} por Kardex`
  })
  
  // Si es aprobado, actualizar la mención del estudiante
  if (estado === 'aprobado') {
    const estudiantesData = await readJSON('estudiantes.json')
    const estudiante = estudiantesData.estudiantes.find(e => e.ci === solicitud.estudiante_ci)
    if (estudiante) {
      estudiante.mencion_actual = solicitud.mencion_destino
      await writeJSON('estudiantes.json', estudiantesData)
    }
  }
  
  await writeJSON('cambios_mencion.json', data)
  return { success: true, solicitud }
})

// ============ ENDPOINTS: GRADUACIÓN ============

// Crear solicitud de graduación (perfil - 9no semestre)
fastify.post('/api/graduaciones', async (request, reply) => {
  const { ci, modalidad, documentos } = request.body
  
  if (!ci || !modalidad || !documentos) {
    return reply.code(400).send({ error: 'Faltan campos: ci, modalidad, documentos' })
  }
  
  // Validar modalidad
  const modalidadesValidas = ['tesis', 'proyecto', 'excelencia']
  if (!modalidadesValidas.includes(modalidad)) {
    return reply.code(400).send({ error: 'Modalidad no válida' })
  }
  
  // Validar existencia del estudiante
  const estudiantesData = await readJSON('estudiantes.json')
  const estudiante = estudiantesData.estudiantes.find(e => e.ci === ci)
  
  if (!estudiante) {
    return reply.code(404).send({ error: 'Estudiante no encontrado' })
  }
  
  // Validar que esté en 9no semestre
  if (estudiante.semestre !== 9) {
    return reply.code(400).send({ error: 'Solo estudiantes de 9no semestre pueden iniciar el trámite de graduación' })
  }
  
  // Generar número de expediente
  const graduacionesData = await readJSON('graduaciones.json')
  const expediente = `GR-${new Date().getFullYear()}-${String(graduacionesData.solicitudes.length + 1).padStart(3, '0')}`
  
  const nuevaSolicitud = {
    expediente,
    fecha_inicio: new Date().toISOString(),
    estudiante_ci: ci,
    matricula: estudiante.matricula,
    nombre: estudiante.nombre,
    mencion: estudiante.mencion_actual,
    modalidad,
    semestre: 9,
    estado: 'perfil_en_revision',
    documentos_perfil: {
      perfil_pdf: documentos.perfil_pdf || null,
      aval_docente: documentos.aval_docente || null,
      aval_tutor: documentos.aval_tutor || null,
      originalidad: documentos.originalidad || null
    },
    evaluaciones: {
      docente: { estado: 'pendiente', observacion: null, fecha: null },
      tutor: { estado: 'pendiente', observacion: null, fecha: null },
      biblioteca: { estado: 'pendiente', observacion: null, fecha: null }
    },
    documento_conclusion: null,
    resolucion: null,
    fecha_graduacion: null,
    historial: [
      {
        fecha: new Date().toISOString(),
        estado: 'perfil_en_revision',
        observacion: 'Solicitud de perfil creada'
      }
    ]
  }
  
  graduacionesData.solicitudes.push(nuevaSolicitud)
  await writeJSON('graduaciones.json', graduacionesData)
  
  return reply.code(201).send({ success: true, solicitud: nuevaSolicitud })
})

// Listar todas las solicitudes de graduación
fastify.get('/api/graduaciones', async (request, reply) => {
  const data = await readJSON('graduaciones.json')
  return { solicitudes: data.solicitudes }
})

// Obtener solicitud por expediente
fastify.get('/api/graduaciones/:expediente', async (request, reply) => {
  const { expediente } = request.params
  const data = await readJSON('graduaciones.json')
  const solicitud = data.solicitudes.find(s => s.expediente === expediente)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  return { solicitud }
})

// Obtener solicitudes por CI
fastify.get('/api/graduaciones/estudiante/:ci', async (request, reply) => {
  const { ci } = request.params
  const data = await readJSON('graduaciones.json')
  const solicitudes = data.solicitudes.filter(s => s.estudiante_ci === ci)
  return { solicitudes }
})

// Registrar evaluación (docente, tutor o biblioteca)
fastify.put('/api/graduaciones/:expediente/evaluacion', async (request, reply) => {
  const { expediente } = request.params
  const { rol, estado, observacion } = request.body
  
  const rolesValidos = ['docente', 'tutor', 'biblioteca']
  if (!rolesValidos.includes(rol)) {
    return reply.code(400).send({ error: 'Rol debe ser: docente, tutor o biblioteca' })
  }
  
  if (!estado || (estado !== 'aprobado' && estado !== 'rechazado')) {
    return reply.code(400).send({ error: 'Estado debe ser "aprobado" o "rechazado"' })
  }
  
  const data = await readJSON('graduaciones.json')
  const solicitud = data.solicitudes.find(s => s.expediente === expediente)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  
  // Actualizar evaluación
  solicitud.evaluaciones[rol] = {
    estado,
    observacion: observacion || null,
    fecha: new Date().toISOString()
  }
  
  solicitud.historial.push({
    fecha: new Date().toISOString(),
    estado: `evaluacion_${rol}`,
    observacion: `${rol}: ${estado}${observacion ? ' - ' + observacion : ''}`
  })
  
  // Verificar si todas las evaluaciones están aprobadas
  const todasAprobadas = 
    solicitud.evaluaciones.docente.estado === 'aprobado' &&
    solicitud.evaluaciones.tutor.estado === 'aprobado' &&
    solicitud.evaluaciones.biblioteca.estado === 'aprobado'
  
  if (todasAprobadas && solicitud.estado === 'perfil_en_revision') {
    solicitud.estado = 'perfil_aprobado'
    solicitud.historial.push({
      fecha: new Date().toISOString(),
      estado: 'perfil_aprobado',
      observacion: 'Todas las evaluaciones aprobadas'
    })
  }
  
  // Si alguien rechaza, cambiar estado
  const algunRechazo = 
    solicitud.evaluaciones.docente.estado === 'rechazado' ||
    solicitud.evaluaciones.tutor.estado === 'rechazado' ||
    solicitud.evaluaciones.biblioteca.estado === 'rechazado'
  
  if (algunRechazo && solicitud.estado !== 'rechazado') {
    solicitud.estado = 'rechazado'
    solicitud.historial.push({
      fecha: new Date().toISOString(),
      estado: 'rechazado',
      observacion: 'Una o más evaluaciones rechazaron la solicitud'
    })
  }
  
  await writeJSON('graduaciones.json', data)
  return { success: true, solicitud }
})

// Subir documento de conclusión (10mo semestre)
fastify.put('/api/graduaciones/:expediente/conclusion', async (request, reply) => {
  const { expediente } = request.params
  const { documento_conclusion } = request.body
  
  if (!documento_conclusion) {
    return reply.code(400).send({ error: 'Se requiere documento_conclusion' })
  }
  
  const data = await readJSON('graduaciones.json')
  const solicitud = data.solicitudes.find(s => s.expediente === expediente)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  
  if (solicitud.estado !== 'perfil_aprobado') {
    return reply.code(400).send({ error: 'El perfil debe estar aprobado antes de subir la conclusión' })
  }
  
  solicitud.documento_conclusion = documento_conclusion
  solicitud.estado = 'conclusion_en_revision'
  solicitud.historial.push({
    fecha: new Date().toISOString(),
    estado: 'conclusion_en_revision',
    observacion: 'Documento de conclusión subido'
  })
  
  await writeJSON('graduaciones.json', data)
  return { success: true, solicitud }
})

// Emitir resolución final
fastify.put('/api/graduaciones/:expediente/resolucion', async (request, reply) => {
  const { expediente } = request.params
  const { resolucion } = request.body
  
  if (!resolucion) {
    return reply.code(400).send({ error: 'Se requiere resolución' })
  }
  
  const data = await readJSON('graduaciones.json')
  const solicitud = data.solicitudes.find(s => s.expediente === expediente)
  
  if (!solicitud) {
    return reply.code(404).send({ error: 'Solicitud no encontrada' })
  }
  
  if (solicitud.estado !== 'conclusion_en_revision') {
    return reply.code(400).send({ error: 'Debe haber una conclusión en revisión para emitir resolución' })
  }
  
  solicitud.resolucion = resolucion
  solicitud.estado = 'graduado'
  solicitud.fecha_graduacion = new Date().toISOString()
  solicitud.historial.push({
    fecha: new Date().toISOString(),
    estado: 'graduado',
    observacion: `Resolución emitida: ${resolucion}`
  })
  
  await writeJSON('graduaciones.json', data)
  return { success: true, solicitud }
})

// Iniciar servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' })
    console.log(`🚀 Servidor corriendo en el puerto ${port}`)
    console.log('📁 Datos guardados en archivos JSON reales')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()