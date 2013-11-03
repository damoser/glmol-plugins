(function ($, glmol) {
    if (!!!glmol.prototype.plugin.handlers) return;
    glmol.prototype.support = glmol.prototype.support || {};
    glmol.prototype.support.surface = typeof (glmol.prototype.generateMesh) != 'undefined';

    if (!glmol.prototype.support.surface) return;
    glmol.prototype.plugin = glmol.prototype.plugin || {}
    glmol.prototype.plugin.surface = true;

    glmol.prototype.generateMesh = function (group, atomlist, type, colorChanged, wireframe, wireframeLinewidth) {
        wireframe = wireframe || false;
        wireframeLinewidth = wireframeLinewidth || 1;
        colorChanged = colorChanged || false;
        if (this.surfaceGeo == undefined || this.meshType != type) {
            var atomsToShow = this.removeSolvents(atomlist);
            console.log(atomsToShow);
            var extent = this.getExtent(atomsToShow);
            var expandedExtent = [[extent[0][0] - 4, extent[0][1] - 4, extent[0][2] - 4],
                        [extent[1][0] + 4, extent[1][1] + 4, extent[1][2] + 4]]
            var extendedAtoms = this.removeSolvents(this.getAtomsWithin(this.getAllAtoms(), expandedExtent));
            console.log(extendedAtoms);
            this.meshType = type;
            var ps = new ProteinSurface();
            ps.initparm(expandedExtent, (type == 1) ? false : true);
            ps.fillvoxels(this.atoms, extendedAtoms);
            ps.buildboundary();
            if (type == 4 || type == 2) ps.fastdistancemap();
            if (type == 2) { ps.boundingatom(false); ps.fillvoxelswaals(this.atoms, extendedAtoms); }
            ps.marchingcube(type);
            ps.laplaciansmooth(1);
            this.surfaceGeo = ps.getModel(this.atoms, atomsToShow);
            ps = [];
        }
        if (this.surfaceGeo != undefined && colorChanged) {
            this.surfaceGeo = this.updateSurfaceColor();
        }
        var mat = new THREE.MeshLambertMaterial();
        mat.vertexColors = THREE.VertexColors;
        mat.wireframe = wireframe;
        mat.wireframeLinewidth = wireframeLinewidth;
        //   mat.opacity = 0.8;
        //   mat.transparent = true;
        var mesh = new THREE.Mesh(this.surfaceGeo, mat);
        mesh.doubleSided = true;
        group.add(mesh);
    };

    glmol.prototype.updateSurfaceColor = function () {
        var vertices = this.surfaceGeo.vertices;

        var geo = new THREE.Geometry();
        var faces = [];
        geo.faces = faces;
        geo.vertices = vertices;
        for (var i = 0; i < this.surfaceGeo.faces.length; i++) {
            var f = this.surfaceGeo.faces[i];
            var a = vertices[f.a].atomid, b = vertices[f.b].atomid, c = vertices[f.c].atomid;
            f.vertexColors = [new THREE.Color(this.atoms[a].color),
                              new THREE.Color(this.atoms[b].color),
                              new THREE.Color(this.atoms[c].color)];
            faces.push(f);
        }
        geo.computeFaceNormals(); geo.computeVertexNormals(false);
        return geo;   
    };

        
})(jQuery, GLmol)