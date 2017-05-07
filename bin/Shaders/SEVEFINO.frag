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
uniform vec3 camera_right;
uniform vec3 camera_up;
uniform vec3 camera_front;
uniform int width;
uniform int height;
uniform float iGlobalTime;

//Shaders office

// ------ https://www.shadertoy.com/view/4ljGRd

struct Ray {
  vec3 origin;
	vec3 direction;	
};

struct Sphere {
	vec3 center;
	float radius;
    vec4 color;
};

struct Plane {
	vec3 p;
    vec3 normal;  
    vec4 color;
};
    
struct DirectionalLight {
	vec3 dir;
    vec3 diff;
    vec3 spec;
};

   
DirectionalLight light;
Plane ground;
Sphere spheres[3];
const int amount = 3;
const int bounces = 1;
   
float interesect_ray_plane(Ray R, Plane P, out vec3 hitpos, out vec3 normal) {
	float a = dot(P.normal, (P.p - R.origin));
    float b = dot(P.normal, R.direction);
    return a / b;
}

float interesect_ray_sphere(Ray R, Sphere S, out vec3 hitpos, out vec3 normal) {
	vec3 v = R.origin - S.center;
	float B = dot(R.direction, v);
	float C = dot(v,v) - S.radius * S.radius;
	float B2 = B * B;
	float f = B2 - C;
	if(f < 0.0) {
		return 0.0;
	}
	float s = sqrt(f);
	float t0 = -B + s;
	float t1 = -B - s;
	float t = min(max(t0, 0.0), max(t1, 0.0));
	if(t == 0.0) {
		return 0.0;
	}
	hitpos = R.origin + t * R.direction;
	normal = normalize(hitpos - S.center);
	return t;
}

float applyDirLight(DirectionalLight light, vec3 view_dir,
                   vec3 norm,
                   inout vec4 frag, in vec4 albedo, float intensity) {
    
	vec3 light_dir = light.dir;

	float angle = clamp(dot(norm, light_dir), 0.0, 1.0);
	vec4 diff = vec4(light.diff * angle, 0.0) * albedo;
	vec4 spec = vec4(0.0, 0.0, 0.0, 1.0);
	if(angle > 0.0) {
		vec3 vec_l = normalize(light_dir + view_dir);
		spec = vec4(light.spec, 1.0);
		float s = pow(max(dot(norm, vec_l), 0.0), 150.0);
		spec *= s;
	}
	frag += (diff + spec) * intensity;
    return angle;
}

void applyBounce(vec3 origin, vec3 norm, vec3 view_dir, inout vec4 frag, float intensity) {
	float t;
    float inten = intensity;
    vec3 hitpos;
    vec3 normal;
    vec3 valid_hitpos = origin;
    vec3 valid_normal = norm;
    int bounce_id = 0;
    for(int bounce_id = 0; bounce_id < bounces; bounce_id++) {
        float min_t = 1000000.0;
        bool found = false;
    	for(int i=0; i<amount; i++) {
            Ray ray;
            ray.origin = valid_hitpos;
            ray.direction = valid_normal;
            t = interesect_ray_sphere(ray, spheres[i], hitpos, normal);
            if(t != 0.0) {
                if(t < min_t) {
                    found = true;
                    view_dir = ray.origin - spheres[i].center;
                    min_t = t;
                    valid_hitpos = hitpos;
                    valid_normal = normal;
                    applyDirLight(light, view_dir,
                       valid_normal,
                       frag, spheres[i].color, 2.0);
                }
            }
        }
        if(!found) {
            	break;
        }
    }
}

