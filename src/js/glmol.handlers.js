(function ($, glmol) {
    glmol.prototype.plugin = glmol.prototype.plugin || {};
    glmol.prototype.plugin.handlers = true;

    // Enable the passage of the 'this' object through the JavaScript timers

    var __nativeST__ = window.setTimeout, __nativeSI__ = window.setInterval;

    window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
        var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
        return __nativeST__(vCallback instanceof Function ? function () {
            vCallback.apply(oThis, aArgs);
        } : vCallback, nDelay);
    };

    $.support.webglModes = { 'YES': 2, 'MAYBE': 1, 'NO': 0 };
    $.support.webgl = (function ($) {
        var canvas = document.createElement('canvas');
        try { gl = canvas.getContext("webgl"); }
        catch (x) { gl = null; }

        if (gl === null) {
            try { gl = canvas.getContext("experimental-webgl"); experimental = true; }
            catch (x) { gl = null; }
        }

        if (gl) {
            return $.support.webglModes.YES;
        } else if ("WebGLRenderingContext" in window) {
            return $.support.webglModes.MAYBE;
        }
        return $.support.webglModes.NO;
    })($);


    // eventhandlers
    glmol.prototype.moleculeLoad = function (callbacks) {
        this._moleculeLoadCallbacks = this._moleculeLoadCallbacks || {};
        this._moleculeLoadCallbacks.before = this._moleculeLoadCallbacks.before || [];
        this._moleculeLoadCallbacks.after = this._moleculeLoadCallbacks.after || [];
        if (typeof (callbacks) === 'object') { // func given => new callback
            if ('before' in callbacks && typeof (callbacks.before) !== 'undefined') this._moleculeLoadCallbacks.before.push(callbacks.before);
            if ('after' in callbacks && typeof (callbacks.after) !== 'undefined') this._moleculeLoadCallbacks.after.push(callbacks.after);
        }
    };
    glmol.prototype._beforeMoleculeLoad = function () {
        if (typeof (this._moleculeLoadCallbacks) === 'undefined' || !('before' in this._moleculeLoadCallbacks)) return;
        for (var i = 0; i < this._moleculeLoadCallbacks.before.length; i++) {
            this._moleculeLoadCallbacks.before[i].apply(this);
        }
    };
    glmol.prototype._afterMoleculeLoad = function () {
        if (typeof (this._moleculeLoadCallbacks) === 'undefined' || !('after' in this._moleculeLoadCallbacks)) return;
        for (var i = 0; i < this._moleculeLoadCallbacks.after.length; i++) {
            this._moleculeLoadCallbacks.after[i].apply(this);
        }
    };

    glmol.prototype.colorChange = function (func) {
        this._colorChangeCallbacks = this._colorChangeCallbacks || [];
        if (typeof (func) !== 'undefined') { // func given => new callback
            this._colorChangeCallbacks.push(func);
        }
        else {
            for (var i = 0; i < this._colorChangeCallbacks.length; i++) {
                this._colorChangeCallbacks[i].apply(this);
            }
        }
    };

    var orig_load = GLmol.prototype.loadMolecule;
    GLmol.prototype.loadMolecule = function (repressZoom, callbacks) {
        this.isLoading = true;
        this.moleculeLoad(callbacks);
        this._beforeMoleculeLoad();
        orig_load.call(this, repressZoom);
        this.isLoading = false;
        this._afterMoleculeLoad();
    };

    var colorMethods = [
        "colorByAtom",
        "colorByStructure",
        "colorByChain",
        "colorByResidue",
        "colorByPolarity",
        "colorChainbow"
    ];

    $.each(colorMethods, function (i, el) {
        var method = el;
        var original_func = glmol.prototype[el];
        glmol.prototype[el] = function () {
            original_func.apply(this, arguments);
            this.colorChange();
        };
    });

    // overwrite colorByBFactor and catch rounding errors leading to wrong color range
    glmol.prototype.colorByBFactor = function (atomlist, colorSidechains) {
        var minB = 1000, maxB = -1000;

        for (var i in atomlist) {
            var atom = this.atoms[atomlist[i]]; if (atom === undefined) continue;

            if (atom.hetflag) continue;
            if (colorSidechains || atom.atom === 'CA' || atom.atom === 'O3\'') {
                if (minB > atom.b) minB = atom.b;
                if (maxB < atom.b) maxB = atom.b;
            }
        }

        var mid = (maxB + minB) / 2;

        var range = (maxB - minB) / 2;
        if (range < 0.01 && range > -0.01) return;
        for (var i in atomlist) {
            var atom = this.atoms[atomlist[i]]; if (atom === undefined) continue;

            if (atom.hetflag) continue;
            if (colorSidechains || atom.atom === 'CA' || atom.atom === 'O3\'') {
                var color = new TCo(0);
                if (atom.b < mid) {
                    color.setHSV(0.667, (atom.b === minB ? 1.0 : (mid - atom.b) / range), 1);
                }
                else {
                    color.setHSV(0, (atom.b === maxB ? 1.0 : (atom.b - mid) / range), 1);
                }
                atom.color = color.getHex();
            }
        }
        this.colorChange();
    };

    // Overwrite parsePDB2 to fix b-factor parsing wrong columns
    glmol.prototype.parsePDB2 = function (str) {
        var atoms = this.atoms;
        var protein = this.protein;
        var molID;

        var atoms_cnt = 0;
        lines = str.split("\n");
        for (var i = 0; i < lines.length; i++) {
            line = lines[i].replace(/^\s*/, ''); // remove indent
            var recordName = line.substr(0, 6);
            if (recordName == 'ATOM  ' || recordName == 'HETATM') {
                var atom, resn, chain, resi, x, y, z, hetflag, elem, serial, altLoc, b;
                altLoc = line.substr(16, 1);
                if (altLoc != ' ' && altLoc != 'A') continue; // FIXME: ad hoc
                serial = parseInt(line.substr(6, 5));
                atom = line.substr(12, 4).replace(/ /g, "");
                resn = line.substr(17, 3);
                chain = line.substr(21, 1);
                resi = parseInt(line.substr(22, 5));
                x = parseFloat(line.substr(30, 8));
                y = parseFloat(line.substr(38, 8));
                z = parseFloat(line.substr(46, 8));
                b = parseFloat(line.substr(61, 6));
                elem = line.substr(76, 2).replace(/ /g, "");
                if (elem == '') { // for some incorrect PDB files
                    elem = line.substr(12, 4).replace(/ /g, "");
                }
                if (line[0] == 'H') hetflag = true;
                else hetflag = false;
                atoms[serial] = {
                    'resn': resn, 'x': x, 'y': y, 'z': z, 'elem': elem,
                    'hetflag': hetflag, 'chain': chain, 'resi': resi, 'serial': serial, 'atom': atom,
                    'bonds': [], 'ss': 'c', 'color': 0xFFFFFF, 'bonds': [], 'bondOrder': [], 'b': b /*', altLoc': altLoc*/
                };
            } else if (recordName == 'SHEET ') {
                var startChain = line.substr(21, 1);
                var startResi = parseInt(line.substr(22, 4));
                var endChain = line.substr(32, 1);
                var endResi = parseInt(line.substr(33, 4));
                protein.sheet.push([startChain, startResi, endChain, endResi]);
            } else if (recordName == 'CONECT') {
                // MEMO: We don't have to parse SSBOND, LINK because both are also 
                // described in CONECT. But what about 2JYT???
                var from = parseInt(line.substr(6, 5));
                for (var j = 0; j < 4; j++) {
                    var to = parseInt(line.substr([11, 16, 21, 26][j], 5));
                    if (isNaN(to)) continue;
                    if (atoms[from] != undefined) {
                        atoms[from].bonds.push(to);
                        atoms[from].bondOrder.push(1);
                    }
                }
            } else if (recordName == 'HELIX ') {
                var startChain = line.substr(19, 1);
                var startResi = parseInt(line.substr(21, 4));
                var endChain = line.substr(31, 1);
                var endResi = parseInt(line.substr(33, 4));
                protein.helix.push([startChain, startResi, endChain, endResi]);
            } else if (recordName == 'CRYST1') {
                protein.a = parseFloat(line.substr(6, 9));
                protein.b = parseFloat(line.substr(15, 9));
                protein.c = parseFloat(line.substr(24, 9));
                protein.alpha = parseFloat(line.substr(33, 7));
                protein.beta = parseFloat(line.substr(40, 7));
                protein.gamma = parseFloat(line.substr(47, 7));
                protein.spacegroup = line.substr(55, 11);
                this.defineCell();
            } else if (recordName == 'REMARK') {
                var type = parseInt(line.substr(7, 3));
                if (type == 290 && line.substr(13, 5) == 'SMTRY') {
                    var n = parseInt(line[18]) - 1;
                    var m = parseInt(line.substr(21, 2));
                    if (protein.symMat[m] == undefined) protein.symMat[m] = new THREE.Matrix4().identity();
                    protein.symMat[m].elements[n] = parseFloat(line.substr(24, 9));
                    protein.symMat[m].elements[n + 4] = parseFloat(line.substr(34, 9));
                    protein.symMat[m].elements[n + 8] = parseFloat(line.substr(44, 9));
                    protein.symMat[m].elements[n + 12] = parseFloat(line.substr(54, 10));
                } else if (type == 350 && line.substr(13, 5) == 'BIOMT') {
                    var n = parseInt(line[18]) - 1;
                    var m = parseInt(line.substr(21, 2));
                    if (protein.biomtMatrices[m] == undefined) protein.biomtMatrices[m] = new THREE.Matrix4().identity();
                    protein.biomtMatrices[m].elements[n] = parseFloat(line.substr(24, 9));
                    protein.biomtMatrices[m].elements[n + 4] = parseFloat(line.substr(34, 9));
                    protein.biomtMatrices[m].elements[n + 8] = parseFloat(line.substr(44, 9));
                    protein.biomtMatrices[m].elements[n + 12] = parseFloat(line.substr(54, 10));
                } else if (type == 350 && line.substr(11, 11) == 'BIOMOLECULE') {
                    protein.biomtMatrices = []; protein.biomtChains = '';
                } else if (type == 350 && line.substr(34, 6) == 'CHAINS') {
                    protein.biomtChains += line.substr(41, 40);
                }
            } else if (recordName == 'HEADER') {
                protein.pdbID = line.substr(62, 4);
            } else if (recordName == 'TITLE ') {
                if (protein.title == undefined) protein.title = "";
                protein.title += line.substr(10, 70) + "\n"; // CHECK: why 60 is not enough???
            } else if (recordName == 'COMPND') {
                // TODO: Implement me!
            }
        }

        // Assign secondary structures 
        for (i = 0; i < atoms.length; i++) {
            atom = atoms[i]; if (atom == undefined) continue;

            var found = false;
            // MEMO: Can start chain and end chain differ?
            for (j = 0; j < protein.sheet.length; j++) {
                if (atom.chain != protein.sheet[j][0]) continue;
                if (atom.resi < protein.sheet[j][1]) continue;
                if (atom.resi > protein.sheet[j][3]) continue;
                atom.ss = 's';
                if (atom.resi == protein.sheet[j][1]) atom.ssbegin = true;
                if (atom.resi == protein.sheet[j][3]) atom.ssend = true;
            }
            for (j = 0; j < protein.helix.length; j++) {
                if (atom.chain != protein.helix[j][0]) continue;
                if (atom.resi < protein.helix[j][1]) continue;
                if (atom.resi > protein.helix[j][3]) continue;
                atom.ss = 'h';
                if (atom.resi == protein.helix[j][1]) atom.ssbegin = true;
                else if (atom.resi == protein.helix[j][3]) atom.ssend = true;
            }
        }
        protein.smallMolecule = false;
        return true;
    };

})(jQuery, GLmol);