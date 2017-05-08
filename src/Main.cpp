#include "Main.h"

GLuint width = 1024, height = 768;
Camera camera(glm::vec3(-143.5f, 20.0f, 1.43));
bool keys[1024];
GLfloat lastX = 400, lastY = 300, deltaTime = 0.0f, lastFrame = 0.0f;
bool firstMouse = true, activateCamera = false, flyMode = false, rebound = true, roundabout = true;
CGLSLProgram glslRayProgram; //Programa de shaders del ray tracing
TwBar *menuTW;
//Posición de la luz
float ejeXL = -73.5, ejeYL = 120.0, ejeZL = 1.0, scaleT = 20.2, timeRebound = 0.0f, timeRoundabout = 0.0f, refractValue = 0.95f;

//Reshape de pantalla
void reshape(GLFWwindow* window, int w, int h) {

	w = max(w, 1);
	h = max(h, 1);
	width = w;
	height = h;
	glViewport(0, 0, width, height);
	TwWindowSize(width, height);

}

//Impresión de pantalla y lectura de shaders
bool initGlew() {

	glewExperimental = GL_TRUE;
	if (glewInit() != GLEW_OK)
		return false;
	else {
		std::cout << "OpenGL version: " << glGetString(GL_VERSION) << std::endl;
		std::cout << "GLSL version: " << glGetString(GL_SHADING_LANGUAGE_VERSION) << std::endl;
		std::cout << "Vendor: " << glGetString(GL_VENDOR) << std::endl;
		std::cout << "Renderer: " << glGetString(GL_RENDERER) << std::endl;

		//Leemos y cargamos los shaders correspondientes
		glslRayProgram.loadShader("Shaders/program.vert", CGLSLProgram::VERTEX);
		glslRayProgram.loadShader("Shaders/program.frag", CGLSLProgram::FRAGMENT);

		glslRayProgram.create_link();

		glslRayProgram.enable();

		glslRayProgram.addAttribute("position");
		glslRayProgram.addAttribute("normal");
		glslRayProgram.addAttribute("texCoords");

		glslRayProgram.addUniform("model");
		glslRayProgram.addUniform("view");
		glslRayProgram.addUniform("projection");
		glslRayProgram.addUniform("lightPos");
		glslRayProgram.addUniform("eye");
		glslRayProgram.addUniform("texture");
		glslRayProgram.addUniform("isLight");
		glslRayProgram.addUniform("isSponza");
		glslRayProgram.addUniform("textured");
		glslRayProgram.addUniform("width");
		glslRayProgram.addUniform("height");
		glslRayProgram.addUniform("cameraUp");
		glslRayProgram.addUniform("cameraFront");
		glslRayProgram.addUniform("cameraRight");
		glslRayProgram.addUniform("timeRoundabout");
		glslRayProgram.addUniform("timeRebound");
		glslRayProgram.addUniform("refractValue");

		glslRayProgram.disable();

		return true;

	}

}

//Activar o desactivar el giro
void TW_CALL setRoundabout(const void *value, void *clientData) {

	roundabout = *(const int *)value;

}

void TW_CALL getRoundabout(void *value, void *clientData) {

	(void)clientData;
	*(int *)value = roundabout;

}

//Activar o desactivar el rebote
void TW_CALL setRebound(const void *value, void *clientData) {

	rebound = *(const int *)value;

}

void TW_CALL getRebound(void *value, void *clientData) {

	(void)clientData;
	*(int *)value = rebound;

}

//Función de salir
void TW_CALL exit(void *clientData) {

	exit(1);

}

void initAntTweakBar() {

	menuTW = TwNewBar("Menú");
	TwDefine("Menú size='270 250' position='20 20' color='128 0 0' label='F.C.G. Proyecto Final - Jose M. Alvarez'");

	TwAddVarRW(menuTW, "ejeXL", TW_TYPE_FLOAT, &ejeXL, "step=0.15 label='x' group='Luz'");
	TwAddVarRW(menuTW, "ejeYL", TW_TYPE_FLOAT, &ejeYL, "step=0.15 label='y' group='Luz'");
	TwAddVarRW(menuTW, "ejeZL", TW_TYPE_FLOAT, &ejeZL, "step=0.15 label='z' group='Luz'");

	TwAddVarCB(menuTW, "toggleRoundabout", TW_TYPE_BOOL32, setRoundabout, getRoundabout, NULL, " label='Giro'");
	TwAddVarCB(menuTW, "toggleRebound", TW_TYPE_BOOL32, setRebound, getRebound, NULL, " label='Rebote'");
	TwAddVarRW(menuTW, "refractValue", TW_TYPE_FLOAT, &refractValue, "min=0.01 max=1.0 step=0.01 label='Factor de Refracción'");

	TwAddButton(menuTW, "exit", exit, NULL, " label='Salir' key=Esc");

}

