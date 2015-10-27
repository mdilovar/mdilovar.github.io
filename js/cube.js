"use strict";
/*
global THREE EventsControls requestAnimationFrame timer loadGame
*/
//global scene variables
var renderer, camera, scene, flashlight, controls, canvas_div, Detector;

var AXIS = {
    X: "x",
    Y: "y",
    Z: "z"
};

var color_codes = {
    green: '#009E60',
    red: '#8A0413',
    blue: '#0051BA',
    yellow: '#FFD500',
    white: '#FFFFFF',
    orange: '#F84704',
    black: '#000000'
};

var textures = {
    white: THREE.ImageUtils.loadTexture("../images/colors_512/white.png"),
    yellow: THREE.ImageUtils.loadTexture("../images/colors_512/yellow.png"),
    red: THREE.ImageUtils.loadTexture("../images/colors_512/red.png"),
    orange: THREE.ImageUtils.loadTexture("../images/colors_512/orange.png"),
    blue: THREE.ImageUtils.loadTexture("../images/colors_512/blue.png"),
    green: THREE.ImageUtils.loadTexture("../images/colors_512/green.png")
};

var colors = ["green", "red", "blue", "yellow", "white", "orange"];
var colors_normal_order = ["white", "yellow", "red", "orange", "blue", "green"]; // #TODO: replace var colors with this?

//set cubicle size
var cubieSize = 200;

//..and the Cube object
var theCube;

/////
var objects = [],
    plane;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
    offset = new THREE.Vector3(),
    INTERSECTED, SELECTED, SELECTED2, FACE;
/////

function setup() {
    //setup all the scene objects
    setupScene();
    //load the game
    loadGame();
}

function setupScene() {
    if (!Detector.webgl) Detector.addGetWebGLMessage();
    //set the starting width and heigh of the scene
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight * .80;
    //set starting camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 20000;
    //create the renderer, the camera, and the scene
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene = new THREE.Scene();
    //add ambient light to the scene #TODO: remove this if no need
    //scene.add( new THREE.AmbientLight( 0xa7a7a7 ) );
    //set the camera starting position
    camera.position.z = 1500;
    // and the camera to the scene
    scene.add(camera);
    //create a flashlight
    flashlight = new THREE.SpotLight(0xffffff, 1.5);
    //add the flashlight to the camera
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    //start the WebGLRenderer
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0xf0f0f0);
    renderer.render(scene, camera); // render once just for the bg color
    //attach the renderer canvas to the DOM body
    canvas_div = document.getElementById('canvas_div');
    canvas_div.appendChild(renderer.domElement);
    // set up controls
    //controls = new THREE.OrbitControls( camera, renderer.domElement ); // OrbitControls has a natural 'up', TrackballControls doesn't.
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.noPan = true;
    //add window resize listener to redraw everything in case of windaw size change
    window.addEventListener('resize', onWindowResize, false);
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
        new THREE.MeshBasicMaterial({
            visible: false
        })
    );
    scene.add(plane);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
}

//redraw everything in case of window size change
function onWindowResize(e) {
    renderer.setSize(window.innerWidth, window.innerHeight * .80);
    camera.aspect = window.innerWidth / (window.innerHeight * .80);
    camera.updateProjectionMatrix();
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    var x = event.offsetX == undefined ? event.layerX : event.offsetX;
    var y = event.offsetY == undefined ? event.layerY : event.offsetY;
    mouse.x = (x / renderer.domElement.width) * 2 - 1;
    mouse.y = -(y / renderer.domElement.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (SELECTED) {
        var intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            //SELECTED.position.copy(intersects[0].point.sub(offset));
        }
        return;
    }
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            //if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            //INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            plane.position.copy(INTERSECTED.position);
            //plane.lookAt(camera.position);
        }
        canvas_div.style.cursor = 'pointer';
    }
    else {
        //if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
        canvas_div.style.cursor = 'auto';
    }
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        controls.enabled = false;
        SELECTED = intersects[0].object;
        FACE = intersects[0].face;
        //SELECTED.ppp=intersects[0].point.sub(offset);
        //console.log(SELECTED.id);
        var intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            offset.copy(intersects[0].point).sub(plane.position);
            SELECTED.pposition = intersects[0].point; //.sub(offset);
        }
        canvas_div.style.cursor = 'move';
    }
}

function onDocumentMouseUp(event) {
    event.preventDefault();
    controls.enabled = true;
    ////
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        //controls.enabled = false;
        SELECTED2 = intersects[0].object;
        moveWithMouse(SELECTED, SELECTED2, FACE);
        var intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
            offset.copy(intersects[0].point).sub(plane.position);
            SELECTED2.pposition = intersects[0].point; //.sub(offset);
        }
        canvas_div.style.cursor = 'move';
    }
    ////
    if (INTERSECTED) {
        plane.position.copy(INTERSECTED.position);
        SELECTED = null;
    }
    canvas_div.style.cursor = 'auto';
}

