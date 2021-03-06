var CANT_PARTICLES;
var CANT_NEW_PARTICLES;

var cantFor = 0;

var RANDOM = 0;

var maxz = 50;

var TIEMPO;
var ang;
var delta = 1;

var maxcoord = 400;
var maxcoord2 = maxcoord*maxcoord;
var maxcoord2Z = maxcoord2*maxz;
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

var sceneAngle = 180;
var lastTime = 0;
var stop = 0; // se hizo click, recalcular textura
var animar = true; // frenar/continuar la animacion
var distG;
var cantG; // cantidad de Generadores

var vivas;

var prob1; // probabilidad de que la particula tenga el color 1
var dirSelec; // direccion seleccionada por el usuario

var datos;
var archivo = "datos.txt";
var REFRESCO = 30;
var STEP = 1200; // Mayor step, menor espacio entre los puntos que dibujas las curvas
                 // (curvas menos punteadas)

var sembrado;
var muestreo; // establece el intervalo de muestreo de la funcion parametrica

// Arreglos de funciones parametricas
var fs = [function(x,y,xc,yc,radio,t) { // circulo
    return xc+radio*Math.cos(t);
},
function(x,y,xc,yc,radio,t) { return xc;}, // vertical
function(x,y,xc,yc,radio,t) { // elipse
    return xc+radio*Math.cos(t)
},
function(x,y,xc,yc,radio,t) { // horizontal
    return xc+t;
},
function(x,y,xc,yc,radio,t) { // random
    return xc+t;
},
function(x,y,xc,yc,radio,t) { // espiral
    return xc+radio*Math.cos(t)*t;
},
function(x,y,xc,yc,radio,t) { // x ^ 2
    return (t)+xc;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
},
function(x,y,xc,yc,radio,t) { // diagonal
    return xc + t;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
},
function(x,y,xc,yc,radio,t) { // diagonal 2
    return xc + t;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
} ];