void moverme() {

	if (keys[GLFW_KEY_W]) camera.ProcessKeyboard(FORWARD, deltaTime);
	if (keys[GLFW_KEY_S]) camera.ProcessKeyboard(BACKWARD, deltaTime);
	if (keys[GLFW_KEY_A]) camera.ProcessKeyboard(LEFT, deltaTime);
	if (keys[GLFW_KEY_D]) camera.ProcessKeyboard(RIGHT, deltaTime);
	if (keys[340]) camera.MovementSpeed = 50.0f;
	else camera.MovementSpeed = 29.9f;

}

void TwEventMouseButtonGLFW3(GLFWwindow* window, int button, int action, int mods) {
	if (TwEventMouseButtonGLFW(button, action)) return;
}

void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode) {

	if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) glfwSetWindowShouldClose(window, GL_TRUE);
	if (action == GLFW_PRESS) keys[key] = true;
	else if (action == GLFW_RELEASE) keys[key] = false;

	if (key == GLFW_KEY_T && (action == GLFW_PRESS)) {
		activateCamera = !activateCamera;

		if (activateCamera) {
			glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
		}
		else {
			glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
		}
	}

	if (key == GLFW_KEY_F && (action == GLFW_PRESS)) {

		flyMode = !flyMode;

	}

}

void mouse_callback(GLFWwindow* window, double x, double y) {

	if (TwEventMousePosGLFW(x, y)) {

		lastX = x;
		lastY = y;
		return;

	}

	if (firstMouse) {

		lastX = x;
		lastY = y;
		firstMouse = false;

	}

	GLfloat xoffset = x - lastX;
	GLfloat yoffset = lastY - y;
	lastX = x;
	lastY = y;

	if (activateCamera) camera.ProcessMouseMovement(xoffset, yoffset);

}

