export class Transaccion {
    // creamos el array para almacenar todas las transacciones
    static historial = [];

    constructor(tipo, descripcion, monto, categoria) {
        // validaciones
        if(!['ingreso', 'gasto'].includes(tipo)) {
            throw new Error("Tipo de transacción inválido. Debe ser 'ingreso' o 'gasto'.");
        }

        if(!descripcion || descripcion.trim() === '') {
            throw new Error("La descripción no puede estar vacía.");
        }

        const montoNum = parseFloat(monto);
        if(isNaN(montoNum) || montoNum <= 0) {
            throw new Error("El monto debe ser un número mayor a 0.");
        }

        if(!categoria || categoria.trim() === '') {
            throw new Error("Debe seleccionar una categoría válida.");
        }

        this.id = Date.now(); // Un identificador único basado en la hora actual
        this.tipo = tipo; // 'ingreso' o 'gasto'
        this.descripcion = descripcion; // Texto ingresado por el usuario
        this.monto = parseFloat(monto); 
        this.categoria = categoria; // Categoría seleccionada

        // guardamos la transacción en el historial
        Transaccion.historial.push(this);
        console.log(`Transacción creada:${this.id}, ${this.descripcion}, Monto: ${this.monto}, Tipo: ${this.tipo}, Categoría: ${this.categoria}`);
    }
}