var gs = [function(x,y,xc,yc,radio,t) { // circulo
    return yc+radio*Math.sin(t);
},
function(x,y,xc,yc,radio,t) { return yc+t;}, // vertical
function(x,y,xc,yc,radio,t) { // elipse
    return yc+radio*Math.sin(t);
},
function(x,y,xc,yc,radio,t) { // horizontal
    return yc;
},
function(x,y,xc,yc,radio,t) { // random
    return yc+t;
},
function(x,y,xc,yc,radio,t) { // espiral
    return yc+radio*Math.sin(t)*t;
},
function(x,y,xc,yc,radio,t) { // x^2
    //return  1/16*Math.sin(t*32)+yc;
    //return yc + 0.08*Math.pow(0.95,t)*(Math.sin(t))
    return yc + 1/8*(Math.sin(3*Math.PI*t)-1/2*Math.sin(15/2*Math.PI*t));
    //return yc + 0.03*Math.sin(10*Math.cos(10*t))//-6*(t-0.4)*(t-0.4);
},
function(x,y,xc,yc,radio,t) { // diagonal
    return yc + t;
},
function(x,y,xc,yc,radio,t) { // diagonal 2
    return yc - t;
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

function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
}

function onButtonDown(e)
{
    var pos = findPos(document.getElementById('canvas'));
    xPos = e.pageX - pos.x;
    yPos = e.pageY - pos.y;

    var gx = xPos;
    var gy = (document.getElementById('canvas').height-yPos);
    cantG++;
    generadores.push({'x':gx,'y':gy, 'z':aleat(maxz), 'dir': dirSelec});
   
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

    canvas.onmousedown=onButtonDown;
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
    shaderProgram.uBrdfUniform = gl.getUniformLocation(shaderProgram, "uBrdf");

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

function point(x,y,z,i,r,g,b,a,p) {
    this.x = x
    this.y = y
    this.z = z
    this.particle = i
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || 0;
}

function particle(x,y,z,i,tiempo, pr,pg,pb,pa, dir,cambia) {

    var c = aleat(generadores.length);
    var gx = generadores[c].x;
    var gy = generadores[c].y;
    var gz = generadores[c].z;
    
    //this.dir = RANDOM; 
    this.dir = generadores[c].dir; //aleat(7)
    /*if(this.dir > 4) this.dir = ESPIRAL;
    else {
        if(this.dir > 1) {
            this.dir = CIRCULO;
        }
        else { this.dir = POLINOMIO; }
    }*/
    this.fparam = fs[this.dir];
    this.gparam = gs[this.dir];

    
    this.xi = Math.floor(gx + distG*(Math.random()*2-1)*maxcoord);
    this.yi = Math.floor(gy + distG*(Math.random()*2-1)*maxcoord);
    this.zi = Math.floor(gz + distG*(Math.random()*2-1)*maxz);

    this.radioA = 0.02+Math.random()*0.2;
    this.radioB = 0.02+Math.random()*0.2;


    if(this.dir == CIRCULO) this.radioA = this.radioB;

    // la particula comienza en un punto de la "curva"
    if(this.dir != RANDOM) {
        this.initX = Math.floor(this.fparam(0,0,this.xi/maxcoord,
                                this.yi/maxcoord,this.radioA,0)*maxcoord);

        this.initY = Math.floor(this.gparam(0,0,this.xi/maxcoord,
                                this.yi/maxcoord,this.radioA,0)*maxcoord);

        x = this.initX;
        y = this.initY;
    } else {
        this.initX = x;
        this.initY = y;
    }
    this.initZ = z;

    var cf = [];
    var c = Math.random();

    if(c <= prob1*0.01)
    cf = c1; else  {cf = c2 }

    if(pr >= 0) {
        this.r =  pr;
        this.g =  pg;
        this.b =  pb;
        this.a =  pa;
    }
    else {
        this.r = cf[0];
        this.g = cf[1];
        this.b = cf[2];
        this.a = cf[3];
    }
    c = c*2-1;
    this.r += c*varcolor;
    this.g += c*varcolor;
    this.b += c*varcolor;

    this.i = i;

    //this.t = [];
    this.contorno = [];

    this.tiempoDeVida = tiempo || 200
    this.tActual = 0;

    this.cangrow = true; // crece?

    this.cambiaDir = cambia;
    this.tInit = t;

    this.add(x,y,z);
   
}

function s(t1,t2) {
    if(t1.dist < t2.dist) return -1; else { if(t1.dist == t2.dist) return 0; else return 1; }
}

function s2(t1,t2) {
    if(t1.peso < t2.peso) return 1; else { if(t1.peso == t2.peso) return 0; else return -1; }
}

particle.prototype.add = function(x,y,z) { 
    var r,g,b;
    var pos = x+y*maxcoord+z*maxcoord*maxz;

    // variacion de color por texel
    var difc = (Math.random()*2-1)*(varparticlecolor);
    var thisr = this.r + difc;
    var thisg = this.g + difc;
    var thisb = this.b + difc;

    if(!occupied[pos]) occupied[pos] = new point(x,y,z,this.i,thisr,thisg,thisb,this.a);

    // Alpha blending?
    var op = occupied[pos];
    var src_a = op.a;
    var alp = this.a*(1-src_a);

    a = src_a + alp;

    r = (op.r*src_a + thisr*alp)/a;
    g = (op.g*src_a + thisg*alp)/a;
    b = (op.b*src_a + thisb*alp)/a;


    var pos = x+y*maxcoord+z*maxcoord*maxz;
    occupied[pos].x = x;
    occupied[pos].y = y;
    occupied[pos].z = z;
    occupied[pos].particle = this.i;
    occupied[pos].r = r;
    occupied[pos].g = g;
    occupied[pos].b = b;
    occupied[pos].a = a;

    //this.t[this.t.length] = new point(x,y,this.i,r,g,b,a); 

    // texels en el contorno del punto agregado
    var vals = [
        {'x':x-1,"y":y+1,'z':z},
        {'x':x,"y":y+1,'z':z},
        {'x':x+1,"y":y+1,'z':z},
        {'x':x-1,"y":y,'z':z},
        {'x':x+1,"y":y,'z':z},
        {'x':x-1,"y":y-1,'z':z},
        {'x':x,"y":y-1,'z':z},
        {'x':x+1,"y":y-1,'z':z},

        {'x':x-1,"y":y+1,'z':z+1},
        {'x':x,"y":y+1,'z':z+1},
        {'x':x+1,"y":y+1,'z':z+1},
        {'x':x-1,"y":y,'z':z+1},
        {'x':x+1,"y":y,'z':z+1},
        {'x':x-1,"y":y-1,'z':z+1},
        {'x':x,"y":y-1,'z':z+1},
        {'x':x+1,"y":y-1,'z':z+1},

        {'x':x-1,"y":y+1,'z':z-1},
        {'x':x,"y":y+1,'z':z-1},
        {'x':x+1,"y":y+1,'z':z-1},
        {'x':x-1,"y":y,'z':z-1},
        {'x':x+1,"y":y,'z':z-1},
        {'x':x-1,"y":y-1,'z':z-1},
        {'x':x,"y":y-1,'z':z-1},
        {'x':x+1,"y":y-1,'z':z-1}
    ];

    this.fparam = fs[this.dir];
    this.gparam = gs[this.dir];

    if(this.dir != RANDOM) {

        var nx = x;
        var ny = y; // valores dummy
        var nz = z; // valores dummy
        var tn = t;
        var entro = 0;
        while( nx == x && ny == y && nz == z) {
            var alfa = (tn-this.tInit+1)/(muestreo);
            nx = Math.floor(
                    this.fparam(x/maxcoord,y/maxcoord,
                                this.xi/maxcoord,this.yi/maxcoord,this.radioA,alfa)*maxcoord),
            ny = Math.floor(
                    this.gparam(x/maxcoord,y/maxcoord,
                                this.xi/maxcoord,this.yi/maxcoord,this.radioB,alfa)*maxcoord),
            nz = z;
            tn++;
        }
        this.tInit -= tn - t;
        this.contorno.push(new point(nx, ny,nz,-1,r,g,b,0,-1)); 
    }
    else {
        var next = aleat(vals.length);
        var next2 = aleat(vals.length);
        var next4 = aleat(vals.length);
        while(next2 == next)
            next2 = aleat(vals.length);
        var next3 = aleat(vals.length);
        while(next3 == next2 || next3 == next2)
            next3 = aleat(vals.length);
        while(next4 == next3 || next4 == next2)
            next4 = aleat(vals.length);

        //if(vals[next].z != 0 ) alert(vals[next].z) 
        this.contorno.push(new point(vals[next].x,vals[next].y,vals[next].z,-1,r,g,b,0,-1));
        this.contorno.push(new point(vals[next2].x,vals[next2].y,vals[next2].z,-1,r,g,b,0,-1));
        this.contorno.push(new point(vals[next3].x,vals[next3].y,vals[next3].z,-1,r,g,b,0,-1));
        this.contorno.push(new point(vals[next4].x,vals[next4].y,vals[next4].z,-1,r,g,b,0,-1));
    }
};

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
        var nz = cont.z;

        this.contorno.splice(c,1);

        if(nx >= 0 && ny >= 0 && nz >= 0 && nx < maxcoord && ny < maxcoord && nz < maxz
 				&& !ocupada(nx+maxcoord*ny+maxcoord*maxz*nz)) {

                var oc = occupied[nx+maxcoord*ny+maxcoord*maxz*nz];
                if(oc) {
                    this.add(nx,ny,nz);
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

    particles = [];
    for(var i = 0; i < CANT_PARTICLES; i++) {
        var px = aleat(maxcoord);
        var py = aleat(maxcoord);
        var pz = aleat(maxz);
        while(ocupada(px+maxcoord*py+maxcoord*maxz*pz)) {
            px = aleat(maxcoord);
            py = aleat(maxcoord);
            pz = aleat(maxz);
        }
        if(px > 0 && py > 0 && pz > 0 && px < maxcoord && py < maxcoord && pz < maxz) {
            particles.push(new particle(px,py,pz,i,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        }
    }

}

particle.prototype.morir = function() {
    this.cangrow = false;
}

function actualizarValores() {
    TIEMPO = $('tiempo').value;
    TIEMPO_VIDA = $('tiempoVida').value;
    CANT_NEW_PARTICLES = $('cantnp').value;
    calcColors();

    muestreo = $('muestreo').value;
    sembrado = $('sembrado').value;
    distG = parseFloat($('distG').value);
    cantG = parseFloat($('cantG').value);
    prob1 = parseFloat($('c1p').value);
    dirSelec = $('dir').value;

    varcolor = parseFloat($('varcolor').value);
    varparticlecolor = parseFloat($('varparticlecolor').value);
    
}

// una iteracion del algoritmo
function mover() {

    

    // nuevas particulas
    var ult = particles.length;
    for(var i = 0; i < CANT_NEW_PARTICLES; i++) {
        var px = aleat(maxcoord);
        var py = aleat(maxcoord);
        var pz = aleat(maxz);
        while(ocupada(px+maxcoord*py+maxcoord*maxz*pz)) {
            px = aleat(maxcoord);
            py = aleat(maxcoord);
            pz = aleat(maxz);
        }
        if(px > 0 && py > 0 && pz > 0 && px < maxcoord && py < maxcoord && pz < maxz) {
            particles.push(new particle(px,py,pz,ult+i,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        }
    }

    largoCont = 0;
    for(var i = 0; i < particles.length - CANT_NEW_PARTICLES; i++) {
       var pi = particles[i];
       //if(pi.cangrow && pi.t.length > maxSize) pi.morir();
       if(pi.cangrow) {
           pi.grow();
           vivas++
       }
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

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [-0.0, -0.0, -1.5 , 0]); //-1.2162

    mat4.rotate(mvMatrix, degToRad(0.4), [1, 0, -1]);
    if(!ang) ang = 290;
    ang+=delta; 
    var a = ang%330;
    if(a == 0) { 
        delta*=-1;
    }
    a = ang%290;
    if(a == 0) { 
        delta*=-1;        
    }
    $('zeta').innerHTML = ang;
    mat4.rotate(mvMatrix, degToRad(ang), [0, 1, 0]);

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
    var brdf = $("brdfsel").value;
    gl.uniform1i(shaderProgram.uBrdfUniform, brdf);
    // /dummy


    while(j< maxcoord2Z) {
         var p = occupied[j];
         if(p) {

             vertices.push(p.x/(maxcoord),p.y/(maxcoord),p.z/maxcoord);

             colors.push(p.r,p.g,p.b,1.0);
             normals.push(0.0,0.0,1.0);
             cant++;
        }
        j++;
        if(cant > 780 || j >= maxcoord2Z) {
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

//    mat4.ortho(0,1,0,1,0,0.1,pMatrix);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, 0.0, -40.0]);
    mat4.rotate(mvMatrix, degToRad(3.4), [1, 0, -1]);
    mat4.rotate(mvMatrix, degToRad(sceneAngle), [0, 1, 0]);

/*    mat4.translate(mvMatrix, [20, -50, -160]);
    mat4.rotate(mvMatrix, degToRad(0.0), [1, 0, -1]);
    mat4.rotate(mvMatrix, degToRad(sceneAngle), [0, 1, 0]);*/

    var brdf = $("brdfsel").value;
    gl.uniform1i(shaderProgram.uBrdfUniform, brdf);

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
                /*var pi = particles[i];
                for(var j = 0; j < pi.t.length; j++)
                    delete pi.t[j];    */
                delete particles[i];
            }
            init_variables();
        }

        if(animar) { 
            vivas = 0;
            mover(); t++;

            if(t%REFRESCO == 0) {
                dibujarParticulas();
                if(__3D) { dibujarEscena(); animate(); } 
            }
            
            if(t < TIEMPO -1) requestAnimFrame(tick);

            var d2 = new Date();
            var t2 = d2.getTime();

            $('iteracion').innerHTML = t;
            $('contorno').innerHTML = largoCont;
            $('cantPart').innerHTML = vivas;
            $('tiempoIt').innerHTML = Math.abs(t2-t1)/1000 ;
            $('promedioIt').innerHTML = Math.abs(t2-t1)/(1000*TIEMPO) ;
        }
}

function ocupada(i) {
    if(!occupied[i]) { return false;}
    var p = occupied[i].particle;
    return (p >= 0 && particles[p] && particles[p].cangrow);
}

function cargar(arch) {
    // datos precargados
    new Ajax.Request(arch, {
      method: 'get',
      onSuccess: function(response) {
        datos = cargarDatos(response.responseText.split(' '));
        $('lightPositionX').value = datos.luzX;
        $('lightPositionY').value = datos.luzY;
        $('lightPositionZ').value = datos.luzZ;

        $('c1r').value = datos.col1r;
        $('c1g').value = datos.col1g;
        $('c1b').value = datos.col1b;
        $('c1a').value = datos.col1a;

        $('c1p').value = datos.col1p;

        $('c2r').value = datos.col2r;
        $('c2g').value = datos.col2g;
        $('c2b').value = datos.col2b;
        $('c2a').value = datos.col2a;

        $('tiempo').value = datos.iter;
        $('cantp').value = datos.cantPart;
        $('cantnp').value = datos.nPart;
        $('varcolor').value = datos.vcolor;
        $('varparticlecolor').value = datos.vcolorPart;
        $('tiempoVida').value = datos.tVida;
        $('distG').value = datos.distG;
        $('cantG').value = datos.cantG;

      }
    });
}

function calcColors() {
    var jscolor1 = $('color1')
    var jscolor2 = $('color2')

    c1 = [parseFloat(jscolor1.color.rgb[0]),parseFloat(jscolor1.color.rgb[1]),parseFloat(jscolor1.color.rgb[2]),parseFloat($('c1a').value)];
    c2 = [parseFloat(jscolor2.color.rgb[0]),parseFloat(jscolor2.color.rgb[1]),parseFloat(jscolor2.color.rgb[2]),parseFloat($('c2a').value)];
}


function init_variables() {

    actualizarValores();

    t = 0;
    vivas = 0;

    occupied = [];
    for(var i = 0; i < maxcoord; i++)
        for(var j = 0; j < maxcoord; j++)
            for(var k = 0; k < maxz; k++)
               occupied[i+j*maxcoord+k*maxcoord*maxz] = new point(i,j,k,-1,0,0,0,0);

    generadores = [];
    if(sembrado == 0) {
        var str = '';
        for(var i = 0; i < cantG; i++) {
            generadores.push({'x':aleat(maxcoord), 'y': aleat(maxcoord), 'z':aleat(maxz), 'dir': dirSelec}); 
        }

    }
    else {
        var step = maxcoord/(cantG);
        for(var i = 0; i <= maxcoord; i+=step)
            for(var j = 0; j <= maxcoord; j+=step) {
                for(var k = 0; k <= maxz; k+=maxz/cantG) {
                    generadores.push({'x':Math.floor(i), 'y': Math.floor(j),
                                      'z': Math.floor(k), 'dir': dirSelec});
                }
            }
    }

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

function handleLoadedScene(teapotData) {
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


function loadscene() {
    if(true) {
    new Ajax.Request('Teapot.json', {
      method: 'get',
      onSuccess: function(response) {
        handleLoadedScene(JSON.parse(response.responseText));
      }
    }); }
    else {
   new Ajax.Request('duck.dae', {
      method: 'get',
      onSuccess: readCOLLADA        
    }); }
}

function readCOLLADA(xml) {
    var root = xml.responseText;
    var myDiv = Element.extend(document.createElement("div"));
    myDiv.innerHTML = root;
    var geoms = myDiv.getElementsByTagName('geometry');

    // cycle through each geometry
    for(var g = 0; g < geoms.length; g++) {
        var meshes = geoms[g].getElementsByTagName('mesh');

        // cycle through each mesh
        for(var m = 0; m < meshes.length; m++) {
            var triangles = meshes[m].getElementsByTagName('triangles')[0];
            var idVertex; // id object in the xml which contains the normals
            var idNormal; // id object in the xml which contains the normals
            var idTexcoord; // id object in the xml which contains the texcoords
            var idPosition; // id object in the xml which contains the positions
            var normals, positions, texcoords; // strings containing the data
            var cnormals, cpositions, ctexcoords, ctriangs; // count parameters for each type of data
          
            var inputs = triangles.getElementsByTagName('input');
            
            // cycle through each input
            for(var inp = 0; inp < inputs.length; inp++) {
                var iactual = inputs[inp];
                var sourc = iactual.getAttribute('source');
                var semantic = iactual.getAttribute('semantic');

                if(semantic == 'VERTEX') { idVertex = sourc.replace(/#/g, ''); }
                if(semantic == 'NORMAL') { idNormal = sourc.replace(/#/g, ''); }
                if(semantic == 'TEXCOORD') { idTexcoord = sourc.replace(/#/g, ''); }

            }
           
            var vertices = meshes[m].getElementsByTagName('vertices')[0];

            // we are interested in vertex's positions
            // so we search in vertex's attributes looking for positions
            var attr = vertices.getElementsByTagName('input');

            for(var a = 0; a < attr.length; a++) {
                if(attr[a].getAttribute('semantic') == 'POSITION') { 
                    idPosition = attr[a].getAttribute('source').replace(/#/g, '');
                    break;
                }
            }


            var sources = meshes[m].getElementsByTagName('source');

            // cycle through each source
            for(var s = 0; s < sources.length; s++) {
                if(sources[s].getAttribute('id') == idNormal) {
                    var array = sources[s].next();
                    cnormals = array.getAttribute('count');
                    normals = array.innerHTML.split(' ');
                 }
                else if(sources[s].getAttribute('id') == idTexcoord) {
                    var array = sources[s].next();
                    ctexcoords = array.getAttribute('count');
                    texcoords = array.innerHTML.split(' ');
                }
                else if(sources[s].getAttribute('id') == idPosition) {
                    var array = sources[s].next();
                    cpositions = array.getAttribute('count');
                    positions = array.innerHTML.split(' ');
                }
            }
            
            var aNorm = triangles.getElementsByTagName('p')[0];
            var ctriangles = triangles.getAttribute('count');

            //var cant = aNorm.getAttribute('count');
            var triangs = aNorm.innerHTML.split(' ');

            var fpositions, fnormals, ftexcoords, findexs;
            // final variables
            // we loop over vertices defined by (vertex,normal,texcoord) in 'triangs'
            for(var i = 0; i < triangs.length; i+=3) {
                findexs += i/3 + ' ';

                var iposition = triangs[i];
                fpositions += positions[iposition*3] + ' ' 
                            + positions[iposition*3+1] + ' ' 
                            + positions[iposition*3+2] + ' ' ;

                var inormal = triangs[i+1];
                fnormals += normals[inormal*3] + ' ' 
                          + normals[inormal*3+1] + ' ' 
                          + normals[inormal*3+2] + ' ' ;

                var itcoord = triangs[i+2];
                ftexcoords += texcoords[itcoord*2] + ' '
                            + texcoords[itcoord*2+1] + ' ' ;
            }

            var sceneData = {'vertexNormals': fnormals.trim().split(' '),
                             'vertexPositions': fpositions.trim().split(' '),
                             "vertexTextureCoords" : ftexcoords.trim().split(' '),
                             'indices': findexs.trim().split(' ')};

            handleLoadedScene(sceneData);
            
        }
    }
}

//$('datos').files[0].fileName
function webGLStart() {
    var canvas = document.getElementById("canvas");
    loadscene();
    initGL(canvas);
    initTextureFramebuffer();
    initShaders();
    initTexture();
    init_variables();
    cargar(archivo);
    //initBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}


