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
var distG;
var cantG; // cantidad de Generadores

// Arreglos de funciones parametricas
var fs = [function(x,y,xc,yc,radio,alfa) { // circulo
    return xc+radio*Math.cos(alfa);
},
function(x,y,xc,yc,radio,alfa) { return x;}, // vertical
function(x,y,xc,yc,radio,alfa) { // elipse
    return xc+radio*Math.cos(alfa)
},
function(x,y,xc,yc,radio,alfa) { // horizontal
    return x+1/maxcoord;
},
function(x,y,xc,yc,radio,alfa) { // random
    return x;
},
function(x,y,xc,yc,radio,alfa) { // espiral
    return xc+radio*Math.cos(alfa)*alfa/4;
},
function(x,y,xc,yc,radio,alfa) { // x ^ 2
    return x;
} ];

var gs = [function(x,y,xc,yc,radio,alfa) { // circulo
    return yc+radio*Math.sin(alfa);
},
function(x,y,xc,yc,radio,alfa) { return y+1/maxcoord;}, // vertical
function(x,y,xc,yc,radio,alfa) { // elipse
    return yc+radio*Math.sin(alfa);
},
function(x,y,xc,yc,radio,alfa) { // horizontal
    return y;
},
function(x,y,xc,yc,radio,alfa) { // random
    return y;
},
function(x,y,xc,yc,radio,alfa) { // espiral
    return yc+radio*Math.sin(alfa)*alfa/4;
},
function(x,y,xc,yc,radio,alfa) { // x^2
    return x*x;
} ];

var d;
var t1;

// defs
var CIRCULO = 0;
var VERTICAL = 1;
var ELIPSE = 2;
var HORIZONTAL = 3;
var RANDOM = 4;
var ESPIRAL = 5;
var POLINOMIO = 6;

var generadores;

var TIEMPO_VIDA;

var gl;

var __3D = false;

function aleat(x) {
    return Math.floor(Math.random()*x);
}

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



function point(x,y,i,r,g,b,a,p) {
    this.x = x
    this.y = y
    this.particle = i
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || 0;
    this.peso = p || 100000; // a menor peso, mas cercano a la funcion parametrica
}

function particle(x,y,i,tiempo, pr,pg,pb,pa, dir,cambia) {

    var c = aleat(generadores.length);
    var gx = generadores[c].x;
    var gy = generadores[c].y;
    
    //this.dir = RANDOM; 
    this.dir = aleat(10);
    if(this.dir > 7) this.dir = RANDOM;
    else {
        if(this.dir > 0) {
            this.dir = RANDOM;
        }
        else { this.dir = CIRCULO; }
    }

    this.fparam = fs[this.dir];
    this.gparam = gs[this.dir];


    this.xi = Math.floor(gx + distG*(Math.random()*2-1)*maxcoord);
    this.yi = Math.floor(gy + distG*(Math.random()*2-1)*maxcoord);

    this.radioA = 0.02+Math.random()*0.2;
    this.radioB = 0.02+Math.random()*0.2;

    if(this.dir == CIRCULO) this.radioA = this.radioB;

    // donde comienza la particula
    if(this.dir == CIRCULO || this.dir == ELIPSE || this.dir == ESPIRAL) 
        this.initX = this.xi + Math.floor(this.radioA*maxcoord);
    else this.initX = this.xi;

    this.initY = this.yi;

    x = this.initX;
    y = this.initY;

    var cf = [];
    var c = Math.random();
    if(c <= parseFloat($('c1p').value)*0.01)
//    if(t < Math.floor(TIEMPO/2))
         cf = c1; else  {cf = c2 }
    var d = 0.003921569; // 1/255

    if(pr >= 0) {
        this.r =  pr;
        this.g =  pg;
        this.b =  pb;
        this.a =  pa;
    }
    else {
        this.r = cf[0]*d;
        this.g = cf[1]*d;
        this.b = cf[2]*d;
        this.a = cf[3];
    }
    c = c*2-1;
    this.r += c*varcolor;
    this.g += c*varcolor;
    this.b += c*varcolor;

    this.i = i;

    this.t = [];
    this.contorno = [];

    this.tiempoDeVida = tiempo || parseFloat($('maxSize').value);
    this.tActual = 0;

    this.cangrow = true; // crece?

    this.cambiaDir = cambia;
    this.tInit = t;

    this.add(x,y);
   
}

