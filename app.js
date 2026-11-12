import { Transaccion } from './classes/Transaccion.js';

const form = document.getElementById('form-transaccion');
const tablaMovimientos = document.getElementById('tabla-movimientos');
const totalIngresosElem = document.getElementById('total-ingresos');
const totalGastosElem = document.getElementById('total-gastos');
const balanceNetoElem = document.getElementById('balance-neto');
const selectTipo = document.getElementById('tipo');
const selectCategoria = document.getElementById('categoria');
const errorMessageElem = document.getElementById('error');
const fechaInput = document.getElementById('fecha'); 

//fecha actual por defecto en el input de fech a
fechaInput.value = new Date().toISOString().split('T')[0]; 

// Validamos por tipo de categoría 
const categoriasPorTipo = {
    ingreso: ['Sueldo', 'Ventas', 'Extras'],
    gasto: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Otros']
};

// Actualizamos categorías según el tipo que está seleccionado
function actualizarCategorias() {
    const tipoSeleccionado = selectTipo.value;
    const opciones = categoriasPorTipo[tipoSeleccionado] || [];
    
    selectCategoria.innerHTML = '';
    opciones.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

// Cuando cambia el tipo (ingreso/gasto) para actualizar las categorías
selectTipo.addEventListener('change', actualizarCategorias);

// LOCALSTORAGE
function guardarEnLocalStorage() {
    localStorage.setItem('historialTransacciones', JSON.stringify(Transaccion.historial));
}

function cargarDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('historialTransacciones');
    if(datosGuardados){
        const transacciones = JSON.parse(datosGuardados);

        // limpiamos el historial actual para evitar que se dupliquen
        Transaccion.historial = [];

        transacciones.map(t => {
            const nuevaT = new Transaccion(t.tipo, t.descripcion, t.monto, t.categoria, t.fecha);
            nuevaT.id = t.id; // Mantenemos el ID original
            if(t.fecha) {nuevaT.fecha = t.fecha;} // por si no viene con fecha, le guardo la que tenía
            return nuevaT;
        });
    }
}

//GRAFICO POR CATEGORIAS
let chartInstance = null;

function actualizarGraficoCategorias() {
    const ctx = document.getElementById('grafico-categorias').getContext('2d');

    const categoriasGastos = categoriasPorTipo.gasto;
    const totalesPorCategoria = categoriasGastos.map(cat => {
        return Transaccion.historial
            .filter(t => t.tipo === 'gasto' && t.categoria === cat)
            .reduce((sum, t) => sum + t.monto, 0);
    });

    if(chartInstance) {
        chartInstance.destroy(); // destruye el grafico viejo antes de crear uno nuevo
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoriasGastos,
            datasets: [{
                label: 'Gastos por Categoría',
                data: totalesPorCategoria,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                
            }
        }
    }
    });


}

