#version 330

#define cantSpheres 3
#define cantTriangles 2
//Piramide comentada #define cantTriangles 8

uniform sampler2D texture;
uniform bool isLight;
uniform bool isSponza;
uniform bool textured;
uniform vec3 cameraRight;
uniform vec3 cameraUp;
uniform vec3 cameraFront;
uniform int width;
uniform int height;
uniform float timeRebound;
uniform float timeRoundabout;

in vec2 TexCoords;
in vec3 lightPosfrag;
in vec3 FragPos;
in vec3 viewPos; 
in vec3 normales;

out vec4 colorOut;

struct Ray {
	vec3 origin;
	vec3 direction;	
};

struct Sphere {
	vec3 position;
	float radius;
    vec4 color;
};

struct Box {
	vec3 min;
	vec3 max;
	vec3 minNormal;
	vec3 maxNormal;
	vec4 color;
};

struct Triangle {
    vec3 v1;
    vec3 v2;  
    vec3 v3;
    vec4 color;
};
    
struct Light {
	vec3 position;
	vec3 dir;
    vec3 diff;
    vec3 spec;
};
   
Light light = Light(vec3(lightPosfrag), vec3(normalize(lightPosfrag - FragPos)), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0)) ;
Sphere spheres[cantSpheres];
Triangle triangles[cantTriangles];
Box box;
 
float interesectRayBox(vec3 origin, vec3 direction,vec3 minBox,vec3 maxBox, out vec3 posHit_out);
float intersectRaySphere(Ray ray, Sphere sphere, out vec3 posHit_out, out vec3 normal);
float intersectRayTriangle(Triangle tri, Ray ray, out vec3 posHit_out);
vec3 blinnPhong(Light light, vec3 normales, vec3 posHit_out, vec4 color, Ray ray);
vec3 getTriangleNormal(Triangle t1, Triangle t2);
vec3 getBoxNormal(vec3 min, vec3 max, vec3 hit);
vec4 reflection(vec3 origin, vec3 direction, vec3 norm, Light light);
vec4 secondReflection(vec3 origin, vec3 direction, vec3 norm, Light light);
vec4 refraction(vec3 origin, vec3 direction, vec3 norm, Light light, bool rebound);
vec4 secondRefraction(vec3 origin, vec3 direction, vec3 norm, Light light);
vec3 generateShadows(Ray ray, int figura);

float interesectRayBox(vec3 origin, vec3 direction,vec3 minBox,vec3 maxBox, out vec3 posHit_out) {

	float t = -1.0;
	vec3 newDir;
	newDir.x = 1.0 / direction.x;
	newDir.y = 1.0 / direction.y;
	newDir.z = 1.0 / direction.z;

	float t1 = (minBox.x - origin.x) * newDir.x;
	float t2 = (maxBox.x - origin.x) * newDir.x;
	float t3 = (minBox.y - origin.y) * newDir.y;
	float t4 = (maxBox.y - origin.y) * newDir.y;
	float t5 = (minBox.z - origin.z) * newDir.z;
	float t6 = (maxBox.z - origin.z) * newDir.z;

	float tMin = max(max(min(t1, t2), min(t3, t4)), min(t5, t6));
	float tMax = min(min(max(t1, t2), max(t3, t4)), max(t5, t6));

	//No hubo interseccion
	if (tMax < 0) return -1.0;
	if (tMin > tMax) return -1.0;

	t = tMin;
	posHit_out = origin + t * direction;
	return t;

}

float intersectRaySphere(Ray ray, Sphere sphere, out vec3 posHit_out, out vec3 normal) {

	vec3 v = ray.origin - sphere.position;
	float B = dot(ray.direction, v);
	float C = dot(v,v) - sphere.radius * sphere.radius;
	float B2 = B * B;
	float f = B2 - C;

	if (f < 0.0) return 0.0;

	float s = sqrt(f);
	float t0 = -B + s;
	float t1 = -B - s;
	float t = min(max(t0, 0.0), max(t1, 0.0));

	if (t == 0.0) return 0.0;
	
	posHit_out = ray.origin + t * ray.direction;
	normal = normalize(posHit_out - sphere.position);

	return t;

}