function s(t1,t2) {
    if(t1.dist < t2.dist) return -1; else { if(t1.dist == t2.dist) return 0; else return 1; }
}

function s2(t1,t2) {
    if(t1.peso < t2.peso) return 1; else { if(t1.peso == t2.peso) return 0; else return -1; }
}

particle.prototype.add = function(x,y) { 
    var r,g,b;
    var pos = x+y*maxcoord;

    // variacion de color por texel
    var difc = (Math.random()*2-1)*(varparticlecolor);
    var thisr = this.r + difc;
    var thisg = this.g + difc;
    var thisb = this.b + difc;

    if(!occupied[pos]) occupied[pos] = new point(x,y,this.i,thisr,thisg,thisb,this.a);

    // Alpha blending?
    var op = occupied[pos];
    var src_a = op.a;
    var alp = this.a*(1-src_a);

    a = src_a + alp;
    r = (op.r*src_a + thisr*alp)/a;
    g = (op.g*src_a + thisg*alp)/a;
    b = (op.b*src_a + thisb*alp)/a;


    var pos = x+y*maxcoord;
    occupied[pos].x = x;
    occupied[pos].y = y;
    occupied[pos].particle = this.i;
    occupied[pos].r = r;
    occupied[pos].g = g;
    occupied[pos].b = b;
    occupied[pos].a = a;

    this.t[this.t.length] = new point(x,y,this.i,r,g,b,a); 

    // texels en el contorno del punto agregado
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

    if(this.dir != RANDOM) {

        var alfa = 2*Math.PI*(t-this.tInit)/TIEMPO_VIDA;

        var agrego = false;

        if(this.dir == ESPIRAL || this.dir == CIRCULO || this.dir == ELIPSE
        || this.dir==POLINOMIO) {
            var dists = [];
            for(var i = 0; i < vals.length; i++) {

                // se busca minimizar |x-f(alfa)| + |y-g(alfa)|
                var xreal = vals[i].x/maxcoord;
                var yreal = vals[i].y/maxcoord;
                var actualDist = 
                    Math.abs(xreal-
                   this.fparam(xreal,xreal,this.xi/maxcoord,this.yi/maxcoord,this.radioA,alfa)) +
                    Math.abs(yreal-this.yi/maxcoord-
                   this.gparam(xreal,yreal,this.xi/maxcoord,this.yi/maxcoord,this.radioB,alfa));
                
                dists.push({"ind" : i, "dist" : actualDist});

            }

            dists = dists.sort(s2);

            for(var h = 0; h < dists.length; h++) {
                var indActual = dists[h].ind;
                var i = vals[indActual].x;
                var j = vals[indActual].y;

                var pos = i+j*maxcoord;
                if( dists[h].dist < 0.02 && pos < maxcoord2 && pos >= 0 && !ocupada(pos) && !esta(i,j,this.contorno)) {
                    // solo un nuevo texel al contorno
                    this.contorno.push(new point(i,j,-1,r,g,b,0,dists[h].dist));
                    agrego = true;
                    break;
                }
            }
            if(!agrego) {
                var al = aleat(vals.length);
                this.contorno.push(new point(vals[al].x,vals[al].y,-1,r,g,b,0,-1));
            }
        }

        //if(this.dir != POLINOMIO) {
            this.contorno.push(new point(
                Math.floor(this.fparam(x/maxcoord,y/maxcoord,this.xi/maxcoord,this.yi/maxcoord,this.radioA,alfa)*maxcoord),
                Math.floor(this.gparam(x/maxcoord,y/maxcoord,this.xi/maxcoord,this.yi/maxcoord,this.radioB,alfa)*maxcoord),
                -1,r,g,b,0,-1));
       // }   
    }
    else {
        var next = aleat(vals.length);
        var next2 = aleat(vals.length);
        while(next2 == next)
            next2 = aleat(vals.length);

        this.contorno.push(new point(vals[next].x,vals[next].y,-1,r,g,b,0,-1));
        this.contorno.push(new point(vals[next2].x,vals[next2].y,-1,r,g,b,0,-1));
    }
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

particle.prototype.grow = function() {
    if(this.cangrow && this.tActual > this.tiempoDeVida) { this.morir(); return; }
    this.tActual++;

    c = 0;
    
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

};  


function esta (x,y,a) {
    for(var i = 0; i < a.length; i++)
        if(a[i].x == x && a[i].y == y) return true;

    return false;
}

function init_particles() {
    CANT_PARTICLES = parseFloat($('cantp').value);
    CANT_NEW_PARTICLES = parseFloat($('cantnp').value);
    maxSize = parseFloat($('maxSize').value);
    particles = [];
    for(var i = 0; i < CANT_PARTICLES; i++) {
        var px = aleat(maxcoord);
        var py = aleat(maxcoord);
        while(ocupada(px+maxcoord*py)) {
            px = aleat(maxcoord);
            py = aleat(maxcoord);
        }
        if(px > 0 && py > 0 && px < maxcoord && py < maxcoord) {
            particles.push(new particle(px,py,i,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        }
    }

}

particle.prototype.morir = function() {
    this.cangrow = false;
}

// una iteracion del algoritmo
function mover() {

    // nuevas particulas
    var ult = particles.length;
    for(var i = 0; i < CANT_NEW_PARTICLES; i++) {
        var px = aleat(maxcoord);
        var py = aleat(maxcoord);
        while(ocupada(px+maxcoord*py)) {
            px = aleat(maxcoord);
            py = aleat(maxcoord);
        }
        if(px > 0 && py > 0 && px < maxcoord && py < maxcoord) {
            particles.push(new particle(px,py,ult++,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        }
    }

    largoCont = 0;
    for(var i = 0; i < particles.length; i++) {
       var pi = particles[i];
       if(pi.cangrow && pi.t.length > maxSize) pi.morir();
       if(pi.cangrow)
           pi.grow();
       largoCont += pi.contorno.length;
    };

}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function dibujarParticulas() {

    // dibujamos en este buffer
    if(__3D)     gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

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
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    // /dummy


    while(j< maxcoord2) {
         var p = occupied[j];
         if(p) {
             vertices.push(p.x/(maxcoord),p.y/(maxcoord),0.0);

             colors.push(p.r,p.g,p.b,1.0);
             normals.push(0.0,0.0,1.0);
             cant++;
        }
        j++;
        if(cant > 512 || j >= maxcoord2) {
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
    if(__3D) {
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);      


        // liberamos
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

function dibujarEscena() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, 0.0, -40.0]);
    mat4.rotate(mvMatrix, degToRad(3.4), [1, 0, -1]);
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


/*function makeTexture() {


    //init_variables();

    if (scenePositionBuffer == null || sceneNormalBuffer == null || sceneTextureCoordBuffer == null || sceneIndexBuffer == null) {
        alert(scenePositionBuffer + sceneNormalBuffer + sceneTextureCoordBuffer + sceneIndexBuffer + "Uno de los buffers no esta bien inicializado");
        return;
    }


    d = new Date();
    t1 = d.getTime();
    mover();

    var d2 = new Date();
    var t2 = d2.getTime();

    $('tiempoIt').innerHTML = Math.abs(t2-t1)/1000 ;
    $('promedioIt').innerHTML = Math.abs(t2-t1)/(1000*TIEMPO) ;


    $('iteracion').innerHTML = it+1;
    $('contorno').innerHTML = largoCont;
    //$('contorno').innerHTML = cantFor;

    //dibujarParticulas();

    for(var i = 0; i < maxcoord2; i++)
        delete occupied[i];
    for(var i = 0; i < particles.length; i++) {
        var pi = particles[i];
        for(var j = 0; j < pi.t.length; j++)
            delete pi.t[j];    
        delete particles[i];
    }

}*/

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        sceneAngle += 0.04 * elapsed;
    }
    lastTime = timeNow;
}


function tick() {
        if(stop == 1) { // recalcular textura
            stop = 0;
            for(var i = 0; i < maxcoord2; i++)
                delete occupied[i];
            for(var i = 0; i < particles.length; i++) {
                var pi = particles[i];
                for(var j = 0; j < pi.t.length; j++)
                    delete pi.t[j];    
                delete particles[i];
            }
            init_variables();
        }

        if(animar) { 
            mover(); t++;

            if(t%30 == 0) {
                dibujarParticulas();
                if(__3D) { dibujarEscena(); animate(); } 
            }
            
            if(t < TIEMPO -1) requestAnimFrame(tick);

            var d2 = new Date();
            var t2 = d2.getTime();

            $('iteracion').innerHTML = t;
            $('contorno').innerHTML = largoCont;
            $('tiempoIt').innerHTML = Math.abs(t2-t1)/1000 ;
            $('promedioIt').innerHTML = Math.abs(t2-t1)/(1000*TIEMPO) ;
        }
}

function ocupada(i) {
    if(!occupied[i]) { return false;}
    var p = occupied[i].particle;
    return (p >= 0 && particles[p] && particles[p].cangrow);
}


function init_variables() {
    TIEMPO = $('tiempo').value;
    TIEMPO_VIDA = $('tiempoVida').value;
    distG = parseFloat($('distG').value);
    cantG = parseFloat($('cantG').value);
    c1 = [parseFloat($('c1r').value),parseFloat($('c1g').value),parseFloat($('c1b').value),
            parseFloat($('c1a').value)];
    c2 = [parseFloat($('c2r').value),parseFloat($('c2g').value),parseFloat($('c2b').value),
            parseFloat($('c2a').value)];

    varcolor = parseFloat($('varcolor').value);
    varparticlecolor = parseFloat($('varparticlecolor').value);

    t = 0;

    occupied = [];
    for(var i = 0; i < maxcoord; i++)
        for(var j = 0; j < maxcoord; j++)
            occupied[i+j*maxcoord] = new point(i,j,-1,0,0,0,0);

    generadores = [];
    for(var i = 0; i < cantG; i++)
        generadores.push({"x":aleat(maxcoord), "y": aleat(maxcoord)});

    init_particles();

    d = new Date();
    t1 = d.getTime();

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
    init_variables();

    //initBuffers();

    vectorAdd();
    return;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

}

// WEBCL

function detectCL() {
  // First check if the WebCL extension is installed at all
  
  if (window.WebCL == undefined) {
    alert("Unfortunately your system does not support WebCL. " +
          "Make sure that you have both the OpenCL driver " +
          "and the WebCL browser extension installed.");
    return false;
  }
  // Get a list of available CL platforms, and another list of the
  // available devices on each platform. If there are no platforms,
  // or no available devices on any platform, then we can conclude
  // that WebCL is not available.

  try {
    var platforms = WebCL.getPlatformIDs();
    var devices = [];
    for (var i in platforms) {
      var plat = platforms[i];
      devices[i] = plat.getDeviceIDs(WebCL.CL_DEVICE_TYPE_ALL);
    }
    alert("Excellent! Your system does support WebCL.");
  } catch (e) {
    alert("Unfortunately platform or device inquiry failed.");
  }
}

function loadKernel(id){
  var kernelElement = document.getElementById(id);
  var kernelSource = kernelElement.text;
  if (kernelElement.src != "") {
      var mHttpReq = new XMLHttpRequest();
      mHttpReq.open("GET", kernelElement.src, false);
      mHttpReq.send(null);
      kernelSource = mHttpReq.responseText;
  } 
  return kernelSource;
}

function vectorAdd () {

  // All output is written to element by id "output"
  var output = document.getElementById("output");
  var str = "";

  try {
  
    // First check if the WebCL extension is installed at all 
    if (window.WebCL == undefined) {
      alert("Unfortunately your system does not support WebCL. " +
            "Make sure that you have both the OpenCL driver " +
            "and the WebCL browser extension installed.");
      return false;
    }

    // Generate input vectors
    var vectorLength = 10;
    var vector1 = new Int32Array(vectorLength);    
    var vector2 = new Int32Array(vectorLength);
    for ( var i=0; i<vectorLength;  i++) {
      vector1[i] = aleat(100); //Random number 0..99
      vector2[i] = aleat(100); //Random number 0..99
    }
    
    str += "<br>Vector length = " + vectorLength;
    // Setup WebCL context using the default device of the first platform 
    var platforms = WebCL.getPlatformIDs();
    var ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, 
                                            platforms[0]],
                                           WebCL.CL_DEVICE_TYPE_DEFAULT);
                     
    // Reserve buffers
    var bufSize = vectorLength * 4; // size in bytes
    str += "<br>Buffer size: " + bufSize + " bytes";
    var bufIn1 = ctx.createBuffer (WebCL.CL_MEM_READ_ONLY, bufSize);
    var bufIn2 = ctx.createBuffer (WebCL.CL_MEM_READ_ONLY, bufSize);
    var bufOut = ctx.createBuffer (WebCL.CL_MEM_WRITE_ONLY, bufSize);

// Create and build program for the first device
    var kernelSrc = loadKernel("clProgramVectorAdd");
    var program = ctx.createProgramWithSource(kernelSrc);
    var devices = ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);

    try {
      program.buildProgram ([devices[0]], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + program.getProgramBuildInfo (devices[0], 
                                            WebCL.CL_PROGRAM_BUILD_STATUS)
             + ":  " 
             + program.getProgramBuildInfo (devices[0], 
                                            WebCL.CL_PROGRAM_BUILD_LOG));
      throw e;
    }

    // Create kernel and set arguments
    var kernel = program.createKernel ("ckVectorAdd");
    kernel.setKernelArg (0, bufIn1);
    kernel.setKernelArg (1, bufIn2);    
    kernel.setKernelArg (2, bufOut);
    kernel.setKernelArg (3, vectorLength, WebCL.types.UINT);

 // Create command queue using the first available device
    var cmdQueue = ctx.createCommandQueue (devices[0], 0);
    
    // Write the buffer to OpenCL device memory
    var dataObject1 = WebCL.createDataObject ();
    dataObject1.allocate(bufSize);
    dataObject1.set (vector1);

    var dataObject2 = WebCL.createDataObject ();
    dataObject2.allocate(bufSize);                
    dataObject2.set (vector2);
    
    cmdQueue.enqueueWriteBuffer (bufIn1, false, 0, dataObject1.length, 
                                 dataObject1, []);
    cmdQueue.enqueueWriteBuffer (bufIn2, false, 0, dataObject2.length, 
                                 dataObject2, []);
 
    // Init ND-range
    var localWS = [8];
    var globalWS = [Math.ceil (vectorLength / localWS) * localWS];

    str += "<br>Global work item size: " + globalWS;
    str += "<br>Local work item size: " + localWS;
    
    // Execute (enqueue) kernel
    cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, [], 
                                  globalWS, localWS, []);

    // Read the result buffer from OpenCL device
    cmdQueue.enqueueReadBuffer (bufOut, false, 0, bufSize, dataObject1, []);    
    cmdQueue.finish (); //Finish all the operations

    outBuffer = new Int32Array(vectorLength);
    var utils = WebCL.getUtils ();
    utils.writeDataObjectToTypedArray (dataObject1, outBuffer);
    
    //Print input vectors and result vector
    str += "<br>Vector1 = "; 
    for (var i = 0; i < vectorLength; i = i + 1) {
      str += vector1[i] + ", ";
    }
    str += "<br>Vector2 = ";
    for (var i = 0; i < vectorLength; i = i + 1) {
      str += vector2[i] + ", ";
    }
    str += "<br>Result = ";
    for (var i = 0; i < vectorLength; i = i + 1) {
      str += outBuffer[i] + ", ";
    }

  } catch(e) {
    str += "<h3>ERROR:</h3><pre style=\"color:red;\">" + e.message + "</pre>";
    throw e;
  }

  alert(str);
}


