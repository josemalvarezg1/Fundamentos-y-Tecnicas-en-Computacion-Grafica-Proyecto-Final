#version 330

in vec2 TexCoords;
in vec3 lightPosfrag;
in vec3 FragPos;
in vec3 viewPos; 
in vec3 normales;

out vec4 colorOut;

uniform sampler2D texture;
uniform bool isLight;
uniform bool isSponza;
uniform bool textured;
uniform int width;
uniform int height;

//Shaders office

// ------ https://www.shadertoy.com/view/4ljGRd

/*struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Light {
    vec3 color;
    vec3 direction;
};


struct Material {
    vec3 color;
    float diffuse;
    float specular;
};


struct Intersect {
    float len;
    vec3 normal;
    Material material;
};

struct Sphere {
    float radius;
    vec3 position;
    Material material;
};

struct Plane {
    vec3 normal;
    Material material;
};

const float epsilon = 1e-3;


const int iterations = 16;


const float exposure = 1e-2;
const float gamma = 2.2;
const float intensity = 100.0;
const vec3 ambient = vec3(1.0, 0.0, 1.0) * intensity / gamma;

// For a Static Light
Light light = Light(vec3(1.0, 1.0, 1.0) * intensity, normalize(vec3(-1.0, 40.75, 1.0)));


const Intersect miss = Intersect(0.0, vec3(0.0), Material(vec3(0.0), 0.0, 0.0));

const float iGlobalTime = 1.0;

Intersect intersect(Ray ray, Sphere sphere) {
    // Check for a Negative Square Root
    vec3 oc = sphere.position - ray.origin;
    float l = dot(ray.direction, oc);
    float det = pow(l, 2.0) - dot(oc, oc) + pow(sphere.radius, 2.0);
    if (det < 0.0) return miss;

    // Find the Closer of Two Solutions
    float len = l - sqrt(det);
    if (len < 0.0) len = l + sqrt(det);
    if (len < 0.0) return miss;
    return Intersect(len, (ray.origin + len*ray.direction - sphere.position) / sphere.radius, sphere.material);
}

Intersect intersect(Ray ray, Plane plane) {
    float len = -dot(ray.origin, plane.normal) / dot(ray.direction, plane.normal);
    if (len < 0.0) return miss;
    return Intersect(len, plane.normal, plane.material);
}

Intersect trace(Ray ray) {
	
	const int num_spheres = 3;
    Sphere spheres[num_spheres];

    spheres[0] = Sphere(2.0, vec3(-4.0, 3.0 + sin(iGlobalTime), 0), Material(vec3(1.0, 0.0, 0.2), 1.0, 0.001));
    spheres[1] = Sphere(3.0, vec3( 4.0 + cos(iGlobalTime), 3.0, 0), Material(vec3(0.0, 0.2, 1.0), 1.0, 0.0));
    spheres[2] = Sphere(1.0, vec3( 0.5, 1.0, 6.0),                  Material(vec3(1.0, 1.0, 1.0), 1.0, 0.25));


    Intersect intersection = miss;
    Intersect plane = intersect(ray, Plane(vec3(normales), Material(vec3(0.0, 0.0, 1.0), 1.0, 0.0)));
    if (plane.material.diffuse > 0.0 || plane.material.specular > 0.0) { intersection = plane; }
    for (int i = 0; i < num_spheres; i++) {
        Intersect sphere = intersect(ray, spheres[i]);
        if (sphere.material.diffuse > 0.0 || sphere.material.specular > 0.0)
            intersection = sphere;
    }
    return intersection;

}

// This is the critical part of writing a ray tracer. I start with some empty
// scratch vectors for color data and the Fresnel factor. I trace the scene with
// using an input ray, and continue to fire new rays until the iteration depth
// is reached, at which point I return the total sum of the color values from
// computed at each bounce.
vec3 radiance(Ray ray) {
    vec3 color = vec3(0.0), fresnel = vec3(0.0);
    vec3 mask = vec3(1.0);
    for (int i = 0; i <= iterations; ++i) {
        Intersect hit = trace(ray);

        // This goes back to the dummy "miss" intersect. Basically, if the scene
        // trace returns an intersection with either a diffuse or specular
        // coefficient, then it has encountered a surface of a sphere or plane.
        // Otherwise, the current ray has reached the ambient-colored sky box.

        if (hit.material.diffuse > 0.0 || hit.material.specular > 0.0) {

            vec3 r0 = hit.material.color.rgb * hit.material.specular;
            float hv = clamp(dot(hit.normal, -ray.direction), 0.0, 1.0);
            fresnel = r0 + (1.0 - r0) * pow(1.0 - hv, 5.0);
            mask *= fresnel;

            if (trace(Ray(ray.origin + hit.len * ray.direction + epsilon * light.direction, light.direction)) == miss) {
                color += clamp(dot(hit.normal, light.direction), 0.0, 1.0) * light.color
                       * hit.material.color.rgb * hit.material.diffuse
                       * (1.0 - fresnel) * mask / fresnel;
            }


            vec3 reflection = reflect(ray.direction, hit.normal);
            ray = Ray(ray.origin + hit.len * ray.direction + epsilon * reflection, reflection);

        } else {

            vec3 spotlight = vec3(1e6) * pow(abs(dot(ray.direction, light.direction)), 250.0) * vec3(0.0,1.0,0.0);
            color += mask * (ambient + spotlight); 
            break;

        }

    }

    return color;

}*/

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Sphere {
    vec3 origin;
    float radius;
};