// GRAFICO DE LINEA - EVOLUCION TEMPORAL
let chartEvolucionInstance = null;
function actualizarGraficoEvolucion() {
    const ctx = document.getElementById('grafico-temporal').getContext('2d');
    //se ordena el historial por fechsa 
    const transaccionesOrdenadas = [...Transaccion.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    const fechasUnicas = [...new Set(transaccionesOrdenadas.map(t => t.fecha))];

    let acumuladoIngresos = 0;
    let acumuladoGastos = 0;

    const datosIngresos = [];
    const datosGastos = [];
    const datosBalance = [];


    fechasUnicas.forEach(fecha => {
        // filtro las transacciones del día actual
        const transaccionesDelDia = transaccionesOrdenadas.filter(t => t.fecha === fecha);

        transaccionesDelDia.forEach(t => {
            if(t.tipo === 'ingreso') {
                acumuladoIngresos += t.monto;
            } else {
                acumuladoGastos += t.monto;
            }
        });
        // guardo los acumulados 
        datosIngresos.push(acumuladoIngresos);
        datosGastos.push(acumuladoGastos);
        datosBalance.push(acumuladoIngresos - acumuladoGastos);
    });
    if(chartEvolucionInstance) {
        chartEvolucionInstance.destroy(); // destruye el grafico viejo 
    }

    chartEvolucionInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechasUnicas,
            datasets: [
                {
                    label: 'Ingresos acumulados',
                    data: datosIngresos,
                    borderColor: 'rgba(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Gastos acumulados',
                    data: datosGastos,
                    borderColor: 'rgba(244, 63, 94)',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Balance acumulado',
                    data: datosBalance,
                    borderColor: 'rgba(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Submit del formulario
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Es para que la página no se recargue
    
    // Tomamos los valores
    const descripcion = document.getElementById('descripcion').value.trim();
    const montoStr = document.getElementById('monto').value;
    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;
    const fecha = fechaInput.value; 

    try{
        const nuevaTransaccion = new Transaccion(tipo, descripcion, montoStr, categoria, fecha);
        guardarEnLocalStorage();
        actualizarInterfaz();
        form.reset();
        fechaInput.value = new Date().toISOString().split('T')[0]; 

        if(errorMessageElem) {
            errorMessageElem.textContent = '';
            errorMessageElem.classList.add('hidden'); // Ocultamos el error si todo salio bien
        } 

    } catch(error) {
        if(errorMessageElem) {
            errorMessageElem.textContent = error.message;
            errorMessageElem.classList.remove('hidden'); 
        } else {
            alert(error.message);
        }
    }
});

// Actualizamos la pantalla con los datos del array
function actualizarInterfaz() {
    tablaMovimientos.innerHTML = '';

    // Si el array está vacío, mostramos el mensaje 
    if (Transaccion.historial.length === 0) {
        tablaMovimientos.innerHTML = `
            <tr class="text-slate-400 text-center">
                <td colspan="5" class="py-4">No hay movimientos registrados todavía.</td>
            </tr>
        `;
        totalIngresosElem.textContent = '$0.00';
        totalGastosElem.textContent = '$0.00';
        balanceNetoElem.textContent = '$0.00';
        balanceNetoElem.className = 'text-2xl font-bold text-slate-900';
        return;
    }

    let totalIngresos = 0;
    let totalGastos = 0;

    // Recorre todas las transacciones almacenadas
    Transaccion.historial.forEach((t) => {
        if (t.tipo === 'ingreso') {
            totalIngresos += t.monto;
        } else {
            totalGastos += t.monto;
        }
       
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50';

        const colorMonto = t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600';
        const signoMonto = t.tipo === 'ingreso' ? '+' : '-';

        tr.innerHTML = `
         <td class="py-3 px-3 font-medium text-slate-800">${t.fecha}</td>
            <td class="py-3 px-3 font-medium text-slate-800">${t.descripcion}</td>
            <td class="py-3 px-3 text-slate-600">
                <span class="px-2 py-1 bg-slate-100 rounded-md text-xs">${t.categoria}</span>
            </td>
            <td class="py-3 px-3 font-bold ${colorMonto}">${signoMonto}$${t.monto.toFixed(2)}</td>
            <td class="py-3 px-3 text-center">
                <button onclick="eliminarTransaccion(${t.id})" class="text-slate-400 hover:text-rose-600 transition text-sm font-medium">
                    Eliminar
                </button>
            </td>
        `;

        tablaMovimientos.appendChild(tr);
    });
    
    const balanceNeto = totalIngresos - totalGastos;

    totalIngresosElem.textContent = `$${totalIngresos.toFixed(2)}`;
    totalGastosElem.textContent = `$${totalGastos.toFixed(2)}`;
    balanceNetoElem.textContent = `$${balanceNeto.toFixed(2)}`;
    
    balanceNetoElem.className = `text-2xl font-bold ${balanceNeto >= 0 ? 'text-slate-900' : 'text-rose-600'}`;
    actualizarGraficoCategorias(); // actualizamos 
    actualizarGraficoEvolucion(); // actualizamos el grafico de evolucion temporal
}

// Eliminamos registro de la transacción
window.eliminarTransaccion = function(id) {
    const index = Transaccion.historial.findIndex(t => t.id === id);
    
    if (index !== -1) {
        Transaccion.historial.splice(index, 1);
        guardarEnLocalStorage();
        actualizarInterfaz();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    actualizarCategorias();       
    cargarDesdeLocalStorage();   
    actualizarInterfaz();         
});