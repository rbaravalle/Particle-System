var CANT_PARTICLES;
var CANT_NEW_PARTICLES;

var cantFor = 0;

var RANDOM = 0;

var TIEMPO;
var maxSize;

var maxcoord = 512;
var maxcoord2 = maxcoord*maxcoord;
var largoCont;
var varcolor;
var varparticlecolor;
var c1, c2;

var occupied;

var t = 0;
var particles;
var max_it_cambio;

var rttFramebuffer;
var rttTexture;

var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;

var neheTexture;

var sceneNormalBuffer;
var sceneTextureCoordBuffer;
var scenePositionBuffer;
var sceneIndexBuffer;

//var teapotAngle = 180;
var sceneAngle = 180;
var lastTime = 0;
var stop = 0; // se hizo click, recalcular textura
var animar = true; // frenar/continuar la animacion

// indices elegidos por el usuario
var inds = [];
// porcentajes para cada direccion
var pdirs;
var vinds = [];

var TIEMPO_VIDA = 200;

var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useTexturesUniform = gl.getUniformLocation(shaderProgram, "uUseTextures");

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
    neheTexture = gl.createTexture();
    neheTexture.image = new Image();
    neheTexture.image.onload = function () {
        handleLoadedTexture(neheTexture)
    }

    neheTexture.image.src = "nehe.gif";
}



var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}



function point(x,y,i,r,g,b) {
    this.x = x
    this.y = y
    this.particle = i
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
}

function particle(x,y,i,tiempo, pr,pg,pb, dir,cambia) {

    var cf = [];
    var c = Math.random();
    if(c <= parseFloat($('c1p').value)*0.01) cf = c1; else  {cf = c2 }
    var d = 0.003921569; // 1/255
    if(pr >= 0) {
        this.r =  pr;
        this.g =  pg;
        this.b =  pb;
    }
    else {
        this.r = cf[0]*d;
        this.g = cf[1]*d;
        this.b = cf[2]*d;
    }
    this.r += c*varcolor;
    this.g += c*varcolor;
    this.b += c*varcolor;
    this.i = i;

    this.a = [];
    this.contorno = [];

    for(var ai = 0; ai < pdirs.length; ai++)
        if(pdirs[ai].value > 0) { d = ai; break; }

    /*this.vy = -1;
    this.vx = -1;*/
    if(dir >= 0)
        this.dir = dir;
    else this.dir = valueToDir(d);

    this.tiempoDeVida = tiempo || parseFloat($('maxSize').value);
    this.tActual = 0;

    this.rgrowth = Math.ceil(Math.random()*2);
    this.cangrow = true; // crece?

    this.cambiaDir = cambia;

    /*this.maxX = this.minX = x;
    this.maxY = this.minY = y;*/

    this.add(x,y);
   
}

/*function s(p1,p2) {
    if(p1.x == p2.x) {
        if(p1.y < p2.y) return 1; else return -1;
    }
    else {
        if(p1.x < p2.x) return 1; else return -1; 
    }
}*/