float intersectRayTriangle(Triangle tri, Ray ray, out vec3 posHit_out) {

	//Moller–Trumbore - Wikipedia
    vec3 e1, e2;  
    vec3 P, Q, T;
    float det, inv_det, u, v;
    float t;
    e1 = tri.v2 - tri.v1;
    e2 = tri.v3 - tri.v1;
    P = cross(ray.direction, e2);
    det = dot(e1, P);

    if (det > -0.00001 && det < 0.00001) return 0.0;

    inv_det = 1.0 / det;
    T = ray.origin - tri.v1;
    u = dot(T, P) * inv_det;

    if (u < 0.0 || u > 1.0) return -1.0;

    Q = cross(T, e1);
    v = dot(ray.direction, Q) * inv_det;

    if (v < 0.0 || u + v  > 1.0) return -1.0;

    t = dot(e2, Q) * inv_det;
    if (t > 0.00001) {

	    posHit_out = ray.origin + t * ray.direction;
	    return t;

    } else return -1.0; //No hubo interseccion

}

vec3 blinnPhong(Light light, vec3 normales, vec3 posHit_out, vec4 color, Ray ray) {

    vec3 norm = normalize(normales);
	vec3 lightDir = normalize(light.position - posHit_out);

	//Lambert		
	vec3 diffuse = vec3(0.0, 0.0, 0.0);
	float diff = max(dot(norm, lightDir), 0.0);
	diffuse = vec3(diff,diff,diff) * color.rgb;

	//Blinn-Phong
	vec3 specular = vec3(0.0, 0.0, 0.0);
	vec3 viewDir = normalize(ray.origin - posHit_out);
	vec3 halfwayDir = normalize(lightDir + viewDir);
	float spec = pow(max(dot(norm, halfwayDir), 0.0), 256.0);
	specular = vec3(spec,spec,spec);

	return diffuse + specular;

}

vec3 getTriangleNormal(Triangle t1, Triangle t2) {

    vec3 U = t1.v2 - t1.v1;
    vec3 V = t1.v3 - t1.v1;

    vec3 normal = vec3(0.0, 0.0, 0.0);
    normal.x = (U.y * V.z) - (U.z - V.y);
    normal.y = (U.z * V.x) - (U.x - V.z);
    normal.z = (U.x * V.y) - (U.y - V.x);

    U = t2.v2 - t2.v1;
    V = t2.v3 - t2.v1;

    vec3 normal2 = vec3(0.0, 0.0, 0.0);
    normal2.x = (U.y * V.z) - (U.z - V.y);
    normal2.y = (U.z * V.x) - (U.x - V.z);
    normal2.z = (U.x * V.y) - (U.y - V.x);
    return vec3((normal.x + normal2.x)/2.0, (normal.y + normal2.y)/2.0, (normal.z + normal2.z)/2.0);

}

vec3 getTriangleNormal2(Triangle t1) {

    vec3 U = t1.v2 - t1.v1;
    vec3 V = t1.v3 - t1.v1;

    vec3 normal = vec3(0.0, 0.0, 0.0);
    normal.x = (U.y * V.z) - (U.z - V.y);
    normal.y = (U.z * V.x) - (U.x - V.z);
    normal.z = (U.x * V.y) - (U.y - V.x);

    return normal;

}


vec3 getBoxNormal(vec3 min, vec3 max, vec3 hit) {

	vec3 c = (min + max) * 0.5;
	vec3 p = hit - c;
	vec3 d = (min - max) * 0.5;
	float bias = 1.000001;
	return normalize(vec3((p.x / abs(d.x) * bias), (p.y / abs(d.y) * bias), (p.z / abs(d.z) * bias)));

}

