var CANT_PARTICLES;
var CANT_NEW_PARTICLES;
var cantFor = 0;
var RANDOM = 0;
var TIEMPO;
var maxcoord = 512;
var maxcoord2 = maxcoord*maxcoord;
var m1 = 1/maxcoord;
var largoCont;
var varcolor;
var varparticlecolor;
var c1, c2;
var occupied;
var t = 0;
var particles;
var sparticles; // arreglo binario con estado de cada particula (viva o muerta)
var cantPart; // cantidad total de particulas creadas

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
var REFRESCO;

var sembrado;
var muestreo; // establece el intervalo de muestreo de la funcion parametrica

var normals;

// Arreglos de funciones parametricas
var fs = [function(xc,yc,radio,t) { // circulo
    return xc+radio*Math.cos(t);
},
function(xc,yc,radio,t) { return xc;}, // vertical
function(xc,yc,radio,t) { // elipse
    return xc+radio*Math.cos(t);
},
function(xc,yc,radio,t) { // horizontal
    return xc+t;
},
function(xc,yc,radio,t) { // random
    return xc+t;
},
function(xc,yc,radio,t) { // espiral
    return xc+radio*Math.cos(t)*t;
},
function(xc,yc,radio,t) { // x ^ 2
    return (t)+xc;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
},
function(xc,yc,radio,t) { // diagonal
    return xc + t;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
},
function(xc,yc,radio,t) { // diagonal 2
    return xc + t;
    //return xc + 0.08*Math.pow(0.95,t)*(Math.cos(t))
} ];