particle.prototype.add = function(x,y) { 
    var r,g,b;
    var pos = x+y*maxcoord;
    if(!occupied[pos]) occupied[pos] = new point(x,y,this.i,this.r,this.g,this.b);

    r = (this.r + occupied[pos].r)/2;
    g = (this.g + occupied[pos].g)/2;
    b = (this.b + occupied[pos].b)/2;


    this.a[this.a.length] = new point(x,y,this.i,r,g,b); 

    var p = [1,1,1,1,1,1,1,1]; // se usa la direccion o no
    var vals = [
        {'x':x-1,"y":y+1},
        {'x':x,"y":y+1},
        {'x':x+1,"y":y+1},
        {'x':x-1,"y":y},
        {'x':x+1,"y":y},
        {'x':x-1,"y":y-1},
        {'x':x,"y":y-1},
        {'x':x+1,"y":y-1}
    ];
    var dir = this.dir;
    if(dir == RANDOM) { // random
        this.vx = 0;
        this.vy = 0;
        p[0] = p[2] = p[5] = p[7] = 0;
    }
    if(dir == 6) { // horizontal izquierda
        this.vx = -1;
        this.vy = 0;
        p[1] = p[2] = p[4] = p[6] = p[7] = 0;
    }
    if(dir == 1) { // diagonal
        this.vx = 1;
        this.vy = 1;
        p[0] = p[3] = p[5] = p[6] = p[7] = 0;
    }
    if(dir == 8) { // vertical
        this.vx = 0;
        this.vy = 1;
        p[3] = p[4] = p[5] = p[6] = p[7] = 0;
    }
    if(dir == 2) { // horizontal
        this.vx = 1;
        this.vy = 0;
        p[0] = p[1] = p[3] = p[5] = p[6] = 0;
    }
    if(dir == 3) { // diagonal hacia abajo
        this.vx = 1;
        this.vy = -1;
        p[0] = p[1] = p[2] = p[3] = p[5] = 0;
    }
    if(dir == 4) { // vertical hacia abajo
        this.vx = 0;
        this.vy = -1;
        p[0] = p[1] = p[2] = p[3] = p[4] = 0;
    }
    if(dir == 5) { // diagonal abajo izquierda
        this.vx = -1;
        this.vy = -1;
        p[0] = p[1] = p[2] = p[4] = p[7] = 0;
    }
    if(dir == 7) { // diagonal arriba izquierda
        this.vx = -1;
        this.vy = 1;
        p[2] = p[4] = p[5] = p[6] = p[7] = 0;
    }

    for(var h = 0; h < p.length; h++) {
        if(p[h] > 0) {
            var i = vals[h].x;
            var j = vals[h].y;

            var pos = i+j*maxcoord;
            if(pos < maxcoord2 && pos >= 0 && !ocupada(pos) && !esta(i,j,this.contorno)) {
                this.contorno.push(new point(i,j,-1,r,g,b));
            }
        }
    }

    var pos = x+y*maxcoord;
    occupied[pos].x = x;
    occupied[pos].y = y;
    occupied[pos].particle = this.i;
    occupied[pos].r = r;
    occupied[pos].g = g;
    occupied[pos].b = b;
};


// funcion que determina si dos particulas se intersectan
/*particle.prototype.intersecta = function(p) {
    if(!this || !p) return false;

    if(this.maxX < p.minX || this.minX > p.maxX
        || this.maxY < p.minY || this.minY > p.maxY) return false;


    for(var i = 0; i < this.a.length; i++)
        for(var j = 0; j < p.a.length; j++) {
            if(this.a[i].x == p.a[j].x && this.a[i].y == p.a[j].y)
                return true;
        }

    return false;
};

// fusiona dos particulas en una sola
particle.prototype.fusion = function(p) {
    var aCopy = p.a.clone();
    var contCopy = p.contorno.clone();
    this.a.push(aCopy);

    this.vx = (this.vx+p.vx)/2;
    this.vy = (this.vy+p.vy)/2;
    this.minX = Math.min(this.minX, p.minX);
    this.minY = Math.min(this.minY, p.minY);
    this.maxX = Math.max(this.maxX, p.maxX);
    this.maxY = Math.max(this.maxY, p.maxY);
};*/

function valueToDir(v) {
    if(v == 0) return RANDOM;
    if(v == 1) return 3;
    if(v == 2) return 1;
    if(v == 3) return 8;
    if(v == 4) return 6;
}

function setDirs() {

    pdirs = document.getElementsByName('pdir');
    inds = [];
    vinds = [];

    for(var i = 0; i < pdirs.length; i++)
        if(pdirs[i].value > 0) { 
            inds.push(valueToDir(i));
            vinds.push(parseFloat(pdirs[i].value));
        }

}