function shouldReverseDirection(c1, c2, face) {
    //returns true/1 || false/0: false - right hand rule; true - left hand rule
    var cpx = face.cubiesPerAxis;
    var cps = Math.pow(cpx, 2);
    var negate4y = (face.axis == AXIS.Y) ? true : false; // because y is special :)
    if ((c1 >= (cps - cpx) || (c1 % cpx) === 0) && (c2 >= (cps - cpx) || (c2 % cpx) === 0)) {
        if (c2 > c1) {
            return true ^ negate4y;
        }
        else if (c2 < c1) {
            return false ^ negate4y;
        }
    }

    if ((c1 < cpx || (c1 % cpx) === (cpx - 1)) && (c2 < cpx || (c2 % cpx) === (cpx - 1))) {
        if (c2 > c1) {
            return false ^ negate4y;
        }
        else if (c2 < c1) {
            return true ^ negate4y;
        }
    }

    if ((c1 >= (cps - cpx) || (c1 % cpx) === (cpx - 1)) && (c2 >= (cps - cpx) || (c2 % cpx) === (cpx - 1))) {
        if (c2 > c1) {
            return false ^ negate4y;
        }
        else if (c2 < c1) {
            return true ^ negate4y;
        }
    }

    if ((c1 < cpx || (c1 % cpx) === 0) && (c2 < cpx || (c2 % cpx) === 0)) {
        if (c2 > c1) {
            return true ^ negate4y;
        }
        else if (c2 < c1) {
            return false ^ negate4y;
        }
    }
    return false;
    //throw ('the logic of shouldReverseDirection is faulty. It did not cover this combination of cubelets.');
}

function moveWithMouse(fromCubie, toCubie, face) {
    var landingFaceAxis; //don't rotate the face the mouse pointer clicks, but the layers perpendicular to that face only
    var direction = 0; // 0 - rhr, 1 - lhr
    var fromCubieIndex, toCubieIndex;
    if (!fromCubie || !toCubie) return false;
    if (fromCubie === toCubie) return false;
    var faceColor = colors_normal_order[FACE.materialIndex];
    var curFace;
    var cubieOrientation = fromCubie.userData.orientation;
    for (var w in cubieOrientation) { //determine the landing face's axis
        var i = cubieOrientation[w].indexOf(faceColor);
        if (i > -1) {
            landingFaceAxis = w;
        }
    }
    //console.log(fromCubie, ' -> ', toCubie);
    // #TODO: map not supported by ie8 and below. even ie 10 doesn't suppor webgl! do forget about it.
    //console.log('incdex: ', (fromCubieIndex < toCubieIndex ? 'incr' : 'decr'));

    fromCubie = fromCubie.id;
    toCubie = toCubie.id;
    if (!theCube.busy) {
        for (var s = 1; s <= theCube.cubiesPerAxis; s++) { // s - slice number
            for (var d in AXIS) {
                //console.log(AXIS[d] ,landingFaceAxis);
                if (AXIS[d] == landingFaceAxis) continue; // ignore the landing face.
                curFace = theCube.getLayer(AXIS[d], s);
                fromCubieIndex = curFace.cubies.map(function(e) {
                    return e.id;
                }).indexOf(fromCubie);
                toCubieIndex = curFace.cubies.map(function(e) {
                    return e.id;
                }).indexOf(toCubie);
                //console.log(fromCubieIndex, toCubieIndex);
                if (curFace.hasCubie(fromCubie) && curFace.hasCubie(toCubie)) {
                    theCube.busy = true;
                    direction = shouldReverseDirection(fromCubieIndex, toCubieIndex, curFace);
                    theCube.rotateFace(curFace.cubies, curFace.axis, curFace.memArr, direction);
                    return; // console.log(curFace.cubies);
                }
            }
        }
    }
}

function moveWithKey(e) {
    //console.log(e.keyCode);
    if (!theCube.busy) {
        //var direction = e.shiftKey ? 1 : 0; // 1 - counter-clockwise
        if (e.keyCode == 85) { //u
            theCube.busy = true;
            theCube.rotateTopFace();
        }
        else if (e.keyCode == 68) { //d
            theCube.busy = true;
            theCube.rotateBottomFace();
        }
        else if (e.keyCode == 76) { //l
            theCube.busy = true;
            theCube.rotateLeftFace();
        }
        else if (e.keyCode == 82) { //r
            theCube.busy = true;
            theCube.rotateRightFace();
        }
        else if (e.keyCode == 70) { //f
            theCube.busy = true;
            theCube.rotateFrontFace();
        }
        else if (e.keyCode == 66) { //b
            theCube.busy = true;
            theCube.rotateBackFace();
        }
        else if (e.keyCode == 88) { //x
            theCube.busy = true;
            theCube.rotateMiddleX();
        }
        else if (e.keyCode == 89) { //y
            theCube.busy = true;
            theCube.rotateMiddleY();
        }
        else if (e.keyCode == 90) { //z
            theCube.busy = true;
            theCube.rotateMiddleZ();
        }
    }
}

