(function (window) {
  window.onload = () => {
    var ingredientes;
    fetch("./ingredientes.json")
      .then((response) => response.json())
      .then((obj) => {
        ingredientes = obj;
      })
      .then(() => {
        var calculoCostos = new CalculoCostos(ingredientes);
        calculoCostos.ingrL1.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL2.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL3.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL4.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL5.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL6.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL7.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL8.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.ingrL9.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, true)
        );
        calculoCostos.pesoHelado.addEventListener(
          "change",
          calculoCostos.validarPesoYMezcla.bind(calculoCostos)
        );
        calculoCostos.pesoHelado.addEventListener(
          "change",
          calculoCostos.calcularCostosReceta.bind(calculoCostos)
        );
        calculoCostos.cantidadMezcla.addEventListener(
          "change",
          calculoCostos.validarPesoYMezcla.bind(calculoCostos)
        );
        calculoCostos.cantidadMezcla.addEventListener(
          "change",
          calculoCostos.calcularCostosReceta.bind(calculoCostos)
        );
        calculoCostos.percentGlobalL1.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperacionesGlobales(e)
        );
        calculoCostos.percentGlobalL1.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentGlobalL1.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentGlobalL4.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperacionesGlobales(e)
        );
        calculoCostos.percentGlobalL4.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentGlobalL4.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentGlobalL6.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperacionesGlobales(e)
        );
        calculoCostos.percentGlobalL6.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentGlobalL6.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentGlobalL7.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperacionesGlobales(e)
        );
        calculoCostos.percentGlobalL7.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentGlobalL7.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentGlobalL8.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperacionesGlobales(e)
        );
        calculoCostos.percentGlobalL8.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentGlobalL8.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL1.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL1.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL1.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL2.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL2.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL2.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL3.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL3.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL3.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL4.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL4.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL4.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL5.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL5.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL5.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL6.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL6.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL6.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL7.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL7.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL7.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL8.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL8.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL8.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
        calculoCostos.percentIngL9.addEventListener("change", (e) =>
          calculoCostos.ejecutarOperaciones(e, false)
        );
        calculoCostos.percentIngL9.addEventListener(
          "keypress",
          calculoCostos.esDecimal
        );
        calculoCostos.percentIngL9.addEventListener(
          "paste",
          calculoCostos.evitarPegar
        );
      });
  };

  class CostoHelados {
    constructor(ingredientes) {
      this.ingrL1 = document.getElementById("ingredientesL1");
      this.ingrL2 = document.getElementById("ingredientesL2");
      this.ingrL3 = document.getElementById("ingredientesL3");
      this.ingrL4 = document.getElementById("ingredientesL4");
      this.ingrL5 = document.getElementById("ingredientesL5");
      this.ingrL6 = document.getElementById("ingredientesL6");
      this.ingrL7 = document.getElementById("ingredientesL7");
      this.ingrL8 = document.getElementById("ingredientesL8");
      this.ingrL9 = document.getElementById("ingredientesL9");
      this.percentGlobalL1 = document.getElementById("porcentajeGlobalL1");
      this.percentGlobalL4 = document.getElementById("porcentajeGlobalL4");
      this.percentGlobalL6 = document.getElementById("porcentajeGlobalL6");
      this.percentGlobalL7 = document.getElementById("porcentajeGlobalL7");
      this.percentGlobalL8 = document.getElementById("porcentajeGlobalL8");
      this.percentIngL1 = document.getElementById("porcentajeIngredienteL1");
      this.percentIngL2 = document.getElementById("porcentajeIngredienteL2");
      this.percentIngL3 = document.getElementById("porcentajeIngredienteL3");
      this.percentIngL4 = document.getElementById("porcentajeIngredienteL4");
      this.percentIngL5 = document.getElementById("porcentajeIngredienteL5");
      this.percentIngL6 = document.getElementById("porcentajeIngredienteL6");
      this.percentIngL7 = document.getElementById("porcentajeIngredienteL7");
      this.percentIngL8 = document.getElementById("porcentajeIngredienteL8");
      this.percentIngL9 = document.getElementById("porcentajeIngredienteL9");
      this.pesoHelado = document.getElementById("peso");
      this.cantidadMezcla = document.getElementById("cantidadMezcla");
      this.agregarElementosDOM(
        ingredientes,
        this.ingrL1,
        this.ingrL2,
        this.ingrL3,
        this.ingrL4,
        this.ingrL5,
        this.ingrL6,
        this.ingrL7,
        this.ingrL8,
        this.ingrL9
      );
      this.habilitarElementosDOM(
        false,
        this.ingrL1,
        this.ingrL2,
        this.ingrL3,
        this.ingrL4,
        this.ingrL5,
        this.ingrL6,
        this.ingrL7,
        this.ingrL8,
        this.ingrL9,
        this.percentGlobalL1,
        this.percentGlobalL4,
        this.percentGlobalL6,
        this.percentGlobalL7,
        this.percentGlobalL8,
        this.percentIngL1,
        this.percentIngL2,
        this.percentIngL3,
        this.percentIngL4,
        this.percentIngL5,
        this.percentIngL6,
        this.percentIngL7,
        this.percentIngL8,
        this.percentIngL9
      );
    }
    agregarElementosDOM(ingredientes, ...parametros) {
      parametros.forEach((element) => {
        const opcionSeleccionar = document.createElement("option");
        opcionSeleccionar.value = "";
        opcionSeleccionar.text = "Seleccionar";
        element.add(opcionSeleccionar);
        ingredientes.forEach((ingrediente) => {
          const opcion = document.createElement("option");
          opcion.value = ingrediente.Valor;
          opcion.text = ingrediente.Descripcion;
          element.add(opcion);
        });
      });
    }
    habilitarElementosDOM(habilitar = false, ...parametros) {
      parametros.forEach((element) => {
        habilitar
          ? element.removeAttribute("disabled")
          : element.setAttribute("disabled", habilitar);
      });
    }
    validarPesoYMezcla() {
      const elements = [
        this.ingrL1,
        this.ingrL2,
        this.ingrL3,
        this.ingrL4,
        this.ingrL5,
        this.ingrL6,
        this.ingrL7,
        this.ingrL8,
        this.ingrL9,
        this.percentGlobalL1,
        this.percentGlobalL4,
        this.percentGlobalL6,
        this.percentGlobalL7,
        this.percentGlobalL8,
        this.percentIngL1,
        this.percentIngL2,
        this.percentIngL3,
        this.percentIngL4,
        this.percentIngL5,
        this.percentIngL6,
        this.percentIngL7,
        this.percentIngL8,
        this.percentIngL9,
      ];
      this.pesoHelado.value == "" || this.cantidadMezcla.value == ""
        ? this.habilitarElementosDOM(false, ...elements)
        : this.habilitarElementosDOM(true, ...elements);
    }
  }

  class CalculoCostos extends CostoHelados {
    constructor(ingredientes) {
      super(ingredientes);
    }
    ejecutarOperaciones(e, costos = false) {
      if (costos) this.buscarCostos(e);
      this.calcularSubtotales(e);
      this.calcularCosto(e);
      this.sumatoriaTotales();
      this.validarPorcentajesSubtotales(e);
    }
    ejecutarOperacionesGlobales(e) {
      const element = e.currentTarget ? e.currentTarget : e;
      let fila = element.parentElement.parentElement;
      let rowSpan = element.parentElement.rowSpan
        ? element.parentElement.rowSpan
        : 1;
      for (let i = 0; i < rowSpan; i++) {
        const porcentajeIngrediente = fila.querySelector(
          ".porcentajeIngrediente"
        );
        this.calcularSubtotales(porcentajeIngrediente);
        this.calcularCosto(porcentajeIngrediente);
        this.calcularTotales(porcentajeIngrediente);
        this.validarPorcentajesGlobales();
        this.sumatoriaTotales();
        fila = fila.nextElementSibling;
      }
    }
    buscarCostos(e) {
      const element = e.currentTarget;
      const celdaCosto =
        element.parentElement.parentElement.querySelector(".CostoKg");
      celdaCosto.textContent = `$${element.value}`;
    }
    calcularCosto(e) {
      const element = e.currentTarget ? e.currentTarget : e;
      const filaPadre = element.parentElement.parentElement;
      const celdaSubtotal = filaPadre.querySelector(".subtotal");
      const celdaCosto = filaPadre.querySelector(".CostoKg");
      const celdaCostoTotal = filaPadre.querySelector(".costoTotal");
      let valorSubtotal = celdaSubtotal.textContent.trim();
      let valorCosto = celdaCosto.textContent.trim().replace(/\$/g, "");
      celdaCostoTotal.textContent = `$
        ${
          (parseFloat(valorSubtotal.length === 0 ? 0 : valorSubtotal) *
            parseFloat(valorCosto.length === 0 ? 0 : valorCosto)) /
          1000
        }`;
    }
    calcularCostosReceta() {
      const filas = document.querySelectorAll(
        "table tbody tr.solidos, table tbody tr.liquidos"
      );
      Array.from(filas).forEach((element) => {
        const porcentajeIngrediente = element.querySelector(
          ".porcentajeIngrediente"
        );
        this.calcularSubtotales(porcentajeIngrediente);
        this.calcularCosto(porcentajeIngrediente);
        this.calcularTotales(porcentajeIngrediente);
        this.sumatoriaTotales();
      });
    }
    calcularSubtotales(e) {
      const element = e.currentTarget ? e.currentTarget : e;
      const porcentajeGlobal = this.encontrarPorcentajeGlobal(
        element.parentElement
      );
      const porcentajeIngrediente =
        element.parentElement.parentElement.querySelector(
          ".porcentajeIngrediente"
        );
      const celdas = element.parentElement.parentElement.cells;
      let operacion;
      Array.from(celdas).forEach((celda) => {
        switch (celda.className) {
          case "subtotalCategoria":
            operacion = (
              (parseFloat(porcentajeGlobal) / 100) *
              parseFloat(this.cantidadMezcla.value)
            ).toFixed(2);
            celda.textContent = isNaN(operacion) ? 0 : operacion;
            break;
          case "subtotal":
            operacion = (
              (parseFloat(porcentajeGlobal) / 100) *
              parseFloat(this.cantidadMezcla.value) *
              (parseFloat(porcentajeIngrediente.value) / 100)
            ).toFixed(2);
            celda.textContent = isNaN(operacion) ? 0 : operacion;
            break;
        }
      });
      return false;
    }
    calcularTotales(e) {
      const element = e.currentTarget ? e.currentTarget : e;
      const categoriaPrincipal = element.parentElement.parentElement.className;
      const filas =
        element.parentElement.parentElement.parentElement.querySelectorAll(
          `.${categoriaPrincipal} .subtotalCategoria`
        );
      const total =
        element.parentElement.parentElement.parentElement.querySelector(
          `.${categoriaPrincipal} .totalCategoria`
        );
      const peso = document.querySelector("#peso");
      const mezcla = document.querySelector("#cantidadMezcla");
      const cantidadHelados = document.querySelector(".cantidadHelados");
      let subtotal = 0;
      let valorPeso = peso.value ? parseFloat(peso.value) : 0;
      let valorMezcla = mezcla.value ? parseFloat(mezcla.value) : 0;
      Array.from(filas).forEach((fila) => {
        let celdaSubtotalCategoria = parseFloat(fila.textContent.trim());
        subtotal += isNaN(celdaSubtotalCategoria) ? 0 : celdaSubtotalCategoria;
      });
      total.textContent = subtotal;
      cantidadHelados.textContent = parseInt(valorMezcla / valorPeso);
      return false;
    }
    sumatoriaTotales() {
      const totalGlobalPorcentaje = document.querySelector(
        ".totalGlobalPercent"
      );
      const totalCategorias = document.querySelector(".totalCategorias");
      const totalCostos = document.querySelector(".totalCostos");
      const subtotales = document.querySelectorAll(".subtotal");
      const costoTotal = document.querySelectorAll(".costoTotal");
      const porcentajesGlobales = document.querySelectorAll(
        ".valorPorcentajeGlobal"
      );
      const cantidadHelados = document.querySelector(".cantidadHelados");
      const costoHelado = document.querySelector(".costoHelado");
      let valorCantidadHelados = cantidadHelados.textContent
        ? parseInt(cantidadHelados.textContent.trim())
        : 0;
      let totalPorcentajesGlobales = 0,
        sumSubtotal = 0,
        sumCostoTotal = 0;
      porcentajesGlobales.forEach((elemento) => {
        totalPorcentajesGlobales += elemento.value
          ? parseFloat(elemento.value)
          : 0;
      });
      subtotales.forEach((subtotal) => {
        let celdaSubtotal = parseFloat(subtotal.textContent.trim());
        sumSubtotal += isNaN(celdaSubtotal) ? 0 : celdaSubtotal;
      });
      costoTotal.forEach((costo) => {
        let celdaCostoTotal = parseFloat(
          costo.textContent.trim().replace(/\$/g, "")
        );
        sumCostoTotal += isNaN(celdaCostoTotal) ? 0 : celdaCostoTotal;
      });
      totalGlobalPorcentaje.textContent = totalPorcentajesGlobales;
      totalCategorias.textContent = sumSubtotal;
      totalCostos.textContent = `$${sumCostoTotal}`;
      let valorCostoHelado = parseFloat(sumCostoTotal / valorCantidadHelados);
      costoHelado.textContent = `$${
        isNaN(valorCostoHelado) ? 0 : valorCostoHelado
      }`;
      return false;
    }
    encontrarPorcentajeGlobal(elemento, esPadre = false) {
      let padre;
      let porcentajeGlobal;
      padre = !esPadre
        ? elemento.parentElement
        : elemento.previousElementSibling;
      porcentajeGlobal = padre.querySelector(".valorPorcentajeGlobal");
      if (porcentajeGlobal === null)
        return this.encontrarPorcentajeGlobal(padre, true);
      else return porcentajeGlobal.value;
    }
    validarPorcentajesSubtotales(e) {
      const element = e.currentTarget ? e.currentTarget : e;
      const padre = this.encontrarPadre(element.parentElement.parentElement);
      const celda = padre.querySelector(".porcentajeGlobal");
      const mensaje = document.querySelector(".mensaje");
      let fila = celda.parentElement;
      let error = [];
      let porcentaje = 0;
      for (let i = 0; i < celda.rowSpan; i++) {
        let porcentajeIngrediente = fila.querySelector(
          ".porcentajeIngrediente"
        );
        porcentaje += parseFloat(porcentajeIngrediente.value);
        error.push(porcentajeIngrediente);
        fila = fila.nextElementSibling;
      }
      if (porcentaje !== 100) {
        Array.from(error).forEach((celda) => {
          celda.classList.add("error");
        });
        mensaje.classList.remove("invisible");
        mensaje.classList.add("mensajeError");
        mensaje.textContent =
          "El porcentaje total para esta categoria debe ser 100%";
      } else {
        Array.from(error).forEach((celda) => {
          celda.classList.remove("error");
        });
        mensaje.classList.add("invisible");
        mensaje.classList.remove("mensajeError");
        mensaje.textContent = "";
      }
    }
    encontrarPadre(element) {
      let porcentajeGlobal = element.querySelector(".porcentajeGlobal");
      if (porcentajeGlobal === null)
        return this.encontrarPadre(element.previousElementSibling);
      else return element;
    }
    validarPorcentajesGlobales() {
      const mensaje = document.querySelector(".mensaje");
      const porcentajesGlobales = document.querySelectorAll(
        ".valorPorcentajeGlobal"
      );
      let totalPorcentajesGlobales = 0;
      porcentajesGlobales.forEach((elemento) => {
        totalPorcentajesGlobales += parseFloat(elemento.value);
      });
      if (totalPorcentajesGlobales !== 100) {
        porcentajesGlobales.forEach((elemento) => {
          elemento.classList.add("error");
        });
        mensaje.classList.remove("invisible");
        mensaje.classList.add("mensajeError");
        mensaje.textContent = "El porcentaje global total debe ser 100%";
      } else {
        porcentajesGlobales.forEach((elemento) => {
          elemento.classList.remove("error");
        });
        mensaje.classList.add("invisible");
        mensaje.classList.remove("mensajeError");
        mensaje.textContent = "";
      }
    }
    esDecimal(e) {
      const element = e.currentTarget;
      let charCode = e.which ? e.which : e.keyCode;
      if (
        (charCode != 46 || element.value.indexOf(".") != -1) &&
        (charCode < 48 || charCode > 57)
      )
        e.preventDefault();
    }
    evitarPegar(e) {
      e.preventDefault();
    }
  }
})(window);