particle.prototype.grow = function() {
//  var maxim = 1;;//(l/64)/this.rgrowth;

  if(this.cangrow && this.tActual > this.tiempoDeVida) { this.morir(); return; }
  this.tActual++;


    // cambio de direccion
  if(t%max_it_cambio == 0 && this.cambiaDir && t!= 0) {
        this.dir = Math.ceil(Math.random()*8);
        var r = Math.random()*100;

        var suma = 0;
        for(var i = 0; i < vinds.length; i++) {      
            if(r >= suma && r < suma+vinds[i]){
                this.dir = inds[i];
                break;
            }
            suma += vinds[i];
        }
   }

  //for(var g = 0; g < maxim ; g++) { // cantidad de puntos que se le agregan a la particula
    var l = this.contorno.length;       

    var resta = 1;
    if(this.dir == 3 ) resta = 0;
    if(this.dir == 7 ) resta = 2;

    c = l-1 - resta;

    if(this.dir == 0) {
        c = Math.ceil(Math.random()*(l-1));
    }

    if(!this.contorno[c]) { c = this.contorno.length-1; }
    
    for(var h = 0; h < this.contorno.length; h++)
    {
        cantFor++;
        var cont = this.contorno[c];

        if(!cont) { c = (c+1)%(this.contorno.length-1); continue; }
        
        var nx = cont.x;
        var ny = cont.y;

        this.contorno.splice(c,1);

        if(nx >= 0 && ny >= 0 && nx < maxcoord && ny < maxcoord 
 				&& !ocupada(nx+maxcoord*ny)) {

                var oc = occupied[nx+maxcoord*ny];
                if(oc) {
                    this.add(nx,ny);
                    break;
                }
        }
        c = (c+1)%(this.contorno.length-1);
    }
 // }

};  

particle.prototype.limpiarContorno = function() {
    var tempA = [];
    for(var i = 0; i < this.contorno.length; i++) {
        var cont = this.contorno[i];
        var actual = cont.x+cont.y*maxcoord;
        if(cont.x >= 0 && cont.y >= 0 && cont.x < maxcoord && cont.y < maxcoord && !ocupada(actual)) {
            tempA.push(cont);
        }
    }
    this.contorno = tempA;
    if(this.contorno.length == 0 ) this.cangrow = false;
}

function esta (x,y,a) {
    for(var i = 0; i < a.length; i++)
        if(a[i].x == x && a[i].y == y) return true;

    return false;
}

/*function dist(p1,p2) {
    var d1 = Math.abs(p1.x - p2.x);
    var d2 = Math.abs(p1.y - p2.y);
    var d = Math.sqrt( d1*d1 + d2*d2 );
    return d;
}*/

function init_particles() {
    CANT_PARTICLES = parseFloat($('cantp').value);
    CANT_NEW_PARTICLES = parseFloat($('cantnp').value);
    maxSize = parseFloat($('maxSize').value);
    particles = [];
    for(var i = 0; i < CANT_PARTICLES; i++) {
        var px = Math.ceil(Math.random()*maxcoord);
        var py = Math.ceil(Math.random()*maxcoord);
        if(px > 0 && py > 0 && px < maxcoord && py < maxcoord && !ocupada(px+maxcoord*py)) {
            particles.push(new particle(px,py,i,TIEMPO_VIDA,-1,-1,-1,-1,true));
        }
    }

}

particle.prototype.morir = function() {
    if(this.a.length < 100) {
        this.cangrow = false;
    }
    /*for(var i = 0; i < this.contorno.length; i++)
        delete this.contorno[i];
    this.contorno = [];*/
}

