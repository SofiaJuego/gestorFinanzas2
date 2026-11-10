import { Transaccion } from './classes/Transaccion.js';

const form = document.getElementById('form-transaccion');
const tablaMovimientos = document.getElementById('tabla-movimientos');
const totalIngresosElem = document.getElementById('total-ingresos');
const totalGastosElem = document.getElementById('total-gastos');
const balanceNetoElem = document.getElementById('balance-neto');
const selectTipo = document.getElementById('tipo');
const selectCategoria = document.getElementById('categoria');
const errorMessageElem = document.getElementById('error'); // <- ¡Agregado! Asegúrate de tener un elemento con id="error" en tu HTML si lo usas

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

// Cuando cambia el tipo (Ingreso/Gasto) para actualizar las categorías
selectTipo.addEventListener('change', actualizarCategorias);

// LOCALSTORAGE
function guardarEnLocalStorage() {
    localStorage.setItem('historialTransacciones', JSON.stringify(Transaccion.historial));
}

function cargarDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('historialTransacciones');
    if(datosGuardados){
        const transacciones = JSON.parse(datosGuardados);

        // Limpiamos el historial actual antes de mapear para evitar que se dupliquen al recargar
        Transaccion.historial = [];

        transacciones.map(t => {
            const nuevaT = new Transaccion(t.tipo, t.descripcion, t.monto, t.categoria);
            nuevaT.id = t.id; // Mantenemos el ID original
            return nuevaT;
        });
    }
}

// Submit del formulario
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Es para que la página no se recargue
    
    // Tomamos los valores
    const descripcion = document.getElementById('descripcion').value.trim();
    const montoStr = document.getElementById('monto').value;
    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;

    try{
        const nuevaTransaccion = new Transaccion(tipo, descripcion, montoStr, categoria);
        guardarEnLocalStorage();
        actualizarInterfaz();
        form.reset();
        actualizarCategorias();

        if(errorMessageElem) {
            errorMessageElem.textContent = '';
            errorMessageElem.classList.add('hidden'); // Ocultamos el error si todo salió bien
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
                <td colspan="4" class="py-4">No hay movimientos registrados todavía.</td>
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
    actualizarCategorias();        // Carga inicial de categorías
    cargarDesdeLocalStorage();     // Carga los datos guardados en localStorage
    actualizarInterfaz();          // Pinta la tabla y calcula los balances
});