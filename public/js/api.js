const API = {
    // Estudiantes
    async getEstudiante(ci) {
        const res = await fetch(`/api/estudiantes/${ci}`)
        if (!res.ok) return null
        return res.json()
    },
    
    // Menciones
    async getMenciones() {
        const res = await fetch('/api/menciones')
        return res.json()
    },
    
    // Cambio de Mención
    async crearCambioMencion(data) {
        const res = await fetch('/api/cambios-mencion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return res.json()
    },
    
    async listarCambiosMencion() {
        const res = await fetch('/api/cambios-mencion')
        return res.json()
    },
    
    async buscarCambioPorId(id) {
        const res = await fetch(`/api/cambios-mencion/${id}`)
        if (!res.ok) return null
        return res.json()
    },
    
    async buscarCambiosPorCi(ci) {
        const res = await fetch(`/api/cambios-mencion/estudiante/${ci}`)
        return res.json()
    },
    
    async actualizarEstadoCambio(id, estado, observacion) {
        const res = await fetch(`/api/cambios-mencion/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado, observacion })
        })
        return res.json()
    },
    
    // Graduación
    async crearGraduacion(data) {
        const res = await fetch('/api/graduaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return res.json()
    },
    
    async listarGraduaciones() {
        const res = await fetch('/api/graduaciones')
        return res.json()
    },
    
    async buscarGraduacionPorExpediente(expediente) {
        const res = await fetch(`/api/graduaciones/${expediente}`)
        if (!res.ok) return null
        return res.json()
    },
    
    async buscarGraduacionesPorCi(ci) {
        const res = await fetch(`/api/graduaciones/estudiante/${ci}`)
        return res.json()
    },
    
    async registrarEvaluacion(expediente, rol, estado, observacion) {
        const res = await fetch(`/api/graduaciones/${expediente}/evaluacion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol, estado, observacion })
        })
        return res.json()
    },
    
    async subirConclusion(expediente, documento_conclusion) {
        const res = await fetch(`/api/graduaciones/${expediente}/conclusion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento_conclusion })
        })
        return res.json()
    },
    
    async emitirResolucion(expediente, resolucion) {
        const res = await fetch(`/api/graduaciones/${expediente}/resolucion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolucion })
        })
        return res.json()
    }
}