// una iteracion del algoritmo
function mover() {

    // nuevas particulas
    var ult = particles.length;
    for(var i = 0; i < CANT_NEW_PARTICLES; i++) {
        var px = Math.ceil(Math.random()*maxcoord);
        var py = Math.ceil(Math.random()*maxcoord);
        if(px > 0 && py > 0 && px < maxcoord && py < maxcoord && !ocupada(px+maxcoord*py)) {
            particles.push(new particle(px,py,ult++,TIEMPO_VIDA,-1,-1,-1,-1,true));
        }
    }

    largoCont = 0;
    for(var i = 0; i < particles.length; i++) {
       var pi = particles[i];
       if(pi.cangrow && pi.a.length > maxSize) pi.morir();
       if(pi.cangrow)
           pi.grow(); // simulacion de crecimiento de la burbuja
       largoCont += pi.contorno.length;
    };

    for(var i = 0; i < particles.length; i++)
        if(pi.cangrow) particles[i].limpiarContorno();
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function dibujarParticulas() {

    // dibujamos en este buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

    // comienzo de la escena
    gl.viewport(0, 0, maxcoord, maxcoord);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    //mat4.ortho(0,0,maxcoord,maxcoord,0.1,100.0,pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [-0.5, -0.5, -1.21]); //-1.2162

    var vertices = [];
    var colors = [];
    var normals = [];
    var cant = 0;

    gl.uniform1i(shaderProgram.useTexturesUniform, false);

    setMatrixUniforms();
    triangleVertexPositionBuffer = gl.createBuffer();
  	triangleVertexColorBuffer = gl.createBuffer();
    triangleVertexNormalBuffer = gl.createBuffer();


    gl.uniform3f(
        shaderProgram.pointLightingLocationUniform,
        parseFloat(document.getElementById("lightPositionX").value),
        parseFloat(document.getElementById("lightPositionY").value),
        parseFloat(document.getElementById("lightPositionZ").value)
    );

    var cant = 0, j = 0;
    vertices = [];
    colors = [];
    normals = [];


    // dummy
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sceneTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    // /dummy


    while(j< maxcoord2) {
         var p = occupied[j];
         if(p) {
             vertices.push(p.x/(maxcoord),p.y/(maxcoord),0.0);
             var c = (Math.random()*2-1)*(varparticlecolor);
             colors.push(p.r+c,p.g+c,p.b+c,1.0);
             normals.push(0.0,0.0,1.0);
             cant++;
        }
        j++;
        if(cant > 1 || j >= maxcoord2) {
            gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            triangleVertexPositionBuffer.itemSize = 3;
            triangleVertexPositionBuffer.numItems = cant;
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
           	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            triangleVertexColorBuffer.itemSize = 4;
           	triangleVertexColorBuffer.numItems = cant;
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            triangleVertexNormalBuffer.itemSize = 3;
            triangleVertexNormalBuffer.numItems = cant;
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, 0, cant);

            cant = 0;
            vertices = [];
            colors = [];
            normals = [];

        }
    }

    // dibuja eso en esta textura
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);      


    // liberamos
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function dibujarEscena() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, 0.0, -40.0]);
    mat4.rotate(mvMatrix, degToRad(10.4), [1, 0, -1]);
    mat4.rotate(mvMatrix, degToRad(sceneAngle), [0, 1, 0]);



    gl.uniform3f(
        shaderProgram.pointLightingLocationUniform,
        parseFloat(document.getElementById("lightPositionX").value),
        parseFloat(document.getElementById("lightPositionY").value),
        parseFloat(document.getElementById("lightPositionZ").value)
    );

    gl.uniform1i(shaderProgram.useTexturesUniform, true);

    gl.bindBuffer(gl.ARRAY_BUFFER, scenePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, scenePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
     
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sceneTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sceneNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sceneNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    // dummy
    var colors = [];
    for(var i = 0; i < sceneIndexBuffer.numItems; i++)
        colors.push(0.000000, 0.000000, 1.000000,0.000000);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
   	triangleVertexColorBuffer.numItems = colors.length;
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    // /dummy

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, sceneIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

}