int main() {
	
	glfwInit();
	GLFWwindow* window = glfwCreateWindow(width, height, "F.C.G. Proyecto Final - Jose Manuel Alvarez - CI 25038805", nullptr, nullptr); // Windowed
	glfwMakeContextCurrent(window);
	glfwSetKeyCallback(window, key_callback);
	glfwSetMouseButtonCallback(window, (GLFWmousebuttonfun)TwEventMouseButtonGLFW3);
	glfwSetCursorPosCallback(window, mouse_callback);
	glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
	glfwSetFramebufferSizeCallback(window, reshape);
	glDisable(GL_CULL_FACE);
	TwInit(TW_OPENGL, NULL);
	glewExperimental = GL_TRUE;
	reshape(window, 1024, 768);
	glewInit();
	initAntTweakBar();
	glViewport(0, 0, width, height);
	glEnable(GL_DEPTH_TEST);
	
	initGlew();
	Model sponzaModel("Modelos/crytek-sponza/sponza.obj");
	Model quadModel("Modelos/obj/cube.obj");

	//Se inicializa la camara
	camera.Yaw = -0.25;
	camera.Pitch = 10.5;
	camera.updateCameraVectors();

	glDisable(GL_CULL_FACE);
	glEnable(GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

	while (!glfwWindowShouldClose(window)) {		

		if (roundabout) timeRoundabout += 0.005f;
		if (rebound) timeRebound += 0.005f;

		if (!flyMode) camera.Position[1] = 20.0f;
		GLfloat currentFrame = glfwGetTime();
		deltaTime = currentFrame - lastFrame;
		lastFrame = currentFrame;
		glfwPollEvents();
		moverme();

		glClearColor(0.05f, 0.05f, 0.05f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		TwDraw();

		glslRayProgram.enable();

		//Se envían al shader los parámetros para dibujar la escena
		glm::mat4 projection = glm::perspective(camera.Zoom, (float)width / (float)height, 0.1f, 1000.0f);
		glm::mat4 view = camera.GetViewMatrix();
		glUniformMatrix4fv(glslRayProgram.getLocation("projection"), 1, GL_FALSE, glm::value_ptr(projection));
		glUniformMatrix4fv(glslRayProgram.getLocation("view"), 1, GL_FALSE, glm::value_ptr(view));

		glm::mat4 model;
		model = glm::translate(model, glm::vec3(0.0f, -1.75f, 0.0f));
		model = glm::scale(model, glm::vec3(0.2f, 0.2f, 0.2f));
		glUniformMatrix4fv(glslRayProgram.getLocation("model"), 1, GL_FALSE, glm::value_ptr(model));

		glUniform3f(glslRayProgram.getLocation("lightPos"), ejeXL, ejeYL, ejeZL);
		glUniform3f(glslRayProgram.getLocation("eye"), camera.Position[0], camera.Position[1], camera.Position[2]);
		glUniform1i(glslRayProgram.getLocation("isLight"), 0);
		glUniform1i(glslRayProgram.getLocation("isSponza"), 1);
		glUniform1i(glslRayProgram.getLocation("textured"), 1);
		glUniform1i(glslRayProgram.getLocation("width"), width);
		glUniform1i(glslRayProgram.getLocation("height"), height);
		glUniform3f(glslRayProgram.getLocation("cameraUp"), camera.Up[0], camera.Up[1], camera.Up[2]);
		glUniform3f(glslRayProgram.getLocation("cameraFront"), camera.Front[0], camera.Front[1], camera.Front[2]);
		glUniform3f(glslRayProgram.getLocation("cameraRight"), camera.Right[0], camera.Right[1], camera.Right[2]);
		glUniform1f(glslRayProgram.getLocation("timeRoundabout"), timeRoundabout);
		glUniform1f(glslRayProgram.getLocation("timeRebound"), timeRebound);
		glUniform1f(glslRayProgram.getLocation("refractValue"), refractValue);

		sponzaModel.Draw();

		glslRayProgram.enable();
		//Se envían al shader los parámetros para dibujar la esfera de luz
		projection = glm::perspective(camera.Zoom, (float)width / (float)height, 0.1f, 1000.0f);
		view = camera.GetViewMatrix();
		glUniformMatrix4fv(glslRayProgram.getLocation("projection"), 1, GL_FALSE, glm::value_ptr(projection));
		glUniformMatrix4fv(glslRayProgram.getLocation("view"), 1, GL_FALSE, glm::value_ptr(view));

		model = glm::translate(model, glm::vec3(0.0, 0.0, 0.0));
		model = glm::scale(model, glm::vec3(scaleT, scaleT, scaleT));
		glUniformMatrix4fv(glslRayProgram.getLocation("model"), 1, GL_FALSE, glm::value_ptr(model));

		glUniform3f(glslRayProgram.getLocation("lightPos"), ejeXL, ejeYL, ejeZL);
		glUniform3f(glslRayProgram.getLocation("eye"), camera.Position[0], camera.Position[1], camera.Position[2]);
		glUniform1i(glslRayProgram.getLocation("isLight"), 1);
		glUniform1i(glslRayProgram.getLocation("isSponza"), 0);
		glUniform1i(glslRayProgram.getLocation("textured"), 1);
		glUniform1i(glslRayProgram.getLocation("width"), width);
		glUniform1i(glslRayProgram.getLocation("height"), height);
		glUniform3f(glslRayProgram.getLocation("cameraUp"), camera.Up[0], camera.Up[1], camera.Up[2]);
		glUniform3f(glslRayProgram.getLocation("cameraFront"), camera.Front[0], camera.Front[1], camera.Front[2]);
		glUniform3f(glslRayProgram.getLocation("cameraRight"), camera.Right[0], camera.Right[1], camera.Right[2]);
		glUniform1f(glslRayProgram.getLocation("timeRoundabout"), timeRoundabout);
		glUniform1f(glslRayProgram.getLocation("timeRebound"), timeRebound);
		glUniform1f(glslRayProgram.getLocation("refractValue"), refractValue);

		quadModel.Draw();

		glslRayProgram.disable();

		TwDraw();
		glfwSwapBuffers(window);
		TwDraw();

	}

	TwTerminate();
	glfwTerminate();
	return 0;

}
