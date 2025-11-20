# Plan de Pruebas E2E: Sistema de Refuerzo Integral (Puntos)

## 1. Resumen de la Aplicación

La aplicación CONTIGO cuenta con un "Sistema de Refuerzo Integral" diseñado para gamificar la gestión de hábitos, comportamientos y rutinas de niños con TDAH. El sistema se basa en la obtención, pérdida y canje de puntos, conectando las siguientes funcionalidades:

-   **Gestión de Hijos**: Creación de perfiles para cada niño.
-   **Hábitos**: Definición de hábitos con un valor de puntos asociado.
-   **Comportamientos**: Registro de conductas positivas (suman puntos) y negativas (restan puntos).
-   **Rutinas**: Agrupación de hábitos en secuencias diarias o semanales.
-   **Recompensas**: Definición de premios que pueden ser canjeados utilizando los puntos acumulados.
-   **Vista "Hoy"**: Interfaz para que el usuario (niño o padre) marque los hábitos completados del día.
-   **Dashboard**: Visualización del saldo de puntos y acceso al historial de transacciones.

## 2. Escenarios de Prueba

### Prerrequisitos Comunes
- Un usuario (padre/tutor) debe estar registrado y verificado.
- La aplicación asume un estado inicial sin hijos, hábitos, rutinas o recompensas, a menos que se especifique lo contrario.
- El inicio de sesión se realiza antes de cada escenario.

---

### Escenario 1: Configuración Inicial y Creación de Entidades

Este escenario asegura que un usuario puede configurar todos los elementos necesarios para que el sistema de puntos funcione.

#### 1.1 Agregar un nuevo hijo
**Pasos:**
1.  Navegar a la sección "Hijos" desde el dashboard.
2.  Hacer clic en "Agregar nuevo hijo".
3.  Completar el formulario con nombre, fecha de nacimiento y tipo de TDAH.
4.  Hacer clic en "Agregar hijo".

**Resultados Esperados:**
-   El niño recién creado aparece en la lista de hijos en el dashboard.
-   El saldo de puntos inicial del niño es 0.

#### 1.2 Crear un Hábito con Puntos
**Pasos:**
1.  Navegar a la sección "Hábitos".
2.  Hacer clic en "Nuevo Hábito".
3.  Completar el formulario, incluyendo un **Valor de Puntos** (ej. 10 puntos).
4.  Hacer clic en "Crear Hábito".

**Resultados Esperados:**
-   El hábito aparece en la lista de hábitos.
-   El valor de puntos asignado es visible.

#### 1.3 Crear un Comportamiento Positivo
**Pasos:**
1.  Navegar a la sección "Comportamientos".
2.  Hacer clic en "Nuevo Comportamiento".
3.  Completar el formulario con un nombre (ej. "Ayudar con las tareas") y un valor de **puntos positivo** (ej. 5 puntos).
4.  Hacer clic en "Crear Comportamiento".

**Resultados Esperados:**
-   El comportamiento aparece en la lista.

#### 1.4 Crear un Comportamiento Negativo
**Pasos:**
1.  Navegar a la sección "Comportamientos".
2.  Hacer clic en "Nuevo Comportamiento".
3.  Completar el formulario con un nombre (ej. "No hacer la cama") y un valor de **puntos negativo** (ej. -5 puntos).
4.  Hacer clic en "Crear Comportamiento".

**Resultados Esperados:**
-   El comportamiento aparece en la lista.

#### 1.5 Crear una Recompensa
**Pasos:**
1.  Navegar a la sección "Recompensas".
2.  Hacer clic en "Nueva Recompensa".
3.  Completar el formulario con un nombre y un **Costo en Puntos** (ej. 50 puntos).
4.  Hacer clic en "Crear Recompensa".

**Resultados Esperados:**
-   La recompensa aparece en la lista de recompensas disponibles.

#### 1.6 Crear una Rutina y Asignar un Hábito
**Pasos:**
1.  Navegar a la sección "Rutinas".
2.  Hacer clic en "Nueva Rutina" y darle un nombre.
3.  Seleccionar la rutina creada y hacer clic en "Agregar Hábitos".
4.  Seleccionar el hábito creado en el paso 1.2 y añadirlo a la rutina.
5.  Activar la rutina para los días deseados.

**Resultados Esperados:**
-   La rutina se crea correctamente.
-   El hábito asignado aparece dentro de la rutina.

---

### Escenario 2: Flujo Completo de Ganancia de Puntos

Este escenario prueba el flujo principal de sumar puntos a través de hábitos y comportamientos.

**Asunciones:** Se ha completado el Escenario 1. El saldo de puntos del niño es 0.

#### 2.1 Ganar Puntos por Completar un Hábito
**Pasos:**
1.  Navegar a la vista "Hoy".
2.  Localizar el hábito asignado a la rutina del día.
3.  Marcar el checkbox del hábito como completado.
4.  Navegar de vuelta al Dashboard.