bool intersect(Ray r, Sphere s);

bool intersect(Ray r, Sphere s) {
    float a = dot(r.direction,r.direction);
    float b = dot(r.direction, 2.0 * (r.origin-s.origin));
    float c = dot(s.origin, s.origin) + dot(r.origin,r.origin) +-2.0*dot(r.origin,s.origin) - (s.radius*s.radius);

    float disc = b*b + (-4.0)*a*c;

    if (disc < 0)
        return false;

    return true;

}

void main() {  

	vec2 resolution = vec2(width,height);
  	vec2 uv = gl_FragCoord.xy / resolution.xy - vec2(0.5);
    uv.x *= resolution.x / resolution.y;

    // For each fragment, create a ray at a fixed point of origin directed at
    // the coordinates of each fragment. The last thing before writing the color
    // to the fragment is to post-process the pixel values using tone-mapping.
    // In this case, I adjust for exposure and perform linear gamma correction.

    if (!isSponza) {

   		/*Ray ray = Ray(vec3(0.0, 2.5, 12.0), normalize(vec3(uv.x, uv.y, -1.0)));
   		colorOut = vec4(pow(radiance(ray) * exposure, vec3(1.0 / gamma)), 1.0);*/


	   

   	} else {

   		float focal = 60;
	    float angle = tan(focal * 0.5 * 3.1415926535897932384626433832795 / 180); // convert from degree to radian
	    float imageAspectRatio = width / height;
	    float xx = (2 * (gl_FragCoord.x + 0.5) / width - 1) * angle * imageAspectRatio;
	    float yy = (1 - 2 * (gl_FragCoord.y + 0.5) / height) * angle;

	    vec3 rayOrigin = vec3(viewPos);
	    vec3 rayDirection = vec3(xx, yy, -1) - rayOrigin;
	    normalize(rayDirection);

	    Ray r;
	    r.origin = rayOrigin;
	    r.direction = rayDirection;

	    Sphere s;
	    s.origin = vec3(0.0f,0.0f,-1.1f);
	    s.radius =0.55f;

	    if (intersect(r,s)) colorOut = vec4(1,0,1, 1); 

	    else {

	   		vec3 norm = normalize(normales);
			vec3 lightDir = normalize(lightPosfrag - FragPos);
			vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);

			//Lambert		
			float diff = max(dot(norm, lightDir), 0.0);
			diffuse = vec4(diff,diff,diff,1.0);

			//Reflección Especular

			vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
			float intensity = 0.0;

			//Blinn-Phong
			vec3 viewDir = normalize(viewPos - FragPos);
			vec3 halfwayDir = normalize(lightDir + viewDir);
			float spec = pow(max(dot(norm, halfwayDir), 0.0), 256.0);
			specular = vec4(spec,spec,spec,1.0);

			colorOut = diffuse + specular;
			if (textured) colorOut *= vec4(texture(texture, TexCoords));

		}

   	}   	

}



/* Otro de esferas



Ray ray = Ray(vec3(0.0, 2.5, 12.0), normalize(vec3(uv.x, uv.y, -1.0)));

Sphere sphere = Sphere(0.2, vec3(-4.0, 3.0 + sin(iGlobalTime), 0), Material(vec3(1.0, 0.0, 0.2), 1.0, 0.001));

vec3 distanceFromCenter = (viewPos - sphere.position);
float B = 2.0 * dot(ray.direction, distanceFromCenter);
float C = dot(distanceFromCenter, distanceFromCenter) - pow(sphere.radius, 2.0);
float delta = pow(B, 2.0) - 4.0 * C;

float t = 0.0;
if (delta > 0.0) {
    float sqRoot = sqrt(delta);
    float t1 = (-B + sqRoot) / 2.0;
    float t2 = (-B - sqRoot) / 2.0;
    t = min(t1, t2);
}
if (delta == 0.0) {
    t = -B / 2.0;
}

vec3 surfacePoint = ray.origin + (t * ray.direction);

vec3 surfaceNormal = normalize(surfacePoint - sphere.position);

vec3 ambience = vec3(0.0,0.0,0.0);
Material matOfSphere = sphere.material;
vec3 lightDir = normalize(lightPosfrag - FragPos);
colorOut = vec4(matOfSphere.color + (ambience + ((1.0 - ambience) * max(0.0, dot(surfaceNormal, lightDir)))), 1.0);



*/


//My stuff


/*void main() {    
	
	color = vec4(1.0,1.0,1.0,1.0);

	if (isLight) {

		color = vec4(1.0,1.0,1.0,1.0);

	} else {

		//Reflección Difusa
		vec3 norm = normalize(normales);
		vec3 lightDir = normalize(lightPosfrag - FragPos);
		vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);

		//Lambert		
		float diff = max(dot(norm, lightDir), 0.0);
		diffuse = vec4(diff,diff,diff,1.0);

		//Reflección Especular

		vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
		float intensity = 0.0;

		//Blinn-Phong
		vec3 viewDir = normalize(viewPos - FragPos);
		vec3 halfwayDir = normalize(lightDir + viewDir);
		float spec = pow(max(dot(norm, halfwayDir), 0.0), 64.0);
		specular = vec4(spec,spec,spec,1.0);

		//Ambient Occlusion
		//float ao = ambientOcclusion(FragPos, norm);

		//color = diffuse + specular;
	    color *= vec4(texture(texture, TexCoords));

    }
    
}*/