vec4 reflection(vec3 origin, vec3 direction, vec3 norm, Light light) {

    vec3 newDir = reflect(direction, norm);
    Ray ray = Ray(origin, newDir);
    float minDistance = 1000000.0;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 posHit_out, normal;
    float t;     

    //Se realiza la interseccion de la caja
    t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
    if (t >= 0.0 && t < minDistance) {

    	minDistance = t;
    	vec3 normalBox = getBoxNormal(box.minNormal, box.maxNormal, posHit_out);
    	color = vec4(blinnPhong(light, normalBox, posHit_out, box.color, ray), 1.0);

    	//Se crea la sombra a partir de otro rayo
        vec3 dirShadow = normalize(light.position - posHit_out); 
        Ray shadow = Ray(posHit_out, dirShadow);
        vec3 colorShadow = generateShadows(shadow, 12);
        if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0); 

    }
    
    //Se realiza la interseccion de las esferas
    for (int i = 1; i < cantSpheres; i++) {

    	t = intersectRaySphere(ray,spheres[i],posHit_out,normal);
        if (t != 0.0 && t < minDistance) {

            minDistance = t;
            vec3 newPosHit_out = posHit_out;
            vec3 newNormal = normal;
            color += vec4(blinnPhong(light, newNormal,newPosHit_out, spheres[i].color, ray), 1.0);
            if (i == 1) color = vec4(refraction(newPosHit_out, ray.direction, newNormal, light, true));
            
            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+9);
            if (colorShadow.r > 0.0) color += vec4(colorShadow,1.0);
        
        }

    }

    //Se realiza la interseccion de los triangulos
    for (int i = 0; i < cantTriangles; i++) {

        t = intersectRayTriangle(triangles[i], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

        	minDistance = t;
            vec3 tNormal = vec3(1.0, 1.0, 1.0);
            if (i < 2) {

	            if (i%2 == 0) tNormal = getTriangleNormal(triangles[i], triangles[i+1]);
	            else tNormal = getTriangleNormal(triangles[i-1], triangles[i]);
	            color = vec4(blinnPhong(light, tNormal, posHit_out, triangles[i].color, ray), 1.0);

        	} else color = vec4(1.0, 0.0, 1.0, 1.0);

            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+1);
            if (colorShadow.r > 0.0) color = vec4(colorShadow, 1.0);

        }

    }

    return color;

}

vec4 secondReflection(vec3 origin, vec3 direction, vec3 norm, Light light) {

    vec3 newDir = reflect(direction, norm);
    Ray ray = Ray(origin, newDir);
    float minDistance = 1000000.0;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 posHit_out, normal;
    float t;    

    //Se realiza la interseccion de la caja
    t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
    if (t >= 0.0 && t < minDistance) {

    	minDistance = t;
    	vec3 normalBox = getBoxNormal(box.minNormal, box.maxNormal, posHit_out);
    	color = vec4(blinnPhong(light, normalBox, posHit_out, box.color, ray), 1.0);

    	//Se crea la sombra a partir de otro rayo
        vec3 dirShadow = normalize(light.position - posHit_out); 
        Ray shadow = Ray(posHit_out, dirShadow);
        vec3 colorShadow = generateShadows(shadow, 12);
        if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0); 

    }

    //Se realiza la interseccion de las esferas
    for (int i = 1; i < cantSpheres; i++) {

        t = intersectRaySphere(ray,spheres[i],posHit_out,normal);
        if (t != 0.0 && t < minDistance) {

            minDistance = t;
            vec3 newPosHit_out = posHit_out;
            vec3 newNormal = normal;
            color += vec4(blinnPhong(light, newNormal,newPosHit_out, spheres[i].color, ray), 1.0);
            if (i == 1) color = vec4(secondRefraction(newPosHit_out, ray.direction, newNormal, light));
            
            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+9);
            if (colorShadow.r > 0.0) color += vec4(colorShadow,1.0);         

        }

    }

    //Se realiza la interseccion de los triangulos
    for (int i = 0; i < cantTriangles; i++) {

        t = intersectRayTriangle(triangles[i], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

        	minDistance = t;
            vec3 tNormal = vec3(1.0, 1.0, 1.0);
            if (i < 2) {

	            if (i%2 == 0) tNormal = getTriangleNormal(triangles[i], triangles[i+1]);
	            else tNormal = getTriangleNormal(triangles[i-1], triangles[i]);
	            color = vec4(blinnPhong(light, tNormal, posHit_out, triangles[i].color, ray), 1.0);

        	} else color = vec4(1.0, 0.0, 1.0, 1.0);

            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+1);
            if (colorShadow.r > 0.0) color = vec4(colorShadow, 1.0);
            
        }

    }

    return color;

}

