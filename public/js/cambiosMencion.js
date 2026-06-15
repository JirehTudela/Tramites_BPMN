// Cargar menciones al iniciar
async function cargarMenciones() {
    try {
        const data = await API.getMenciones()
        const select = document.getElementById('mencionDestino')
        
        if (select && data.menciones) {
            select.innerHTML = '<option value="">Seleccione una mención...</option>' +
                data.menciones.map(m => `<option value="${m}">${m}</option>`).join('')
            console.log('✅ Menciones cargadas:', data.menciones.length)
        } else {
            console.error('No se encontró el select o las menciones')
        }
    } catch (error) {
        console.error('Error cargando menciones:', error)
    }
}

// Contador de caracteres
const cartaTextarea = document.getElementById('cartaMotivo')
const contador = document.getElementById('contadorCaracteres')

if (cartaTextarea && contador) {
    cartaTextarea.addEventListener('input', () => {
        const len = cartaTextarea.value.length
        contador.textContent = `${len}/50 caracteres mínimos`
        contador.style.color = len >= 50 ? '#4caf50' : '#f44336'
    })
}

// Crear solicitud
const formCambio = document.getElementById('formCambioMencion')
if (formCambio) {
    formCambio.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const ci = document.getElementById('ciEstudiante').value.trim()
        const mencion_destino = document.getElementById('mencionDestino').value
        const carta_motivo = document.getElementById('cartaMotivo').value.trim()
        
        if (!ci) {
            alert('❌ Ingrese el CI del estudiante')
            return
        }
        
        if (!mencion_destino) {
            alert('❌ Seleccione una mención destino')
            return
        }
        
        if (carta_motivo.length < 50) {
            alert(`❌ La carta debe tener al menos 50 caracteres. Actualmente tiene ${carta_motivo.length}`)
            return
        }
        
        const result = await API.crearCambioMencion({ ci, mencion_destino, carta_motivo })
        
        if (result.success) {
            alert(`✅ Solicitud creada con ID: ${result.solicitud.id}\nEstado: ${result.solicitud.estado}`)
            formCambio.reset()
            document.getElementById('cartaMotivo').value = ''
            if (contador) contador.textContent = '0/50 caracteres mínimos'
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}

// Actualizar estado (Kardex)
const btnActualizar = document.getElementById('btnActualizarCambio')
if (btnActualizar) {
    btnActualizar.addEventListener('click', async () => {
        const id = document.getElementById('cambioIdActualizar').value.trim()
        const estado = document.getElementById('cambioAccion').value
        const observacion = document.getElementById('cambioObservacion').value.trim()
        
        if (!id) {
            alert('❌ Ingrese el ID de la solicitud (ej: CM-2026-001)')
            return
        }
        
        const result = await API.actualizarEstadoCambio(id, estado, observacion)
        
        if (result.success) {
            alert(`✅ Solicitud ${estado.toUpperCase()}\n${observacion ? 'Observación: ' + observacion : ''}`)
            document.getElementById('cambioIdActualizar').value = ''
            document.getElementById('cambioObservacion').value = ''
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    })
}

// Ejecutar carga cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarMenciones)
} else {
    cargarMenciones()
}