/*
struct Ray {
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
    Intersect plane = intersect(ray, Plane(vec3(0,1,0), Material(vec3(0.0, 0.0, 1.0), 1.0, 0.0)));
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

void main() {  

	vec2 resolution = vec2(width,height);
  	vec2 uv = gl_FragCoord.xy / resolution.xy - vec2(0.5);
    uv.x *= resolution.x / resolution.y;

    // For each fragment, create a ray at a fixed point of origin directed at
    // the coordinates of each fragment. The last thing before writing the color
    // to the fragment is to post-process the pixel values using tone-mapping.
    // In this case, I adjust for exposure and perform linear gamma correction.

    if (!isSponza) {

    	float normalized_i = (gl_FragCoord.x / width) - 0.5; // Alejo
        float normalized_j = (gl_FragCoord.y / height) - 0.5;// Alejo
        vec3 image_point = normalized_i * camera_right + normalized_j * camera_up + viewPos + camera_front;// Alejo
        vec3 ray_direction = image_point - viewPos;// Alejo


   		//Init ray
	    Ray ray;
		vec2 p = (2.0 * gl_FragCoord.xy - vec2(640.0, 480.0)) / 480.0;
		
		ray.origin = viewPos;	// Alejo
		ray.direction = image_point - viewPos; // Alejo

		ray.origin = vec3(0.0, 2.0, 6.0);
		ray.direction = normalize( vec3(p,-2.0));
		



	    //Init floor
	    ground.p = vec3(0.0, -4.0, 0.0);
	    ground.normal = vec3(0.0, 1.0, 0.0);
	    ground.color = vec4(0.6, 0.6, 1.0, 1.0);
	    //Init spheres
	    spheres[0] = Sphere(vec3(4.0 * cos(iGlobalTime), sin(iGlobalTime) * 2.0 + 1.5, sin(iGlobalTime) * 4.0 - 6.0), 1.0, vec4(1.0, 0.0, 0.0, 1.0));
		spheres[1] = Sphere(vec3(1.5, -1.5, -4.0),1.0, vec4(0.5, 1.0, 0.0, 1.0));
	    spheres[2] = Sphere(vec3(0.0, 0.0, -8.0), 2.5, vec4(1.0, 0.7, 0.0, 1.0));
	    //Init lights
	    light.dir = normalize(vec3(0.5, 0.5, 1.0));
	    light.diff = vec3(1.0, 1.0, 1.0);
	    light.spec = vec3(1.0);
	    
	    //Start calculation
	    vec3 view_dir;
	    vec3 hitpos;
		vec3 normal;
		float t;
		float min_t = 1000000.0;
		vec3 valid_hitpos;
		vec3 valid_normal;
	    bool found = false;
	    t = interesect_ray_plane(ray, ground, hitpos, normal);
	    if(t >= 0.0) {
	        found = true;
	    	colorOut = vec4(1.0,0.0,1.0,0.0);
	        //float inten = applyDirLight(light, view_dir, ground.normal, colorOut, ground.color, 1.0);
	    }
		for(int i=0; i<amount; i++) {
			t = interesect_ray_sphere(ray, spheres[i], hitpos, normal);
			if(t != 0.0) {
				if(t < min_t) {
	                found = true;
	                view_dir = ray.origin - spheres[i].center;
					min_t = t;
					valid_hitpos = hitpos;
					valid_normal = normal;
	                colorOut = vec4(0.0,0.0,0.0,1.0);
	                float inten = applyDirLight(light, view_dir,
	                   valid_normal,
	                   colorOut, spheres[i].color, 1.0);
					applyBounce(valid_hitpos, valid_normal, view_dir, colorOut, inten);
				}
	        }		 
		} 
	    if(!found) {
		    colorOut = vec4(1.0,0.0,1.0,0.0);
	    }

	    //colorOut = vec4(1.0,0.0,1.0,1.0);

   	} else {

    	vec3 norm = normalize(normales);
		vec3 lightDir = normalize(lightPosfrag - FragPos);
		vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);

		//Lambert		
		float diff = max(dot(norm, lightDir), 0.0);
		diffuse = vec4(diff,diff,diff,1.0);

		//Reflección Especular

		vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);

		//Blinn-Phong
		vec3 viewDir = normalize(viewPos - FragPos);
		vec3 halfwayDir = normalize(lightDir + viewDir);
		float spec = pow(max(dot(norm, halfwayDir), 0.0), 256.0);
		specular = vec4(spec,spec,spec,1.0);

		colorOut = diffuse + specular;
		if (textured) colorOut *= vec4(texture(texture, TexCoords));


   	}   	

}