var gs = [function(xc,yc,radio,t) { // circulo
    return yc+radio*Math.sin(t);
},
function(xc,yc,radio,t) { return yc+t;}, // vertical
function(xc,yc,radio,t) { // elipse
    return yc+radio*Math.sin(t);
},
function(xc,yc,radio,t) { // horizontal
    return yc;
},
function(xc,yc,radio,t) { // random
    return yc+t;
},
function(xc,yc,radio,t) { // espiral
    return yc+radio*Math.sin(t)*t;
},
function(xc,yc,radio,t) { // x^2
    //return yc + 0.08*Math.pow(0.95,t)*(Math.sin(t))
    return yc + 1/8*(Math.sin(3*Math.PI*t)-1/2*Math.sin(15/2*Math.PI*t));
    //return yc + 0.03*Math.sin(10*Math.cos(10*t))//-6*(t-0.4)*(t-0.4);
},
function(xc,yc,radio,t) { // diagonal
    return yc + t;
},
function(xc,yc,radio,t) { // diagonal 2
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
    generadores.push({'x':gx,'y':gy, 'dir': dirSelec});
   
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

function xy(x,y) {
    this.x = x
    this.y = y
}

function point(i,r,g,b,a,p) {
    this.particle = i
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || 0;
}

function particle(i,tiempo, pr,pg,pb,pa, dir,cambia) {
    var c = aleat(generadores.length);
    var gx = generadores[c].x;
    var gy = generadores[c].y;
    
    this.dir = generadores[c].dir;
    this.fparam = fs[this.dir];
    this.gparam = gs[this.dir];
    
    this.xi = Math.floor(gx + distG*(Math.random()*2-1)*maxcoord);
    this.yi = Math.floor(gy + distG*(Math.random()*2-1)*maxcoord);

    this.radioA = 0.02+Math.random()*0.1;
    this.radioB = 0.02+Math.random()*0.1;

    if(this.dir == CIRCULO) this.radioA = this.radioB;

    // la particula comienza en un punto de la "curva"
    var x = Math.floor(this.fparam(this.xi*m1,this.yi*m1,this.radioA,0)*maxcoord);
    var y = Math.floor(this.gparam(this.xi*m1,this.yi*m1,this.radioB,0)*maxcoord);

    var cf = [];
    var c = Math.random();

    if(c <= prob1*0.01) cf = c1; else cf = c2;

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

    this.tInit = t;

    this.add(x,y);
   
}

particle.prototype.add = function(x,y) { 
    var pos = x+y*maxcoord;
    if(!occupied[pos]) return;
    var r,g,b;

    // variacion de color por texel
    var difc = (Math.random()*2-1)*(varparticlecolor);
    var thisr = this.r + difc;
    var thisg = this.g + difc;
    var thisb = this.b + difc;

    // Alpha blending?
    var op = occupied[pos];
    var src_a = op.a;
    var alp = this.a*(1-src_a);

    a = src_a + alp;
    a1 = 1/a;
    r = (op.r*src_a + thisr*alp)*a1;
    g = (op.g*src_a + thisg*alp)*a1;
    b = (op.b*src_a + thisb*alp)*a1;

    var pos = x+y*maxcoord;

    occupied[pos].particle = this.i;
    occupied[pos].r = r;
    occupied[pos].g = g;
    occupied[pos].b = b;
    occupied[pos].a = a;

    //this.t[this.t.length] = new point(this.i,r,g,b,a); 

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

        var nx = x;
        var ny = y; // valores dummy
        var tn = t;
        var entro = 0;
        while( nx == x && ny == y) {
            var alfa = (tn-this.tInit+1)/(muestreo);
            nx = Math.floor(
                    this.fparam(this.xi*m1,this.yi*m1,this.radioA,alfa)*maxcoord),
            ny = Math.floor(
                    this.gparam(this.xi*m1,this.yi*m1,this.radioB,alfa)*maxcoord),
            tn++;
        }
        this.tInit -= tn - t;
        this.contorno.push(new xy(nx, ny)); 
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

        this.contorno.push(new xy(vals[next].x,vals[next].y));
        this.contorno.push(new xy(vals[next2].x,vals[next2].y));
        this.contorno.push(new xy(vals[next3].x,vals[next3].y));
        this.contorno.push(new xy(vals[next4].x,vals[next4].y));
    }
};

particle.prototype.grow = function() {
    this.tActual++;
    
    var maxim = this.contorno.length
    var h;
    for(h = 0; h < maxim; h++) {
        var cont = this.contorno[h];
        var nx = cont.x;
        var ny = cont.y;
        var pos = nx+ny*maxcoord;
        var o = occupied[nx+ny*maxcoord];

        if(o && !ocupada(pos)) {
            this.add(nx,ny);
            break;
        }
    }
    this.contorno.splice(0,h);

};  

function init_particles() {
    CANT_PARTICLES = parseFloat($('cantp').value);
    CANT_NEW_PARTICLES = parseFloat($('cantnp').value);
    particles = [];
    sparticles = [];
    cantPart = 0;
    for(var i = 0; i < CANT_PARTICLES; i++) {
        particles.push(new particle(i,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        sparticles.push(true); // la particula esta viva
    }
    cantPart += CANT_PARTICLES;
}

particle.prototype.morir = function() {
    sparticles[this.i] = false;
}

function actualizarValores() {
    TIEMPO = $('tiempo').value;
    TIEMPO_VIDA = $('tiempoVida').value;
    CANT_NEW_PARTICLES = $('cantnp').value;
    calcColors();

    muestreo = $('muestreo').value;
    sembrado = $('sembrado').value;
    distG = parseFloat($('distG').value);
    cantG = $('cantG').value;
    prob1 = parseFloat($('c1p').value);
    dirSelec = $('dir').value;

    varcolor = parseFloat($('varcolor').value);
    varparticlecolor = parseFloat($('varparticlecolor').value);
    REFRESCO = $('refresco').value;
    
}

// una iteracion del algoritmo
function mover() {

    largoCont = 0;
    var m = [];
    for(var i = 0; i < particles.length; i++) {
       var pi = particles[i];

       if(pi.tActual > pi.tiempoDeVida) { pi.morir(); m.push(i); }
       else { pi.grow(); largoCont += pi.contorno.length;}
    }

    for(var i = 0; i < m.length; i++)
        particles.splice(m[i],1);
    

    // nuevas particulas
    var ult = cantPart;
    for(var i = 0; i < CANT_NEW_PARTICLES; i++) {
        particles.push(new particle(ult+i,TIEMPO_VIDA,-1,-1,-1,0,-1,true));
        sparticles.push(true);
    }
    cantPart += CANT_NEW_PARTICLES;
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
    mat4.translate(mvMatrix, [-0.5, -0.5, -1.21]); //-1.2162

    gl.uniform1i(shaderProgram.useTexturesUniform, false);

    setMatrixUniforms();

    gl.uniform3f(
        shaderProgram.pointLightingLocationUniform,
        parseFloat(document.getElementById("lightPositionX").value),
        parseFloat(document.getElementById("lightPositionY").value),
        parseFloat(document.getElementById("lightPositionZ").value)
    );

    var j = 0;

    // dummy
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.uniform1i(shaderProgram.uBrdfUniform, 0);
    // /dummy

    var vertices = [];
    var colors = [];
    var cant = 0;

    triangleVertexPositionBuffer = gl.createBuffer();
  	triangleVertexColorBuffer = gl.createBuffer();
    triangleVertexNormalBuffer = gl.createBuffer();

    for(var j = 0; j < maxcoord2; j++) {
        if(occupied[j].particle > 0) {
            var p = occupied[j];
            var x = j%maxcoord;
            var y = Math.floor(j*m1);
            vertices.push(x*m1,y*m1,0.0);
            colors.push(p.r,p.g,p.b,1.0);
            cant++;

            if(cant > 512) {
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

                gl.drawArrays(gl.POINTS, 0, cant);

                cant = 0;
                vertices = [];
                colors = [];
            }
        }
    }


    //var colors = [];
        //var p = occupied[i];
        /*if(p) {
             //colors.push(p.r,p.g,p.b,1.0);
             //cant++;
        }
        else {
            colors.push(0.0,0.0,0.0,1.0);
        }*/
        /*
        var x = i%maxcoord;
        var y = Math.floor(i*m1);
        vertices.push(x*m1,y*m1,0.0);*/

    /*gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = maxcoord2;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
   	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
   	triangleVertexColorBuffer.numItems = maxcoord2;
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);*/

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    //gl.drawArrays(gl.POINTS, 0, cant);

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
            mover();
            t++;

            if(t%REFRESCO == 0 || t== TIEMPO-1) {
                dibujarParticulas();
                if(__3D) { dibujarEscena(); animate(); } 
            }
            
            if(t < TIEMPO -1 && particles.length > 0) requestAnimFrame(tick);

//            if(t==TIEMPO-1) {
                var d2 = new Date();
                var t2 = d2.getTime();
                $('iteracion').innerHTML = t;
                $('contorno').innerHTML = largoCont;
                $('cantPart').innerHTML = particles.length;
                $('tiempoIt').innerHTML = Math.abs(t2-t1)/1000 ;
                $('promedioIt').innerHTML = Math.abs(t2-t1)/1000*1/t ;
//            }
        }
}

function ocupada(i) {
    var o = occupied[i].particle;
    return (o >= 0 && sparticles[o]);
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
            occupied[i+j*maxcoord] = new point(-1,0,0,0,0);

    generadores = [];
    if(sembrado == 0) {
        for(var i = 0; i < cantG; i++)
            generadores.push({'x':aleat(maxcoord), 'y': aleat(maxcoord), 'dir': dirSelec});
    }
    else {
        var step = maxcoord/(cantG);
        for(var i = 0; i <= maxcoord; i+=step)
            for(var j = 0; j <= maxcoord; j+=step) {
                generadores.push({'x':Math.floor(i), 'y': Math.floor(j), 'dir': dirSelec});
            }
    }

    normals = [];
    for(var i = 0; i < maxcoord2; i++) {
        normals.push(0.0,0.0,0.1);
    }

    init_particles();

    d = new Date();
    t1 = d.getTime(); 

    tick(); 

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
        -1.0,  1.0,  1.0       
    ]
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
      0.0, 1.0
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sceneTextureCoordBuffer.itemSize = 2;
    sceneTextureCoordBuffer.numItems = 4;

    sceneIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3    // Front face
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    sceneIndexBuffer.itemSize = 1;
    sceneIndexBuffer.numItems = 6;

    sceneNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneNormalBuffer);
    var vertexNormals = [
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000,
         0.000000, 0.000000, 1.000000
    ]
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
    new Ajax.Request('Teapot.json', {
      method: 'get',
      onSuccess: function(response) {
        handleLoadedScene(JSON.parse(response.responseText));
      }
    });
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    loadscene();
    initGL(canvas);
    initTextureFramebuffer();
    initShaders();
    initTexture();
    cargar(archivo);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}


