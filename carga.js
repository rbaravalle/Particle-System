// pasa los datos del archivo de entrada a un formato interno
function data(d) {
    this.luzX = d[0];
    this.luzY = d[1];
    this.luzZ = d[2];

    this.col1r = d[3];
    this.col1g = d[4];
    this.col1b = d[5];
    this.col1a = d[6];

    this.col1p = d[7];

    this.col2r = d[8];
    this.col2g = d[9];
    this.col2b = d[10];
    this.col2a = d[11];

    this.iter = d[12];
    this.cantPart = d[13];
    this.nPart = d[14];
    this.vcolor = d[15];
    this.vcolorPart = d[16];
    this.tVida = d[17];
    this.distG = d[18];
    this.cantG = d[19];
}

function cargarDatos(d) {
    return new data(d);
}