vec4 refraction(vec3 origin, vec3 direction, vec3 norm, Light light, bool rebound) {

    vec3 newDir = refract(direction, normalize(norm), 0.90);
    Ray ray = Ray(origin, newDir);
    float minDistance = 1000000.0;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 posHit_out, normal;
    float t;    
    
    //Se realiza la interseccion de las esferas
    for (int i = 0; i < cantSpheres; i++) {

        if (i != 1) {

       		t = intersectRaySphere(ray,spheres[i],posHit_out,normal);
            if (t != 0.0 && t < minDistance) {

                minDistance = t;
                vec3 viewDir = ray.origin - spheres[i].position;
                vec3 newPosHit_out = posHit_out;
                vec3 newNormal = normal;
                color += vec4(blinnPhong(light, newNormal,newPosHit_out, spheres[i].color, ray), 1.0);

                if (i == 0 && !rebound) color += secondReflection(newPosHit_out, ray.direction, newNormal, light);
                
                //Se crea la sombra a partir de otro rayo
                vec3 dirShadow = normalize(light.position - posHit_out); 
                Ray shadow = Ray(posHit_out, dirShadow);
                vec3 colorShadow = generateShadows(shadow, i+9);
                if (colorShadow.r > 0.0) color += vec4(colorShadow,1.0);

            }

        }

    }

    //Se realiza la interseccion de la caja
    t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
    if (t >= 0.0 && t < minDistance) {

    	minDistance = t;
    	vec3 normalBox = getBoxNormal(box.minNormal, box.maxNormal, posHit_out);
    	color = vec4(blinnPhong(light, normalBox, posHit_out, box.color, ray), 1.0);

    	//Se crea la sombra a partir de otro rayo
        vec3 dirShadow = normalize(light.position - posHit_out); 
        Ray shadow = Ray(posHit_out, dirShadow);
        vec3 colorShadow = generateShadows(shadow, 12);
        if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0); 

    }

    //Se realiza la interseccion de los triangulos
    for (int i = 0; i < cantTriangles; i++) {

        t = intersectRayTriangle(triangles[i], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

        	minDistance = t;
            vec3 tNormal = vec3(1.0, 1.0, 1.0);
            if (i < 2) {

	            if (i%2 == 0) tNormal = getTriangleNormal(triangles[i], triangles[i+1]);
	            else tNormal = getTriangleNormal(triangles[i-1], triangles[i]);
	            color = vec4(blinnPhong(light, tNormal, posHit_out, triangles[i].color, ray), 1.0);

        	} else color = vec4(1.0, 0.0, 1.0, 1.0);

            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+1);
            if (colorShadow.r > 0.0) color = vec4(colorShadow, 1.0);
            
        }

    }

    return color;

}

