# Proyecto Final - Fundamentos y Técnicas en Computación Gráfica

## Tabla de contenido

* [Técnica](#técnica)
* [Escena](#escena)
* [Iluminación](#iluminación)
* [Nota importante](#nota-importante)
* [Herramientas](#herramientas)
* [Instalación y uso](#instalación-y-uso)
* [Integrante](#integrante)

# Técnica

La técnica implementada en este proyecto es la de Ray-Tracing. En ésta fueron comprendidos los siguientes métodos:
  - Intersección Rayo-Esfera.
  - Intersección Rayo-Triángulo.
  - Intersección Rayo-Caja.

# Escena 

La escena de este proyecto está compuesta por el modelo Sponza de Crytek junto con los siguientes objetos:
  - 1 esfera sin efectos.
  - 1 esfera refractiva.
  - 1 esfera reflectiva.
  - 1 caja.
  - (*) 1 pirámide.

Todos los objetos anteriormente mencionados poseen sombras. El giro de la esfera reflectiva y el rebote de la esfera sin efectos pueden ser activados o desactivados desde el menú de AntTweakBar.

Para desplazarse en la escena se pueden utilizar las teclas W, A, S, D y el ratón para mover la cámara. Esta última puede ser activada o desactivada presionando la tecla T. El modo "vuelo" puede ser activado o desactivado presionando la tecla F.

# Iluminación

Se implementó la iluminación siendo Phong el método de interpolación, Lambert el modo difuso y Blinn-Phong el modo especular. Ésta puede ser trasladada desde el menú de AntTweakBar.

# Nota importante

(*) Debido al bajo rendimiento del computador donde se implementó este proyecto, el Fragment Shader tiene comentado el despliegue de la pirámide. Si se desea mostrar en la aplicación, se debe descomentar todo el código que indique "//Piramide comentada".

# Herramientas

En el presente proyecto se utilizaron las siguientes herramientas con sus respectivas versiones:

| Herramienta                         	 | Versión   													   |                            
|----------------------------------------|-----------------------------------------------------------------|
| Microsoft Visual Studio        	 	 | 2015      													   |


# Instalación y uso

Se deberá descargar el siguiente repositorio o clonarlo con el comando:

>git clone https://github.com/josemalvarezg1/Fundamentos-y-Tecnicas-en-Computacion-Grafica-Proyecto-Final.git

Se puede abrir el archivo .sln en Visual Studio o ejecutar directamente el proyecto desde la carpeta bin/.

![alt tag](https://image.ibb.co/dUJr85/Untitled.png)

# Integrante

**José Manuel Alvarez García - CI 25038805**