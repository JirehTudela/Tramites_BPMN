// Tabs
const tabs = document.querySelectorAll('.tab-btn')
const contents = document.querySelectorAll('.tab-content')

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab
        
        tabs.forEach(t => t.classList.remove('active'))
        contents.forEach(c => c.classList.remove('active'))
        
        tab.classList.add('active')
        document.getElementById(tabId).classList.add('active')
    })
})

// Consultas
const btnBuscar = document.getElementById('btnBuscar')
const resultadosDiv = document.getElementById('resultadosJson')

async function buscar() {
    const ci = document.getElementById('buscarCi').value
    const id = document.getElementById('buscarId').value
    let resultados = []
    
    if (ci) {
        const cambios = await API.buscarCambiosPorCi(ci)
        const graduaciones = await API.buscarGraduacionesPorCi(ci)
        resultados = { estudiante_ci: ci, cambios: cambios.solicitudes || [], graduaciones: graduaciones.solicitudes || [] }
    } else if (id) {
        if (id.startsWith('CM-')) {
            const resultado = await API.buscarCambioPorId(id)
            resultados = resultado ? resultado.solicitud : { error: 'No encontrado' }
        } else if (id.startsWith('GR-')) {
            const resultado = await API.buscarGraduacionPorExpediente(id)
            resultados = resultado ? resultado.solicitud : { error: 'No encontrado' }
        } else {
            resultados = { error: 'ID inválido. Use CM-XXX o GR-XXX' }
        }
    } else {
        // Si no hay filtro, mostrar todas
        const cambios = await API.listarCambiosMencion()
        const graduaciones = await API.listarGraduaciones()
        resultados = { cambios: cambios.solicitudes, graduaciones: graduaciones.solicitudes }
    }
    
    resultadosDiv.textContent = JSON.stringify(resultados, null, 2)
}

if (btnBuscar) {
    btnBuscar.addEventListener('click', buscar)
}

// Cargar menciones al iniciar
cargarMenciones()