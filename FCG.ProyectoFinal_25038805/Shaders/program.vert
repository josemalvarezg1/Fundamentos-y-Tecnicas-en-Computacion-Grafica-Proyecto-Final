#version 330 

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 texCoords;

out vec2 TexCoords;
out vec3 FragPos;
out vec3 normales;
out vec3 viewPos;
out vec3 lightPosfrag;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 lightPos; 
uniform vec3 eye; 
uniform bool isSponza;

void main() {

	if (!isSponza) {

		//Se normaliza la posicion del cubo
		vec3 vertex = position*2.0 - vec3(1.0);
	  	gl_Position = vec4(vertex, 1.0f);

  	} else {

  		gl_Position = projection * view * model * vec4(position, 1.0f);

  	}
    
    mat4 vModel = model;
	FragPos = vec3(vModel * vec4(position, 1.0));
	lightPosfrag = lightPos;
	viewPos = eye;
	normales = mat3(transpose(inverse(vModel))) * normal;

    TexCoords = texCoords;

}