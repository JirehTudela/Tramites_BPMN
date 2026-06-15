// Crear solicitud de perfil
const formGraduacion = document.getElementById('formGraduacion')
if (formGraduacion) {
    formGraduacion.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const ci = document.getElementById('graCi').value
        const modalidad = document.getElementById('graModalidad').value
        
        const documentosSeleccionados = {}
        document.querySelectorAll('.doc-check:checked').forEach(cb => {
            documentosSeleccionados[cb.value] = `${cb.value}_${ci}.pdf`
        })
        
        if (Object.keys(documentosSeleccionados).length !== 4) {
            alert('Debe seleccionar los 4 documentos requeridos')
            return
        }
        
        const result = await API.crearGraduacion({
            ci,
            modalidad,
            documentos: documentosSeleccionados
        })
        
        if (result.success) {
            alert(`✅ Solicitud creada. Expediente: ${result.solicitud.expediente}`)
            formGraduacion.reset()
            document.querySelectorAll('.doc-check').forEach(cb => cb.checked = false)
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}

// Registrar evaluación
const btnEval = document.getElementById('btnRegistrarEvaluacion')
if (btnEval) {
    btnEval.addEventListener('click', async () => {
        const expediente = document.getElementById('evalExpediente').value
        const rol = document.getElementById('evalRol').value
        const estado = document.getElementById('evalEstado').value
        const observacion = document.getElementById('evalObservacion').value
        
        if (!expediente) {
            alert('Ingrese el número de expediente')
            return
        }
        
        const result = await API.registrarEvaluacion(expediente, rol, estado, observacion)
        
        if (result.success) {
            alert(`✅ Evaluación de ${rol} registrada como ${estado}`)
            document.getElementById('evalExpediente').value = ''
            document.getElementById('evalObservacion').value = ''
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}

// Subir conclusión
const btnConclusion = document.getElementById('btnSubirConclusion')
if (btnConclusion) {
    btnConclusion.addEventListener('click', async () => {
        const expediente = document.getElementById('conclusionExpediente').value
        const documento = document.getElementById('documentoConclusion').value
        
        if (!expediente || !documento) {
            alert('Ingrese expediente y nombre del documento')
            return
        }
        
        const result = await API.subirConclusion(expediente, documento)
        
        if (result.success) {
            alert('✅ Conclusión subida exitosamente')
            document.getElementById('conclusionExpediente').value = ''
            document.getElementById('documentoConclusion').value = ''
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}

// Emitir resolución
const btnResolucion = document.getElementById('btnEmitirResolucion')
if (btnResolucion) {
    btnResolucion.addEventListener('click', async () => {
        const expediente = document.getElementById('conclusionExpediente').value
        const resolucion = document.getElementById('resolucionNumero').value
        
        if (!expediente || !resolucion) {
            alert('Ingrese expediente y número de resolución')
            return
        }
        
        const result = await API.emitirResolucion(expediente, resolucion)
        
        if (result.success) {
            alert(`✅ Resolución ${resolucion} emitida. Estudiante graduado.`)
            document.getElementById('conclusionExpediente').value = ''
            document.getElementById('resolucionNumero').value = ''
            document.getElementById('documentoConclusion').value = ''
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}