vec4 secondRefraction(vec3 origin, vec3 direction, vec3 norm, Light light) {

    vec3 newDir = refract(direction, normalize(norm), 0.90);
    Ray ray = Ray(origin, newDir);
    float minDistance = 1000000.0;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 posHit_out, normal;
    float t; 

    //Se realiza la interseccion de las esferas
    for (int i = 0; i < cantSpheres; i++) {

        if (i != 1) {

        	t = intersectRaySphere(ray,spheres[i],posHit_out,normal);
            if (t != 0.0 && t < minDistance) {

                minDistance = t;
                vec3 viewDir = ray.origin - spheres[i].position;
                vec3 newPosHit_out = posHit_out;
                vec3 newNormal = normal;
                color += vec4(blinnPhong(light, newNormal,newPosHit_out, spheres[i].color, ray), 1.0);

                //Se crea la sombra a partir de otro rayo
                vec3 dirShadow = normalize(light.position - posHit_out); 
                Ray shadow = Ray(posHit_out, dirShadow);
                vec3 colorShadow = generateShadows(shadow, i+9);
                if (colorShadow.r > 0.0) color = vec4(colorShadow,1.0);                    
                
            }

        }

    }

    //Se realiza la interseccion de la caja
    t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
    if (t >= 0.0 && t < minDistance) {

    	minDistance = t;
    	vec3 normalBox = getBoxNormal(box.minNormal, box.maxNormal, posHit_out);
    	color = vec4(blinnPhong(light, normalBox, posHit_out, box.color, ray), 1.0);

    	//Se crea la sombra a partir de otro rayo
        vec3 dirShadow = normalize(light.position - posHit_out); 
        Ray shadow = Ray(posHit_out, dirShadow);
        vec3 colorShadow = generateShadows(shadow, 12);
        if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0); 

    }

    //Se realiza la interseccion de los triangulos
    for (int i = 0; i < cantTriangles; i++) {

        t = intersectRayTriangle(triangles[i], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

        	minDistance = t;
            vec3 tNormal = vec3(1.0, 1.0, 1.0);
            if (i < 2) {

	            if (i%2 == 0) tNormal = getTriangleNormal(triangles[i], triangles[i+1]);
	            else tNormal = getTriangleNormal(triangles[i-1], triangles[i]);
	            color = vec4(blinnPhong(light, tNormal, posHit_out, triangles[i].color, ray), 1.0);

        	} else color = vec4(1.0, 0.0, 1.0, 1.0);

            //Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, i+1);
            if (colorShadow.r > 0.0) color += vec4(colorShadow, 1.0);

        }

    }

    return color;

}

