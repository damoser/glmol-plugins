(function ($, glmol) {
    if (!!!glmol.prototype.plugin.handlers) return;
    glmol.prototype.plugin = glmol.prototype.plugin || {}
    glmol.prototype.plugin.sequence = true;

    String.prototype.repeat = function (num) {
        return new Array(num + 1).join(this);
    }

    /**
    *
    *  Javascript string pad
    *  http://www.webtoolkit.info/
    *
    **/

    window.STR_PAD_LEFT = 1;
    window.STR_PAD_RIGHT = 2;
    window.STR_PAD_BOTH = 3;

    String.prototype.pad = function (len, pad, dir) {
        var str = this;
        if (typeof (len) == "undefined") { var len = 0; }
        if (typeof (pad) == "undefined") { var pad = ' '; }
        if (typeof (dir) == "undefined") { var dir = STR_PAD_RIGHT; }

        if (len + 1 >= str.length) {

            switch (dir) {

                case STR_PAD_LEFT:
                    str = Array(len + 1 - str.length).join(pad) + str;
                    break;

                case STR_PAD_BOTH:
                    var right = Math.ceil((padlen = len - str.length) / 2);
                    var left = padlen - right;
                    str = Array(left + 1).join(pad) + str + Array(right + 1).join(pad);
                    break;

                default:
                    str = str + Array(len + 1 - str.length).join(pad);
                    break;

            } // switch

        }
        return str;
    }


    glmol.prototype.sequenceUpdated = function (func) {
        this._sequenceUpdateCallbacks = this._sequenceUpdateCallbacks || [];
        if (typeof (func) != 'undefined') { // func given => new callback
            this._sequenceUpdateCallbacks.push(func);
        }
        else {
            for (var i = 0; i < this._sequenceUpdateCallbacks.length; i++) {
                this._sequenceUpdateCallbacks[i].call(this);
            }
        }
    };

    glmol.prototype._isDarkColor = function(rgb) {
        var r = (rgb >> 16) & 0xff;  // extract red
        var g = (rgb >> 8) & 0xff;  // extract green
        var b = (rgb >> 0) & 0xff;  // extract blue
        var hsp = Math.sqrt( // HSP equation from http://alienryderflex.com/hsp.html
              0.299 * (r * r) +
              0.587 * (g * g) +
              0.114 * (b * b)
            );
        //return (hsp <= 127.5);
        return (hsp <= 137.5);
    }

    glmol.prototype._asCSSRgb = function(rgb) {
        var r = (rgb >> 16) & 0xff;  // extract red
        var g = (rgb >> 8) & 0xff;  // extract green
        var b = (rgb >> 0) & 0xff;  // extract blue
        return 'rgb('+r+','+g+','+b+')';

    }
    glmol.prototype._colorSequence = function () {
        if (this.isLoading)
            return;
        var residues = this._sequenceContainer.find('.res > span:not(.spacer)');
        var glmol = this;
        residues.each(function (i, elem) {
            var atm = $(elem).attr('data-refatm');
            var col = glmol.atoms[atm].color;

            $(elem).css('background-color', glmol._asCSSRgb(col));
            $(elem).removeClass('dark').removeClass('light').addClass(glmol._isDarkColor(col) ? 'dark' : 'light');
        });
    }

    glmol.prototype._updateSequence = function () {
        var aaDict = {
            'ALA': 'A',
            'ARG': 'R',
            'ASN': 'N',
            'ASP': 'D',
            'CYS': 'C',
            'GLU': 'E',
            'GLN': 'Q',
            'GLY': 'G',
            'HIS': 'H',
            'ILE': 'I',
            'LEU': 'L',
            'LYS': 'K',
            'MET': 'M',
            'PHE': 'F',
            'PRO': 'P',
            'SER': 'S',
            'THR': 'T',
            'TRP': 'W',
            'TYR': 'Y',
            'VAL': 'V'
        };
        // get sequence from glmol
        var residueSet = {};
        var all = this.getAllAtoms();
        all = this.removeSolvents(all);
        var hetatm = this.getHetatms(all);
        all = this.excludeAtoms(all, hetatm);
        
        var glmol = this;
        $.each(all, function (i, element) {
            var atom = glmol.atoms[element];
            if (typeof (atom) != 'undefined' && atom.atom == 'CA' && !atom.hetflag) {
                if (!(atom.chain in residueSet)) {
                    residueSet[atom.chain] = {};
                }
                if (!(atom.resi in residueSet[atom.chain])) {
                    residueSet[atom.chain][atom.resi] = { 'aa': aaDict[atom.resn], 'resi': atom.resi, 'refatm': atom.serial, 'chain': atom.chain };
                }
            }
        });        
        var keys = Object.keys(residueSet);
        keys.sort() // sort by chain
        glmol._sequenceContainer.empty();
        for (var i = 0; i < keys.length; i++) {

            var resSet = residueSet[keys[i]];
            var resKeys = Object.keys(resSet)
            resKeys.sort(function (a, b) { return a - b });

            var c = Math.ceil(resKeys.length / this._nBlocks);
            var cntr = 0;
            var row = 0;
            var line = '';
            glmol._sequenceContainer.append('<div class="chain panel panel-default"></div>');
            var chain = glmol._sequenceContainer.children('div.chain').last();
            chain.append('\
                <div class="panel-heading">\
                        <a class="accordion-toggle" data-toggle="collapse" href="#collapse' + keys[i] + '"><h4>Chain ' + keys[i] + '</h4></a>\
                </div>');
            chain.append('<div class="panel-collapse collapse'+ (i==0 ? ' in' : '') + '" id="collapse' + keys[i] + '"><div class="panel-body"></div></div>');
            cont = chain.find('.panel-body').last();
            var p = ' '.repeat(10);
            var headerLine = ''
            for (var j = 0; j < resKeys.length; j++) {
                var entry = resSet[resKeys[j]];
                if (cntr == 0) { // insert line starts
                    headerLine = '<pre class="res num">';
                    line = '<pre class="res">'
                }
                if ((cntr) % this._blockSize == 0) { // add new header entry on each new block
                    var c = parseInt(resSet[resKeys[j]].resi);
                    headerLine += (c + p).slice(0, this._blockSize - 1) + ' ';
                }

                line += '<span data-refatm="' + entry.refatm + '" data-resi="' + entry.resi + '" data-chain="' + entry.chain + '">' + entry.aa + '</span>';

                if ((cntr+1) % this._blockSize == 0) { // every 10th char insert a whitespace
                    line += '<span class="spacer"></span>'
                    headerLine += ' '
                }
                cntr++;
                if (cntr == (this._nBlocks * this._blockSize) || j == resKeys.length - 1) {// 6 blocks a 10 AAs 
                    line += '</pre>';
                    cntr = 0;
                    row++;
                    cont.append(headerLine);
                    cont.append(line);
                    line = '';
                }
            }
        }
        this._sequenceContainer.find('.res > span:not(.spacer)').click(function () {
            var res = glmol.getResiduesById(glmol.getAllAtoms(), [parseInt($(this).attr('data-resi'))]);
            glmol.zoomInto(res);
            glmol.drawBondsAsStick(glmol.modelGroup, res, glmol.cylinderRadius, glmol.cylinderRadius, true);
            glmol.show();
        }).tooltip({
            'title': function () {
                var a = glmol.atoms[parseInt($(this).attr('data-refatm'))];
                return a.resn + ' ' + a.resi + ': ' + a.b + ' %';
            },
            'animation': false,
            'container': 'body',
        });
        this._sequenceContainer.find('.panel-heading').first().append('\
                <a href="#" data-target="#" data-toggle="tooltip" data-placement="right" class="sequence-collapse">\
                    <i class="fa fa-caret-square-o-up fa-2x"></i>\
                </a>');

        var cont = this._sequenceContainer;
        this._sequenceContainer.find('a.sequence-collapse').tooltip({
            'title': function () {
                return $(this).children('i').hasClass('fa-caret-square-o-up') ? 'Collapse all' : 'Expand all';
            }
        }).click(function (ev) {
            var icon = $(this).children('i');
            $(this).tooltip('hide');
            if (icon.hasClass('fa-caret-square-o-up')) {
                icon.removeClass('fa-caret-square-o-up').addClass('fa-caret-square-o-down');
                cont.find('.panel-collapse.in').collapse('hide')
            } else {
                icon.removeClass('fa-caret-square-o-down').addClass('fa-caret-square-o-up');
                cont.find('.panel-collapse').collapse('show')
            }
            ev.stopPropagation();
            ev.preventDefault();
        });

        this._colorSequence();
        this._fitSequenceToSize();
        this.sequenceUpdated();
    }

    glmol.prototype._fitSequenceToSize = function () {
        var charWidth = this._sequenceContainer.find('.res > span.spacer').width();
        if (charWidth) {
            var totalChars = (this._nBlocks * this._blockSize + this._nBlocks - 2);
            var requiredWidth = totalChars * charWidth;
            var parentWidth = this._sequenceContainer.parent().width(); // new width of parent
            var accInn = this._sequenceContainer.find('.panel-body').first();
            var accPad = accInn.outerWidth(true) - accInn.width();
            parentWidth -= accPad;
            if (requiredWidth > parentWidth) { // smaller
                this._nBlocks--;
                this._updateSequence();
            } else if ((requiredWidth + (this._blockSize + 1) * charWidth) < parentWidth) { // bigger
                this._nBlocks++;
                this._updateSequence();
            }
        }
    }

    glmol.prototype.sequence = function (elem, nBlocks, blockSize) {
        if (typeof (elem) != 'undefined') {
            this._nBlocks = nBlocks || 6;
            this._blockSize = blockSize || 10;
            var e = '#' + elem;
            $(e).empty().append('<div class="sequence panel-group"></div>');            
            var me = $(e).children('div.sequence');
            this._sequenceContainer = me;
            this.moleculeLoad({ after: this._updateSequence });
            this.colorChange(this._colorSequence);
            if (!!this.plugin.controls) { // add reset button if glmol.controls available
                this.setControls('reset', 'bottom right');
            }
            var self = this;
            $(window).resize(function () { 
                self._fitSequenceToSize();
            });
            this._updateSequence();
        }
        return this;
    }
 
}(jQuery, GLmol));