function makeTexture() {


    init_variables();

    if (scenePositionBuffer == null || sceneNormalBuffer == null || sceneTextureCoordBuffer == null || sceneIndexBuffer == null) {
        alert(scenePositionBuffer + sceneNormalBuffer + sceneTextureCoordBuffer + sceneIndexBuffer + "Uno de los buffers no esta bien inicializado");
        return;
    }


    var d = new Date();
    var t1 = d.getTime();
    mover();
    for(var it = 0; it < TIEMPO-1 ; it++) {
        if(largoCont > 0) { t++;  mover(); } else break;
    }
    var d2 = new Date();
    var t2 = d2.getTime();

    $('tiempoIt').innerHTML = Math.abs(t2-t1)/1000 ;
    $('promedioIt').innerHTML = Math.abs(t2-t1)/(1000*TIEMPO) ;


    $('iteracion').innerHTML = it+1;
    //$('contorno').innerHTML = largoCont;
    $('contorno').innerHTML = cantFor;

    dibujarParticulas();

    for(var i = 0; i < maxcoord2; i++)
        delete occupied[i];
    for(var i = 0; i < particles.length; i++) {
        var pi = particles[i];
        for(var j = 0; j < pi.a.length; j++)
            delete pi.a[j];    
        delete particles[i];
    }

}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        sceneAngle += 0.04 * elapsed;
    }
    lastTime = timeNow;
}


function tick() {
    if(stop == 1) { makeTexture(); stop = 0;}
    requestAnimFrame(tick);
    if(!animar) return;
    else {
        dibujarEscena();
        animate();
    }
}

function ocupada(i) {
    if(!occupied[i]) { return false;}
    var p = occupied[i].particle;
    return (p >= 0 && particles[p] && particles[p].cangrow);
}


function init_variables() {
    TIEMPO = $('tiempo').value;
    c1 = [parseFloat($('c1r').value),parseFloat($('c1g').value),parseFloat($('c1b').value)];
    c2 = [parseFloat($('c2r').value),parseFloat($('c2g').value),parseFloat($('c2b').value)];

    varcolor = parseFloat($('varcolor').value);
    varparticlecolor = parseFloat($('varparticlecolor').value);
    max_it_cambio = parseFloat($('itercambio').value);

    // cada cuantas iteraciones cambia la direccion

    t = 0;

    occupied = [];
    for(var i = 0; i < maxcoord; i++)
        for(var j = 0; j < maxcoord; j++)
            occupied[i+j*maxcoord] = new point(i,j,-1,0,0,0);

    setDirs();

    init_particles();

}

function initTextureFramebuffer() {
    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = maxcoord;
    rttFramebuffer.height = maxcoord;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


function initBuffers() {
    scenePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scenePositionBuffer);
    vertices = [
        // Front face
        -2.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0, 
       
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    scenePositionBuffer.itemSize = 3;
    scenePositionBuffer.numItems = 4;

    sceneTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0, 
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sceneTextureCoordBuffer.itemSize = 2;
    sceneTextureCoordBuffer.numItems = 4;

    sceneIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    sceneIndexBuffer.itemSize = 1;
    sceneIndexBuffer.numItems = 6;

    sceneNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneNormalBuffer);
    var vertexNormals = [
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    sceneNormalBuffer.itemSize = 3;
    sceneNormalBuffer.numItems = 4;

}

function handleLoadedTeapot(teapotData) {
    sceneNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
    sceneNormalBuffer.itemSize = 3;
    sceneNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

    sceneTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexTextureCoords), gl.STATIC_DRAW);
    sceneTextureCoordBuffer.itemSize = 2;
    sceneTextureCoordBuffer.numItems = teapotData.vertexTextureCoords.length / 2;

    scenePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scenePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
    scenePositionBuffer.itemSize = 3;
    scenePositionBuffer.numItems = teapotData.vertexPositions.length / 3;

    sceneIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotData.indices), gl.STATIC_DRAW);
    sceneIndexBuffer.itemSize = 1;
    sceneIndexBuffer.numItems = teapotData.indices.length;
 }

function loadTeapot() {
    new Ajax.Request('Teapot.json', {
      method: 'get',
      onSuccess: function(response) {
        handleLoadedTeapot(JSON.parse(response.responseText));
      }
    });
}


function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    loadTeapot();
    initGL(canvas);
    initTextureFramebuffer();
    initShaders();
    initTexture();
    //initBuffers();



    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

}