function Cube() {
    this.cubies = []; //declare an array-container for cubie objects
    this.cubiesPerAxis;
    this.cubiesPerPlane;
    this.pivot = new THREE.Object3D(); //create a rotation pivot for the group
    this.solvedAmiation = {
        obj: new THREE.Object3D(),
        flag: false
    };
    this.busy = false;
    this.rendersPerMove = 26;
    this.animationRequests = [];
    this.updateStep = 0;
    this.gameHasStarted = false;
    this.scrambler;
    this.getCubieMesh = function getCubieMesh(x, y, z) { //console.log(x,y,z);
        var color_right = color_codes.white,
            color_left = color_codes.yellow,
            color_top = color_codes.red,
            color_bottom = color_codes.orange,
            color_front = color_codes.blue,
            color_back = color_codes.green;
        var texture_right = textures.white,
            texture_left = textures.yellow,
            texture_top = textures.red,
            texture_bottom = textures.orange,
            texture_front = textures.blue,
            texture_back = textures.green;
        var has_color = {
            green: true,
            red: true,
            blue: true,
            yellow: true,
            white: true,
            orange: true
        };
        //set the invisible sides to black
        if (x > 0) {
            color_left = color_codes.black;
            texture_left = null;
            has_color.yellow = false;
        }
        if (x < this.cubiesPerAxis - 1) {
            color_right = color_codes.black;
            texture_right = null;
            has_color.white = false;
        }
        if (y > 0) {
            color_bottom = color_codes.black;
            texture_bottom = null;
            has_color.orange = false;
        }
        if (y < this.cubiesPerAxis - 1) {
            color_top = color_codes.black;
            texture_top = null;
            has_color.red = false;
        }
        if (z > 0) {
            color_back = color_codes.black;
            texture_back = null;
            has_color.green = false;
        }
        if (z < this.cubiesPerAxis - 1) {
            color_front = color_codes.black;
            texture_front = null;
            has_color.blue = false;
        }
        //create the cubies's geometry
        var cubieGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
        var cubieMaterial;
        //create the cubies's material
        if (this.cubiesPerAxis > 5) { // #TODO: this val can be changed so that larde cube can be rendered without texture
            //load without texture if the cube is too big
            cubieMaterial = new THREE.MeshFaceMaterial([
                new THREE.MeshBasicMaterial({
                    color: color_right
                }), //right - white
                new THREE.MeshBasicMaterial({
                    color: color_left
                }), //left - yellow
                new THREE.MeshBasicMaterial({
                    color: color_top
                }), //top - red
                new THREE.MeshBasicMaterial({
                    color: color_bottom
                }), //bottom - orange
                new THREE.MeshBasicMaterial({
                    color: color_front
                }), //fromt - blue
                new THREE.MeshBasicMaterial({
                    color: color_back
                })
            ]); //back - green
        }
        else {
            cubieMaterial = new THREE.MeshFaceMaterial([
                new THREE.MeshPhongMaterial({
                    color: color_right,
                    map: texture_right
                }), //right - white
                new THREE.MeshPhongMaterial({
                    color: color_left,
                    map: texture_left
                }), //left - yellow
                new THREE.MeshPhongMaterial({
                    color: color_top,
                    map: texture_top
                }), //top - red
                new THREE.MeshPhongMaterial({
                    color: color_bottom,
                    map: texture_bottom
                }), //bottom - orange
                new THREE.MeshPhongMaterial({
                    color: color_front,
                    map: texture_front
                }), //fromt - blue
                new THREE.MeshPhongMaterial({
                    color: color_back,
                    map: texture_back
                })
            ]); //back - green
        }
        //create and return the cubie mesh
        var cubieMesh = new THREE.Mesh(cubieGeometry, cubieMaterial); //new THREE.MeshNormalMaterial( { transparent: true, opacity: 0.5 }));
        cubieMesh.userData.has_color = has_color; // #TODO: add something  to keep track of orientation.
        cubieMesh.userData.orientation = {
            x: ['white', 'yellow'],
            y: ['red', 'orange'],
            z: ['blue', 'green']
        };
        //x - LR
        //z - FB
        //y - UD
        return cubieMesh;
    };
    this.initCube = function initCube(size, onIsSolved) {
        this.cubiesPerAxis = size * 1 || 3;
        this.cubiesPerPlane = Math.pow(this.cubiesPerAxis, 2);
        this.onIsSolved = onIsSolved;
        // set max and min zoom (depends on the cube size and degree)
        controls.minDistance = 2.5 * this.cubiesPerAxis * cubieSize;
        controls.maxDistance = camera.far - 2.5 * this.cubiesPerAxis * cubieSize;
        //create the cube
        for (var z = 0; z < this.cubiesPerAxis; z++) {
            for (var y = 0; y < this.cubiesPerAxis; y++) {
                for (var x = 0; x < this.cubiesPerAxis; x++) {
                    //skip the core cubes. this helps prevent unnecessary and burdensome rendering. Helps especially as the cube gets bigger.
                    if (!(z === 0 || z === (this.cubiesPerAxis - 1))) { //if not the first or last line of the cube
                        if (!(x === 0 || x === (this.cubiesPerAxis - 1))) { //if not the first or the last row
                            if (!(y === 0 || y === (this.cubiesPerAxis - 1))) { //if not first or the last cubicle of the current raw
                                //add to the cubies array an empty 3d object entry but and don't draw anything
                                this.cubies.push(new THREE.Object3D());
                                continue;
                            }
                        }
                    }
                    //end of the 'skipper'
                    var cubieMesh = this.getCubieMesh(x, y, z);
                    //set coordinates correction value calculated so that the cube overall falls in the center of the scene
                    var coordCorrection = -((this.cubiesPerAxis - 1) * cubieSize) / 2;
                    //give the coordinates of the cube
                    cubieMesh.position.x = coordCorrection + x * cubieSize; // (cubieSize + 100);
                    cubieMesh.position.y = coordCorrection + y * cubieSize; // (cubieSize + 100);
                    cubieMesh.position.z = coordCorrection + z * cubieSize; // (cubieSize + 100);
                    //add the cube to the scene
                    scene.add(cubieMesh); //console.log(scene);
                    //push the object to cubies objects array for later actions.
                    this.cubies.push(cubieMesh);
                    //make sure eventcontrol knows about the all the cubies (eventcontrol is used for manipulating teh cube)
                    // /eControls.attach(cubieMesh);
                    objects.push(cubieMesh); // for mouse control
                }
            }
        }
        //start the animation
        draw();
    };
    this.scramble = function scramble(onComplete) {
        var randomMoveCount = 20;
        //var moves = ['u', 'd', 'l', 'r', 'f', 'b', 'x', 'y', 'z'];
        var axes = [AXIS.X, AXIS.Y, AXIS.Z]; //Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

        var i = 0;
        var _this = this;
        this.scrambler = setInterval(function() {
            if (i > randomMoveCount) {
                clearInterval(_this.scrambler);
                _this.gameHasStarted = true; //#TODO: I shouldn't reference the object by nam here, maybe find a way to abstract this.
                onComplete();
            }
            if (!_this.busy) {
                var random_direction = Math.round(Math.random());
                var random_sliceNumber = Math.floor(Math.random() * (_this.cubiesPerAxis));
                var random_axis = axes[Math.floor(Math.random() * axes.length)];
                _this.busy = true;
                var curFace = _this.getLayer(random_axis, random_sliceNumber);
                _this.rotateFace(curFace.cubies, curFace.axis, curFace.memArr, random_direction);
                i++;
            }
        }, 1);
    };
    this.destroy = function destroy() {
        clearInterval(this.scrambler);
        for (var c in this.cubies) {
            scene.remove(this.cubies[c]);
        }
        objects = [];
        scene.remove(this.solvedAmiation.obj);
        scene.remove(this.pivot);
        this.cubies = [];
        this.cubiesPerAxis;
        this.cubiesPerPlane;
        this.pivot = new THREE.Object3D();
        this.solvedAmiation = {
            obj: new THREE.Object3D(),
            flag: false
        };
        this.busy = false;
        this.rendersPerMove = 26;
        this.animationRequests = [];
        this.updateStep = 0;
        this.gameHasStarted = false;
    };
    this.go360 = function go360() {
        for (var c in this.cubies) {
            scene.remove(this.cubies[c]);
            this.solvedAmiation.obj.add(this.cubies[c]);
        }
        scene.add(this.solvedAmiation.obj);
        this.solvedAmiation.flag = true;
    };
    this.isSolved = function isSolved() {
        //check if solved after each user move
        // for each face see if all colors the same.(break as soon as any face returns not solved.)
        var nearfar = {
            'near': 0,
            'far': this.cubiesPerAxis - 1
        }; // anterior and posterior on each axis - e.g. front&back on, say z axis, top&bottom on y, etc.
        for (var i in nearfar) {
            if (!this.getLayerX(nearfar[i]).isFaceUniform()) return false;
            if (!this.getLayerY(nearfar[i]).isFaceUniform()) return false;
            if (!this.getLayerZ(nearfar[i]).isFaceUniform()) return false;
        }
        this.busy = true;
        this.go360();
        return true;
    };
    this.updateCubiesOrder = function updateCubiesOrder(memArr, faceArr, dir) {
        //assumes a square matrix
        //update the this.cubies "matrix" so that it matches the new "physical" locations of the cubies.
        //memArr - is the reference array that matches the position id to the physical cubicle id occupying it
        //faceArr is the array that holds current face cubies
        var sideLen = Math.sqrt(faceArr.length); // corresponds to cubiesPerAxis
        if (sideLen % 1 !== 0) {
            throw ('not a square matrix.');
        }
        if (dir === 0) { //cw rotation
            console.log('NOT reversing.');
        }
        else if (dir === 1) { //ccw rotation
            console.log('reversing first...');
            faceArr.reverse();
        }
        else {
            throw ('unknown direction!');
        }
        //var rotarr = [];
        faceArr.forEach(function(entry, index, array) {
            var x = index % sideLen;
            var y = Math.floor(index / sideLen);
            var newX = sideLen - y - 1;
            var newY = x;
            var newPos = newY * sideLen + newX;
            this.cubies[memArr[newPos]] = faceArr[index];
            //rotarr[newPos] = array[index];
        }, this);
        //console.log(rotarr);
    };
    this.OBSupdateCubiesOrder = function OBSupdateCubiesOrder(memArr, faceArr, direction) {
        // #TODO: remove me if updateCubiesOrder turns out ok
        direction = 0;
        for (var k = 0; k < this.cubiesPerPlane; k++) {
            var x = k % this.cubiesPerAxis;
            var y = Math.floor(k / this.cubiesPerAxis);
            var newY;
            var newX;
            var newPos;
            if (direction === 1) {
                newY = this.cubiesPerAxis - x - 1;
                newX = y;
            }
            else if (direction === 0) {
                newX = this.cubiesPerAxis - y - 1;
                newY = x;
            }
            newPos = newY * this.cubiesPerAxis + newX;
            this.cubies[memArr[newPos]] = faceArr[k];
        }
    };
    this.updateCubiesOrientation = function updateCubiesOrientation(faceArr, axis, direction) {
        // #TODO: this could be simplified
        for (var k = 0; k < faceArr.length; k++) {
            if (faceArr[k].userData.orientation) { // the middle placeholder objects don't have this variable.
                if (axis == AXIS.X) {
                    if (direction == 0) {
                        var temp1 = faceArr[k].userData.orientation[AXIS.Y][0];
                        faceArr[k].userData.orientation[AXIS.Y][0] = faceArr[k].userData.orientation[AXIS.Z][1];
                        faceArr[k].userData.orientation[AXIS.Z][1] = faceArr[k].userData.orientation[AXIS.Y][1];
                        faceArr[k].userData.orientation[AXIS.Y][1] = faceArr[k].userData.orientation[AXIS.Z][0];
                        faceArr[k].userData.orientation[AXIS.Z][0] = temp1;
                    }
                    else {
                        var temp1 = faceArr[k].userData.orientation[AXIS.Y][0];
                        faceArr[k].userData.orientation[AXIS.Y][0] = faceArr[k].userData.orientation[AXIS.Z][0];
                        faceArr[k].userData.orientation[AXIS.Z][0] = faceArr[k].userData.orientation[AXIS.Y][1];
                        faceArr[k].userData.orientation[AXIS.Y][1] = faceArr[k].userData.orientation[AXIS.Z][1];
                        faceArr[k].userData.orientation[AXIS.Z][1] = temp1;
                    }

                }
                if (axis == AXIS.Y) {
                    if (direction == 0) {
                        var temp2 = faceArr[k].userData.orientation[AXIS.Z][0];
                        faceArr[k].userData.orientation[AXIS.Z][0] = faceArr[k].userData.orientation[AXIS.X][1];
                        faceArr[k].userData.orientation[AXIS.X][1] = faceArr[k].userData.orientation[AXIS.Z][1];
                        faceArr[k].userData.orientation[AXIS.Z][1] = faceArr[k].userData.orientation[AXIS.X][0];
                        faceArr[k].userData.orientation[AXIS.X][0] = temp2;
                    }
                    else {
                        var temp2 = faceArr[k].userData.orientation[AXIS.Z][0];
                        faceArr[k].userData.orientation[AXIS.Z][0] = faceArr[k].userData.orientation[AXIS.X][0];
                        faceArr[k].userData.orientation[AXIS.X][0] = faceArr[k].userData.orientation[AXIS.Z][1];
                        faceArr[k].userData.orientation[AXIS.Z][1] = faceArr[k].userData.orientation[AXIS.X][1];
                        faceArr[k].userData.orientation[AXIS.X][1] = temp2;
                    }
                }
                if (axis == AXIS.Z) {
                    if (direction == 0) {
                        var temp3 = faceArr[k].userData.orientation[AXIS.Y][0];
                        faceArr[k].userData.orientation[AXIS.Y][0] = faceArr[k].userData.orientation[AXIS.X][0];
                        faceArr[k].userData.orientation[AXIS.X][0] = faceArr[k].userData.orientation[AXIS.Y][1];
                        faceArr[k].userData.orientation[AXIS.Y][1] = faceArr[k].userData.orientation[AXIS.X][1];
                        faceArr[k].userData.orientation[AXIS.X][1] = temp3;
                    }
                    else {
                        var temp3 = faceArr[k].userData.orientation[AXIS.Y][0];
                        faceArr[k].userData.orientation[AXIS.Y][0] = faceArr[k].userData.orientation[AXIS.X][1];
                        faceArr[k].userData.orientation[AXIS.X][1] = faceArr[k].userData.orientation[AXIS.Y][1];
                        faceArr[k].userData.orientation[AXIS.Y][1] = faceArr[k].userData.orientation[AXIS.X][0];
                        faceArr[k].userData.orientation[AXIS.X][0] = temp3;
                    }
                    /*x1 - y1
                    y1 - x2
                    x2 - y2
                    y2 - x1*/
                }
            }
        }
    };
    this.animateRequest = function animateRequest(request) {
        this.pivot.rotation.x += request.rotateTo.x / this.rendersPerMove;
        this.pivot.rotation.y += request.rotateTo.y / this.rendersPerMove;
        this.pivot.rotation.z += request.rotateTo.z / this.rendersPerMove;
        this.pivot.updateMatrixWorld();

        this.updateStep++;

        if (this.updateStep > this.rendersPerMove) {
            this.pivot.rotation.x = request.rotateTo.x;
            this.pivot.rotation.y = request.rotateTo.y;
            this.pivot.rotation.z = request.rotateTo.z;
            this.pivot.updateMatrixWorld();
            //scene.remove(this.pivot);
            for (var j in request.face) {
                //this.face[j].updateMatrixWorld(); // if not done by the renderer
                request.face[j].applyMatrix(this.pivot.matrixWorld);
                this.pivot.remove(request.face[j]);
                scene.add(request.face[j]);
            }
            //update this.cubies after movement
            this.updateCubiesOrder(request.memArr, request.face, request.direction);
            this.updateCubiesOrientation(request.face, request.axis, request.direction);
            this.animationRequests.shift();
            this.updateStep = 0;
            if (this.isSolved() && this.gameHasStarted) {
                this.onIsSolved();
            }
            else {
                this.busy = false;
            }
        }
    };
    this.update = function update() {
        if (this.animationRequests.length > 0) {
            this.animateRequest(this.animationRequests[0]);
        }
        if (this.solvedAmiation.flag) {
            this.solvedAmiation.obj.rotation.x += (Math.PI / 8) / this.rendersPerMove;
            this.solvedAmiation.obj.rotation.y += (Math.PI / 8) / this.rendersPerMove;
            this.solvedAmiation.obj.rotation.z += (Math.PI / 16) / this.rendersPerMove;
            //this.solvedAmiation.obj.updateMatrixWorld();
        }
    };
    this.rotateFace = function rotateFace(face, axis, memArr, direction) {
        //if (direction == 1) console.log('shoulda gone the other way.');
        if (direction !== 0 && direction !== 1) {
            console.log('WARNING! rotate called without direction.');
            console.log(direction);
            direction = 0;
        }
        //remove the group from the scene, add it to the pivot group, rotate and then put it back on the scene
        this.pivot.rotation.set(0, 0, 0);
        this.pivot.updateMatrixWorld();
        for (var i in face) {
            var matrixWorldInverse = new THREE.Matrix4();
            matrixWorldInverse.getInverse(this.pivot.matrixWorld);
            face[i].applyMatrix(matrixWorldInverse);
            scene.remove(face[i]);
            this.pivot.add(face[i]);
        }
        scene.add(this.pivot);

        var request = {
            rotateTo: {
                x: 0,
                y: 0,
                z: 0
            },
            face: face,
            axis: axis,
            memArr: memArr,
            direction: 0 // 0 - rhr
        };
        request.direction = direction;
        var rotationSign = (request.direction == 0) ? 1 : -1;
        if (axis == AXIS.X) {
            request.rotateTo.x = rotationSign * Math.PI / 2;
        }
        else if (axis == AXIS.Y) {
            request.rotateTo.y = rotationSign * Math.PI / 2;
        }
        else if (axis == AXIS.Z) {
            request.rotateTo.z = rotationSign * Math.PI / 2;
        }
        this.animationRequests.push(request);
        /* #TODO: some movement history recording should also be done*/
    };
    this.rotateBackFace = function rotateBackFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        var from = 0;
        var thru = this.cubiesPerPlane;
        for (var c in this.cubies) {
            if (c >= from && c < thru) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.Z, memArr);
    };
    this.rotateFrontFace = function rotateFrontFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        var from = this.cubies.length - this.cubiesPerPlane;
        var thru = this.cubies.length;
        for (var c in this.cubies) {
            if (c >= from && c < thru) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.Z, memArr);
    };
    this.rotateLeftFace = function rotateLeftFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        for (var c in this.cubies) {
            if ((c % this.cubiesPerAxis) === 0) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.X, memArr);
    };
    this.rotateRightFace = function rotateRightFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        for (var c in this.cubies) {
            if ((c % this.cubiesPerAxis) == (this.cubiesPerAxis - 1)) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.X, memArr);
    };
    this.rotateBottomFace = function rotateBottomFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        for (var c in this.cubies) {
            //c%9 >= 0 && c%9 < 3-1
            //console.log(c % this.cubiesPerPlane);
            //console.log(cubiclePerSide-1);
            if (((c % this.cubiesPerPlane) >= 0) && ((c % this.cubiesPerPlane) < (this.cubiesPerAxis))) {
                //console.log(c);
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        //myFace.reverse();
        memArr.reverse();
        this.rotateFace(myFace, AXIS.Y, memArr);
    };
    this.rotateTopFace = function rotateTopFace() {
        this.busy = true;
        var myFace = [];
        var memArr = [];
        for (var c in this.cubies) {
            //c%9 >= 9-3 && c%9 < 9
            if (((c % this.cubiesPerPlane) >= this.cubiesPerPlane - this.cubiesPerAxis) && ((c % this.cubiesPerPlane) < (this.cubiesPerPlane))) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        //myFace.reverse();
        memArr.reverse();
        this.rotateFace(myFace, AXIS.Y, memArr);
    };
    this.rotateMiddleY = function rotateMiddleY(middleSliceNumber) { // parrallel to top and bottom
        this.busy = true;
        var myFace = [];
        var memArr = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. middleSliceNumber specifies which slice is needed.
        middleSliceNumber = typeof middleSliceNumber !== 'undefined' ? middleSliceNumber % this.cubiesPerAxis : 1;
        for (var c in this.cubies) {
            if (((c % this.cubiesPerPlane) >= this.cubiesPerAxis * middleSliceNumber) && ((c % this.cubiesPerPlane) < (this.cubiesPerAxis * (middleSliceNumber + 1)))) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        //myFace.reverse();
        memArr.reverse();
        this.rotateFace(myFace, AXIS.Y, memArr);
    };
    this.rotateMiddleX = function rotateMiddleX(middleSliceNumber) { // parrallel to top and bottom
        this.busy = true;
        var myFace = [];
        var memArr = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. middleSliceNumber specifies which slice is needed.
        middleSliceNumber = typeof middleSliceNumber !== 'undefined' ? middleSliceNumber % this.cubiesPerAxis : 1;
        for (var c in this.cubies) {
            if ((c % this.cubiesPerAxis) === middleSliceNumber) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.X, memArr);
    };
    this.rotateMiddleZ = function rotateMiddleZ(middleSliceNumber) { // parrallel to top and bottom
        this.busy = true;
        var myFace = [];
        var memArr = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. middleSliceNumber specifies which slice is needed.
        middleSliceNumber = typeof middleSliceNumber !== 'undefined' ? middleSliceNumber % this.cubiesPerAxis : 1;
        var from = this.cubiesPerPlane * middleSliceNumber;
        var thru = this.cubiesPerPlane * (middleSliceNumber + 1);
        for (var c in this.cubies) {
            if (c >= from && c < thru) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        this.rotateFace(myFace, AXIS.Z, memArr);
    };
    this.getLayerY = function getLayerY(sliceNumber) { // parrallel to top and bottom
        var memArr = [];
        var myFace = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. sliceNumber specifies which slice is needed.
        sliceNumber = typeof sliceNumber !== 'undefined' ? sliceNumber % this.cubiesPerAxis : 1;
        for (var c in this.cubies) {
            if (((c % this.cubiesPerPlane) >= this.cubiesPerAxis * sliceNumber) && ((c % this.cubiesPerPlane) < (this.cubiesPerAxis * (sliceNumber + 1)))) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        memArr.reverse();
        return new CubeFace(myFace, AXIS.Y, sliceNumber, memArr);
    };
    this.getLayerX = function getLayerX(sliceNumber) { // parrallel to top and bottom
        var memArr = [];
        var myFace = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. sliceNumber specifies which slice is needed.
        sliceNumber = typeof sliceNumber !== 'undefined' ? sliceNumber % this.cubiesPerAxis : 1;
        for (var c in this.cubies) {
            if ((c % this.cubiesPerAxis) === sliceNumber) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        return new CubeFace(myFace, AXIS.X, sliceNumber, memArr);
    };
    this.getLayerZ = function getLayerZ(sliceNumber) { // parrallel to top and bottom
        var memArr = [];
        var myFace = [];
        // for cubes with cubiclePerSide larger than 3 there will  be more than one one layer. sliceNumber specifies which slice is needed.
        sliceNumber = typeof sliceNumber !== 'undefined' ? sliceNumber % this.cubiesPerAxis : 1;
        var from = this.cubiesPerPlane * sliceNumber;
        var thru = this.cubiesPerPlane * (sliceNumber + 1);
        for (var c in this.cubies) {
            if (c >= from && c < thru) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        return new CubeFace(myFace, AXIS.Z, sliceNumber, memArr);
    };

    this.getLayer = function getLayer(axis, sliceNumber) {
        var memArr = [];
        var myFace = [];
        var reverse4y = (axis == AXIS.Y) ? true : false; // because y is special :)
        sliceNumber = typeof sliceNumber !== 'undefined' ? sliceNumber % this.cubiesPerAxis : 1;
        for (var c in this.cubies) {
            if (this.layerFilter(axis, sliceNumber, c)) {
                myFace.push(this.cubies[c]);
                memArr.push(c);
            }
        }
        if (reverse4y) memArr.reverse();
        return new CubeFace(myFace, axis, sliceNumber, memArr);
    };
    this.layerFilter = function layerFilter(axis, sliceNumber, cubletIndex) {
        var c = cubletIndex;
        if (axis == AXIS.X) {
            if ((c % this.cubiesPerAxis) === sliceNumber) {
                return true;
            }
            return false;
        }
        else if (axis == AXIS.Y) {
            if (((c % this.cubiesPerPlane) >= this.cubiesPerAxis * sliceNumber) && ((c % this.cubiesPerPlane) < (this.cubiesPerAxis * (sliceNumber + 1)))) {
                return true;
            }
            return false;
        }
        else if (axis == AXIS.Z) {
            if (c >= (this.cubiesPerPlane * sliceNumber) && c < (this.cubiesPerPlane * (sliceNumber + 1))) {
                return true;
            }
        }
        else {
            throw ('invalid Axis value.');
        }
    };
}

function CubeFace(faceCubies, axis, farnear, memArr) {
    //#TODO: maybe add partially/completely solved checkers to the face class, like cross, full first layer, etc
    //#TODO: maybe add some validation to make sure that faceCubies.length === size^2
    //this.cubiesPerPlane = Math.pow(this.cubiesPerAxis,2);
    this.memArr = memArr;
    this.axis = axis;
    this.cubies = faceCubies;
    this.cubiesPerAxis = Math.sqrt(this.cubies.length);
    this.faceColor = null;
    if (farnear !== 0 && farnear !== this.cubiesPerAxis - 1) {
        //throw ('this is not a face layer');
    }
    if (farnear !== 0) farnear = 1; // can only be front/back, left/right, etc
    var nearfar = 1 - farnear; // swapping the near and the far
    //this.middleColor={'color':null,'colorSideIndex':null}; // totally redundant you already know what color is which index

    /*this.findMiddleColor = function findMiddleColor(){//doesn't work for 2x2 (also for 1x1 but that's just ane exception)
        try{
            //get the color of a cubies in the middle (as a rule it should have only one color. -- #TODO: there seems to be problem w/ at leas the white side regarding this rule.)
            var aCentralCubie = this.cubies[this.cubiesPerAxis+1];
            for (var i=0; i < aCentralCubie.material.materials.length; i++){
                if (aCentralCubie.material.materials[i].map !== null){
                    this.middleColor.color = aCentralCubie.material.materials[i].map.sourceFile; // [...].semanticColor
                    this.middleColor.colorSideIndex = i;
                }
            }
            console.log('this is the middle color ',this.middleColor);
            if (this.middleColor.color === null || this.middleColor.colorSideIndex === null) throw ('Failed to find MiddleColor for ', this.cubies);
        }
        catch(err) {
           console.log('Something went wrong in findMiddleColor ', err);
        }
    };*/
    this.isLayerUniform = function isLayerUniform() { // checks is cubies are in the righ layer regardless of their orientation
        for (var c = 0; c < colors.length; c++) {
            for (var i = 0; i < this.cubies.length; i++) {
                if (!this.cubies[i].userData.has_color[colors[c]]) break;
                if (i == this.cubies.length - 1) {
                    this.faceColor = colors[c];
                    return true;
                }
            }
        }
        return false;
    };
    this.getFaceColor = function getFaceColor() { // may return the face color even if the cubies are in the wrong orientation.
        if (this.faceColor !== null) return this.faceColor;
        if (this.isLayerUniform()) return this.faceColor;
        throw ('Layer not uniform.');
    };
    this.isFaceUniform = function isFaceUniform() { //checks if cbies are in rigth layer and in the right orientation
        if (!this.isLayerUniform()) return false; //a face can't be unifor if the layer doesn't have all the right cubies.
        for (var i = 0; i < this.cubies.length; i++) {
            //console.log(this.cubies[i].userData.orientation[axis][nearfar]);
            if (this.cubies[i].userData.orientation[axis][nearfar] !== this.faceColor) break; //e.g.[y2]
            if (i == this.cubies.length - 1) return true;
        }
        return false;
    };
    this.hasCubie = function hasCubie(cid) {
        for (var i = 0; i < this.cubies.length; i++) {
            if (this.cubies[i].id === cid) return true;
        }
        return false;
    };

}

setup();

function draw() {
    //setup animation loop
    //setTimeout( function() {
    //    requestAnimationFrame( draw );
    //}, 1000 / 30 );
    requestAnimationFrame(draw);
    //used by OrbitControls or TrackballControls for camera movement.
    controls.update();
    //render the scene with the camera
    renderer.render(scene, camera);
    //update the cube and the timer
    theCube.update();
    timer.update();
}