**Resultados Esperados:**
-   El saldo de puntos del niño se actualiza correctamente (ej. de 0 a 10 puntos).
-   El `PointsBadge` en el dashboard refleja el nuevo total.

#### 2.2 Ganar Puntos por Registrar un Comportamiento Positivo
**Pasos:**
1.  En el Dashboard, hacer clic en el botón "Registrar Comportamiento".
2.  Seleccionar el comportamiento positivo creado (ej. "Ayudar con las tareas").
3.  Confirmar el registro.

**Resultados Esperados:**
-   El saldo de puntos del niño se incrementa correctamente (ej. de 10 a 15 puntos).
-   El `PointsBadge` se actualiza instantáneamente.

#### 2.3 Verificar Historial de Puntos (Ganancias)
**Pasos:**
1.  Hacer clic en el `PointsBadge` del niño en el dashboard para abrir el modal de historial.
2.  Verificar las transacciones.

**Resultados Esperados:**
-   Aparecen dos transacciones en el historial:
    -   Una entrada por el hábito completado (ej. "+10").
    -   Una entrada por el comportamiento positivo registrado (ej. "+5").
-   Las fuentes ("Hábito", "Comportamiento") y los nombres son correctos.

---

### Escenario 3: Flujo de Pérdida y Canje de Puntos

Este escenario prueba la funcionalidad de restar puntos y gastarlos en recompensas.

**Asunciones:** Se ha completado el Escenario 2. El saldo de puntos del niño es 15.

#### 3.1 Perder Puntos por Registrar un Comportamiento Negativo
**Pasos:**
1.  En el Dashboard, hacer clic en "Registrar Comportamiento".
2.  Seleccionar el comportamiento negativo creado (ej. "No hacer la cama").
3.  Confirmar el registro.

**Resultados Esperados:**
-   El saldo de puntos del niño se reduce correctamente (ej. de 15 a 10 puntos).
-   El `PointsBadge` se actualiza.

#### 3.2 Intentar Canjear una Recompensa sin Puntos Suficientes
**Pasos:**
1.  Navegar a la sección "Recompensas".
2.  Localizar la recompensa que cuesta 50 puntos.
3.  Hacer clic en el botón "Canjear".

**Resultados Esperados:**
-   El botón "Canjear" está deshabilitado o, al hacer clic, muestra un mensaje de error indicando que no hay puntos suficientes.
-   El saldo de puntos no cambia.

#### 3.3 Canjear una Recompensa con Puntos Suficientes
**Pasos:**
1.  *Acción previa (simulada)*: Realizar acciones para que el niño alcance 50 puntos o más.
2.  Navegar a la sección "Recompensas".
3.  Hacer clic en "Canjear" en la recompensa de 50 puntos.
4.  Confirmar el canje.

**Resultados Esperados:**
-   El saldo de puntos del niño se reduce en el costo de la recompensa (ej. de 50 a 0 puntos).
-   Aparece una notificación de éxito.
-   El `PointsBadge` se actualiza.

#### 3.4 Verificar Historial de Puntos (Pérdidas y Canjes)
**Pasos:**
1.  Abrir el modal de historial de puntos.
2.  Verificar las transacciones.

**Resultados Esperados:**
-   Aparecen las nuevas transacciones en el historial:
    -   Una entrada por el comportamiento negativo (ej. "-5").
    -   Una entrada por el canje de la recompensa (ej. "-50").
-   Las fuentes ("Comportamiento", "Recompensa") son correctas.

---

### Escenario 4: Casos de Borde y Pruebas Negativas

#### 4.1 Registrar un Hábito dos veces el mismo día
**Pasos:**
1.  En la vista "Hoy", marcar un hábito como completado.
2.  Desmarcar el mismo hábito.
3.  Volver a marcarlo como completado.

**Resultados Esperados:**
-   Los puntos solo deben ser otorgados una vez. El saldo de puntos debe reflejar una única ganancia por ese hábito en el día.
-   El historial de puntos solo debe mostrar una transacción para ese hábito en el día.

#### 4.2 Crear Entidades con Valores de Puntos Inválidos
**Pasos:**
1.  Intentar crear un hábito/comportamiento/recompensa con un valor de puntos no numérico (ej. "diez").
2.  Intentar crear un hábito con puntos negativos.
3.  Intentar crear una recompensa con costo cero o negativo.

**Resultados Esperados:**
-   La validación del formulario debe impedir la creación, mostrando mensajes de error claros.

#### 4.3 Eliminar Entidades Usadas en Transacciones
**Pasos:**
1.  Completar un hábito y ganar puntos.
2.  Navegar a la sección "Hábitos" y eliminar ese hábito.
3.  Abrir el historial de puntos.

**Resultados Esperados:**
-   La transacción en el historial de puntos debe permanecer intacta, mostrando el nombre del hábito eliminado y los puntos ganados. El sistema no debe fallar.
-   El saldo de puntos del niño no debe cambiar retroactivamente.