vec3 generateShadows(Ray ray, int figura) {

    vec3 color = vec3(0.25, 0.25, 0.25);
    vec3 posHit_out, normal;
    bool hitFound = false;
    float minDistance = 100000.0;
    float t;

    if (figura != 1) { //Triangulo 1

        t = intersectRayTriangle(triangles[0], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 2) { //Triangulo 2

        t = intersectRayTriangle(triangles[1], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    //Piramide comentada
    /*if (figura != 3) { //Triangulo 3 (Piramide)

        t = intersectRayTriangle(triangles[2], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 4) { //Triangulo 4 (Piramide)

        t = intersectRayTriangle(triangles[3], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 5) { //Triangulo 5 (Piramide)

        t = intersectRayTriangle(triangles[4], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 6) { //Triangulo 6 (Piramide)

        t = intersectRayTriangle(triangles[5], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 7) { //Triangulo 7 (Piramide)

        t = intersectRayTriangle(triangles[6], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }

    if (figura != 8) { //Triangulo 8 (Piramide)

        t = intersectRayTriangle(triangles[7], ray, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
            
        }

    }*/

    if (figura != 9) { //Esfera 1

        t = intersectRaySphere(ray,spheres[0],posHit_out,normal);
        if (t != 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;

        }

    }

    if (figura != 10) { //Esfera 2

        t = intersectRaySphere(ray,spheres[1],posHit_out,normal);
        if (t != 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
        
        }

    }

    if (figura != 11) { //Esfera 3

        t = intersectRaySphere(ray,spheres[2],posHit_out,normal);
        if (t != 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;

        }

    }

    if (figura != 12) { //Caja

        t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
        if (t >= 0.0 && t < minDistance) {

            color *= 0.2;
            hitFound = true;
            minDistance = t;
        
        }

    }

    if (hitFound) return color;
    else return vec3(0.0, 0.0, 0.0);

}

void main() {  

    if (!isSponza) {

    	//Se realiza todo el ray-tracing dentro del cubo
    	vec2 resolution = vec2(width, height);
    	float ni = (gl_FragCoord.x / width) - 0.5;
        float nj = (gl_FragCoord.y / height) - 0.5;
        vec3 point = ni * cameraRight + nj * cameraUp + viewPos + cameraFront;
	    Ray ray;	    
		
		//El rayo parte desde el ojo 
		ray.origin = viewPos;
		ray.direction = normalize(point - viewPos);

		//Se arma el piso invisible
        triangles[0] = Triangle(vec3(-118.89-180.0, -2.0, -52.25), vec3(-117.34-180.0, -2.0, 37.82), vec3(15.72+180.0, -2.0, -47.43), vec4(0.37, 0.34, 0.29, 0.0));
        triangles[1] = Triangle(vec3(16.89+180.0, -2.0, 40.70), vec3(-117.34-180.0, -2.0, 37.82), vec3(15.72+180.0, -2.0, -47.43), vec4(0.37, 0.34, 0.29, 0.0));

        //Piramide comentada
        //Se arma una piramide
        /*vec3 p0 = vec3(-5.0, -1.9999, 15.0);
		vec3 p1 = vec3(5.0, -1.9999, 15.0);
		vec3 p2 = vec3(5.0, -1.9999, 5.0);
		vec3 p3 = vec3(-5.0, -1.9999, 5.0);
		vec3 p4 = vec3(0.0, 9.0, 10.0);

		triangles[2] = Triangle(p0, p1, p4, vec4(0.0, 0.5, 0.0, 1.0));
		triangles[3] = Triangle(p1, p2, p4, vec4(0.0, 0.5, 0.0, 1.0));
		triangles[4] = Triangle(p2, p3, p4, vec4(0.0, 0.5, 0.0, 1.0));
		triangles[5] = Triangle(p3, p0, p4, vec4(0.0, 0.5, 0.0, 1.0));
		triangles[6] = Triangle(p0, p2, p1, vec4(0.0, 0.5, 0.0, 1.0));
	 	triangles[7] = Triangle(p0, p3, p2, vec4(0.0, 0.5, 0.0, 1.0));

	 	//Transformaciones de la piramide
        for (int i = 2; i < cantTriangles; i++) { 

        	//Escalando la piramide
        	triangles[i].v1 *= 2.40;
        	triangles[i].v2 *= 2.40;
        	triangles[i].v3 *= 2.40;

        	//Desplazamiento de la piramide en X
        	triangles[i].v1.x += -65.0;
        	triangles[i].v2.x += -65.0;
        	triangles[i].v3.x += -65.0;

        	//Desplazamiento de la piramide en Z
        	triangles[i].v1.z += -7.50;
        	triangles[i].v2.z += -7.50;
        	triangles[i].v3.z += -7.50;

        	//Ajustando posicion en Y
        	if (triangles[i].v1.y < 0.0) triangles[i].v1.y = -1.9999;
        	if (triangles[i].v2.y < 0.0) triangles[i].v2.y = -1.9999;
        	if (triangles[i].v3.y < 0.0) triangles[i].v3.y = -1.9999;

        }*/

	    //Se posicionan las esferas
	    spheres[0] = Sphere(vec3(30.0 * cos(timeRoundabout*2.0) -65.0, 31.5, sin(timeRoundabout*2.0) * 30.0 + 2.0), 8.0, vec4(0.5, 0.5, 1.0, 1.0));
		spheres[1] = Sphere(vec3(20.5-84.0, 29.5, -2.0), 8.0, vec4(0.0, 0.0, 0.0, 1.0));
	    spheres[2] = Sphere(vec3(0.0-84.0, sin(timeRebound*10.0) * 5.0 + 12.15, -8.0), 9.5, vec4(1.0, 0.0, 0.0, 1.0));

	    //Se arma una caja 
	    box = Box(vec3(-20.25, -1.9999, -20.25), vec3(0.0, 40.25, 0.0), vec3(0.0, 0.0, 0.0), vec3(20.25, 20.25, 20.25), vec4(1.0,0.5,1.0,1.0));
    
	    float t;
		float minDistance = 1000000.0;
	    bool hitFound = false;
	    vec3 posHit_out;
		vec3 normal_out;
	    
	    //Se realiza la interseccion de los triangulos
        for (int i = 0; i < cantTriangles; i++) {

            t = intersectRayTriangle(triangles[i], ray, posHit_out);
            if (t >= 0.0 && t < minDistance) {

            	minDistance = t;
                hitFound = true;
                vec3 tNormal = vec3(1.0, 1.0, 1.0);

                if (i < 2) {

		            if (i%2 == 0) tNormal = getTriangleNormal(triangles[i], triangles[i+1]);
		            else tNormal = getTriangleNormal(triangles[i-1], triangles[i]);

	        	} else tNormal = getTriangleNormal2(triangles[i]);

                //Se aplica Blinn-Phong a los triangulos que no corresponden al piso
                if (i>=2) colorOut = vec4(blinnPhong(light, tNormal, posHit_out, triangles[i].color, ray), 1.0);
                else colorOut = vec4(0.0, 0.0, 0.0, 0.0); 	//El piso sera invisible por el alpha = 0.0
                
                //Se crea la sombra a partir de otro rayo
                vec3 dirShadow = normalize(light.position - posHit_out); 
                Ray shadow = Ray(posHit_out, dirShadow);
                vec3 colorShadow = generateShadows(shadow, i+1);
                if (colorShadow.r > 0.0) colorOut = vec4(colorShadow, 1.0);

            }

        }       

        //Se realiza la interseccion de la caja
    	t = interesectRayBox(ray.origin,ray.direction,box.min, box.max, posHit_out);
	    if (t >= 0.0 && t < minDistance) {

	    	minDistance = t;
	    	hitFound = true;
	    	vec3 normalBox = getBoxNormal(box.minNormal, box.maxNormal, posHit_out);
	    	colorOut = vec4(blinnPhong(light, normalBox, posHit_out, box.color, ray), 1.0);
	    	
	    	//Se crea la sombra a partir de otro rayo
            vec3 dirShadow = normalize(light.position - posHit_out); 
            Ray shadow = Ray(posHit_out, dirShadow);
            vec3 colorShadow = generateShadows(shadow, 12);
            if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0);            

	    }

		//Se realiza la interseccion de las esferas
        for (int i = 0; i < cantSpheres; i++) {

            t = intersectRaySphere(ray,spheres[i],posHit_out,normal_out);
            if (t != 0.0 && t < minDistance) {

                hitFound = true;
                minDistance = t;
                vec3 viewDir = ray.origin - spheres[i].position;
                vec3 newPosHit_out = posHit_out;
                vec3 newNormal = normal_out;
                vec4 accumColor = vec4(0.0, 0.0, 0.0, 0.0);
                
                //Se refracta la escena en la esfera 1
                if (i != 1) accumColor = vec4(blinnPhong(light, newNormal,newPosHit_out, spheres[i].color, ray ), 1.0);
                else accumColor = vec4(refraction(newPosHit_out, ray.direction, newNormal, light, false));

                //Se refleja la escena en la esfera 1
                if (i == 0) accumColor += reflection(newPosHit_out, ray.direction, newNormal, light);
                colorOut = accumColor;

                //Se crea la sombra a partir de otro rayo
                vec3 dirShadow = normalize(light.position - posHit_out); 
                Ray shadow = Ray(posHit_out, dirShadow);
                vec3 colorShadow = generateShadows(shadow, i+9);
                if (colorShadow.r > 0.0) colorOut = vec4(colorShadow,1.0);

            }

        }

	    if (!hitFound) {

	    	//Si no hubo un hit, entonces no se muestra nada (alpha = 0.0)
		    colorOut = vec4(1.0,0.0,1.0,0.0);

	    }

   	} else {

   		//Se dibuja Sponza con Lambert y Blinn-Phong
    	vec3 norm = normalize(normales);
		vec3 lightDir = normalize(lightPosfrag - FragPos);	

		//Lambert	
		vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);	
		float diff = max(dot(norm, lightDir), 0.0);
		diffuse = vec4(diff,diff,diff,1.0);		

		//Blinn-Phong
		vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
		vec3 viewDir = normalize(viewPos - FragPos);
		vec3 halfwayDir = normalize(lightDir + viewDir);
		float spec = pow(max(dot(norm, halfwayDir), 0.0), 256.0);
		specular = vec4(spec,spec,spec,1.0);

		colorOut = diffuse + specular;
		if (textured) colorOut *= vec4(texture(texture, TexCoords));

   	}   	

}
