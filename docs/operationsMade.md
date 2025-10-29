*** HERE YOU WILL FIND OUT ALL THE OPREATIONS MADE TO GET THE STATS ***
1. Progreso por sector
¿Qué representa? El progreso por sector muestra qué tan avanzado está el promedio de los proyectos de cada sector, considerando la etapa en la que se encuentra cada proyecto.

¿Cómo se calcula? Para cada sector, el backend envía la cantidad de proyectos en cada fase:

formulacion
precontractual
contractual
postcontractual
A cada fase se le asigna un peso:

Formulación: 0.25
Precontractual: 0.5
Contractual: 0.75
Postcontractual: 1
La fórmula aplicada es:

progreso_sector = (  (formulacion * 0.25) +  (precontractual * 0.5) +  (contractual * 0.75) +  (postcontractual * 1)
) / total_proyectos * 100

¿Qué significa?

Si todos los proyectos de un sector están en la última fase (postcontractual), el progreso será 100%.
Si todos están en la primera fase (formulacion), el progreso será 25%.
Si hay una mezcla, el cálculo pondera cada proyecto según su fase y saca el promedio.
2. Tasa de éxito general

¿Qué representa? La tasa de éxito general muestra el porcentaje de proyectos que han llegado a la fase final (postcontractual) respecto al total de proyectos.

¿Cómo se calcula? Hay dos formas posibles (según la data):

Si el backend envía el campo tasa_exito_general:

Se muestra directamente ese valor.
Si se calcula en frontend:

tasa_exito = (proyectos en postcontractual) / (total de proyectos) * 100

Es decir, se cuenta cuántos proyectos están en la fase final y se divide entre el total de proyectos.

¿Qué significa?

Si todos los proyectos están finalizados, la tasa será 100%.
Si ninguno está finalizado, la tasa será 0%.
Si el backend envía el valor, se muestra tal cual.