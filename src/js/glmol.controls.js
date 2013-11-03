(function ($, glmol) {
    if (!!!glmol.prototype.plugin.handlers) return;
    glmol.prototype.plugin = glmol.prototype.plugin || {};
    glmol.prototype.plugin.controls = true;

    glmol.prototype.support = glmol.prototype.support || {};
    glmol.prototype.support.fileSave = (function () {
        try { return !!new Blob(); } catch (e) { return false; }
    })();


    var controls = {
        'zoom': {
            html: '<div class="glmol-control zoom" data-toggle="tooltip" data-placement="top"><i class="control-icon fa fa-zoom-in"></i></div>',
            position: 'bottom right',

            register: function (elem, glmol) {
                var cont = glmol.container;
                var icon = elem.children('.control-icon');
                // Click handler
                elem.click(function () {
                    if (icon.hasClass('fa-zoom-in')) {
                        cont.addClass('zoomed');
                        icon.removeClass('fa-zoom-in').addClass('fa-zoom-out');
                    } else {
                        cont.removeClass('zoomed');
                        icon.removeClass('fa-zoom-out').addClass('fa-zoom-in');
                    }
                    $(window).trigger('resize');
                });

                // tooltip handler
                elem.tooltip({
                    'title': function () {
                        return icon.hasClass('fa-zoom-in') ? 'Enlarge' : 'Shrink';
                    }
                });
            }
        },
        'fullscreen': {
            html: '<div class="glmol-control fullscreen" data-toggle="tooltip" data-placement="top"><i class="control-icon fa fa-fullscreen"></i></div>',
            position: 'bottom right',

            register: function (elem, glmol) {
                var cont = glmol.container;
                var icon = elem.children('.control-icon');
                // tooltip handler
                elem.tooltip({
                    'title': function () {
                        return icon.hasClass('fa-fullscreen') ? 'Go Fullscreen' : 'Leave Fullscreen';
                    }
                });

                // Click handler
                elem.click(function () {
                    cont.fullScreen({
                        'callback': function (isFullScreen) {
                            elem.tooltip('hide');
                            // try to find zoom control
                            var zoom = cont.children('.glmol-control-container').children().filter('.glmol-control.zoom').children('.control-icon');
                            if (isFullScreen) { // go fullscreen
                                
                                // save the original style and clear it
                                cont.attr('data-style', cont.attr('style'));
                                cont.attr('style', '');
                                icon.removeClass('fa-fullscreen').addClass('fa-resize-small');
                                if (zoom.length === 1) zoom.hide();
                            } else { // back to small
                                cont.attr('style', cont.attr('data-style'));
                                cont.attr('data-style', '');
                                icon.removeClass('fa-resize-small').addClass('fa-fullscreen');
                                if (zoom.length === 1) zoom.show();
                            }
                        }
                    });
                    $(window).trigger('resize');
                });

            }

        },
        'reset': {
            html: '<div class="glmol-control reset" data-toggle="tooltip" data-placement="top" title="Reset"><i class="control-icon fa fa-refresh"></i></div>',
            position: 'bottom right',

            register: function (elem, glmol) {
                var cont = glmol.container;
                var icon = elem.children('.control-icon');
                // Click handler
                elem.click(function () {
                    glmol.defineRepresentation();
                    glmol.zoomInto(glmol.getAllAtoms());
                    glmol.show();
                });

                // tooltip handler
                elem.tooltip();
            }
        },
        'screenshot': {
            html: '<div class="glmol-control screenshot" data-toggle="tooltip" data-placement="top" title="Take screenshot"><i class="control-icon fa fa-camera"></i></div>',
            position: 'bottom right',

            register: function (elem, glmol) {
                var cont = glmol.container;
                var icon = elem.children('.control-icon');
                // Click handler
                elem.click(function () {
                    glmol.show();
                    if (!!!glmol.support.fileSave) {
                        var imageURI = glmol.renderer.domElement.toDataURL("image/png");
                        window.open(imageURI);
                    }
                    else {
                        var fn = glmol.protein.pdbID+'.png';
                        glmol.renderer.domElement.toBlob(function (blob) {
                            saveAs(blob, fn);
                        });
                    }
                });

                // tooltip handler
                elem.tooltip();
            }
        },
        'settings': {
           // html: '<div class="glmol-control settings"  data-trigger="manual" data-toggle="tooltip" data-placement="top" title="Settings"><i class="control-icon fa fa-cog"></i></div>',
            /*jshint multistr: true */
            html: '\
                <div class="glmol-control settings" data-toggle="tooltip" data-trigger="manual" data-placement="top" title="Settings"> \
                    <div class="settings-icon dropup">\
                        <div class="dropdown">\
                            <a class="dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="#"><i class="control-icon fa fa-cog"></i></a>\
                            <ul class="dropdown-menu " role="menu">\
                                <li class="dropdown-submenu bottom-down">\
                                    <a tabindex="-1" href="#">Main chain as</a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="ribbon">Ribbon</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="thickribbon">Ribbon (thick)</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="strand">Strand</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="cylinder">Cylinder/Plate</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="ca">C&alpha;</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="mainchain" data-value="bonds">Bonds</a></li>\
                                        <li class="divider"></li>\
                                        <li><a tabindex="-1" href="#" data-setting="mainchain" data-value="hide" class="menuitem">Hide</a></li>\
                                    </ul>\
                                </li>\
                                <li class="dropdown-submenu bottom-down">\
                                    <a tabindex="-1" href="#">Nucleic acid bases as</a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="bases" data-value="sticks">Sticks</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="bases" data-value="lines">Lines</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="bases" data-value="poly">Polygons</a></li>\
                                        <li class="divider"></li>\
                                        <li><a tabindex="-1" href="#" data-setting="bases" data-value="hide" class="menuitem">Hide</a></li>\
                                    </ul>\
                                </li>\
                                <li class="dropdown-submenu  bottom-down">\
                                    <a tabindex="-1" href="#">Small molecules as</a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="nonbonded" data-value="sticks">Sticks</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="nonbonded" data-value="ball_stick">Ball & Stick</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="nonbonded" data-value="lines">Lines</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="nonbonded" data-value="spheres">Spheres</a></li>\
                                        <li class="divider"></li>\
                                        <li><a tabindex="-1" href="#" data-setting="nonbonded" data-value="hide" class="menuitem">Hide</a></li>\
                                    </ul>\
                                </li>\
                                <li class="dropdown-submenu  bottom-up">\
                                    <a tabindex="-1" href="#">Color by</a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="color" data-value="chainbow">Spectrum</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="color" data-value="chain">Chain</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="color" data-value="ss">Secondary structure</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="color" data-value="b">B factor</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="color" data-value="polarity">Polar/nonpolar</a></li>\
                                        <li class="divider"></li>\
                                        <li><a tabindex="-1" href="#" data-setting="color_sc" data-value="show" class="menuitem">Color Sidechains</a></li>\
                                    </ul>\
                                </li>\
                                <li class="dropdown-submenu  bottom-up experimental-surface">\
                                    <a tabindex="-1" href="#"><i class="fa fa-warning-sign"></i> Surface (exp.) </a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="surface" data-value="sas">Solvent accessible</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="surface" data-value="ses">Solvent excluded</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="surface" data-value="ms">Molecular surface</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="surface" data-value="vdw">van der Waals</a></li>\
                                        <li class="divider"></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="surface_wf" data-value="show">as Wireframe</a></li>\
                                        <li><a tabindex="-1" href="#" data-setting="surface" data-value="hide" class="menuitem">Hide</a></li>\
                                    </ul>\
                                </li>\
                                <li><a tabindex="-1" href="#" class="menuitem" data-setting="sidechains" data-value="show">Show side chains</a></li>\
                                <li><a tabindex="-1" href="#" class="menuitem" data-setting="solvent" data-value="show">Show solvent/ions</a></li>\
                                <li class="dropdown-submenu  bottom-up">\
                                    <a tabindex="-1" href="#">Additional options</a>\
                                    <ul class="dropdown-menu" role="menu">\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="cell" data-value="show">Unit cell</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="biomt" data-value="show">Biological assembly</a></li>\
                                        <li><a tabindex="-1" href="#" class="menuitem" data-setting="packing" data-value="show">Crystal packing</a></li>\
                                        <li class="dropdown-submenu  bottom-up">\
                                            <a tabindex="-1" href="#">Background color</a>\
                                            <ul class="dropdown-menu spectrum" role="menu">\
                                                <li><a class="menuitem nocheck spectrum" data-setting="bgcolor"><input type="text" class="spectrum"/></a></li>\
                                            </ul>\
                                        </li>\
                                    </ul>\
                                </li>\
                                <li style="display: none"><a tabindex="-1" href="#" class="apply"><i class="fa fa-cogs fa-fixed-width"></i> Apply</a></li>\
                            </ul>\
                        </div>\
                    </div>',
                
            position: 'bottom left',

            register: function (elem, glmol, options) {
                var myOptions;
                if (typeof (options) !== 'undefined') {
                    myOptions = options.settings;
                }
                var _glmol = glmol;
                var settingsIcon = elem.children('.settings-icon');

                if (!!!glmol.plugin.surface) {
                    settingsIcon.find('li.experimental-surface').remove();
                }

                var icon = settingsIcon.find('.control-icon');
                var dropdownItems = settingsIcon.find('a.menuitem');
                var applyBtn = elem.children('.settings-icon').find('a.apply');
                // prepend settings box to container
                var leftright = elem.hasClass('left') ? 'left' : 'right';
                // create element
               // elem.append('<div class="glmol-control settings box tooltip-inner initial-hidden">settingsbox</div>');
                var settingsBox = elem.children('.box');
                if (elem.parent().hasClass('top')) {
                    // insert below top bar
                  //  elem.parent().after(settingsBox);
                    settingsBox.addClass('top');
                }
                else { // insert above bottom bar
               //     elem.parent().before(settingsBox);
                    settingsBox.addClass('bottom');
                }
                settingsIcon.children('.dropdown-toggle').dropdown();
                settingsBox.addClass(leftright);

                // spectrum color picker
                settingsIcon.find('input.spectrum').spectrum({
                    color: "#ECC",
                    showInput: true,
                    flat: true,                   
                    change: function () {
                        $(this).blur();
                        applyBtn.click();
                    }                    
                });

                settingsIcon.find('.spectrum').hover(
                    function (event) {
                        settingsIcon.find('.dropdown-menu').addClass('noopacity');
                    },
                    function (event) {
                        settingsIcon.find('.dropdown-menu').removeClass('noopacity');
                    }
                );
                // Event handlers
                icon.hover(
                    function () {
                        if (!settingsBox.hasClass('in')) {
                            elem.tooltip('show');
                        }
                    },
                    function () {
                        elem.tooltip('hide');
                    }
                );

                settingsIcon.find('.dropdown-menu a').click(function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                });
               // $('.glmol-control .menuitem:not(.nocheck)').append('<i class="fa-fixed-width"></i>');
                dropdownItems.click(function (event) {
                    if(!$(this).hasClass('nocheck')) {
                        // clear check on all other controls with the same data-setting
                        var isChecked = $(this).hasClass('checked');
                        var ds = $(this).attr('data-setting');
                        var others = elem.children('.settings-icon').find('.menuitem.checked[data-setting="' + ds + '"]');
                        others.removeClass('checked').children('.fa-check').remove();
                        if (!isChecked) {
                            $(this).addClass('checked');
                            $(this).append('<i class="fa fa-check fa-fixed-width" style="padding-left: 1em"></i>');
                        } else {
                            $(this).removeClass('checked');
                            $(this).children('.fa-check').remove();
                        }
                    }                    
                    event.stopPropagation();
                    $(this).blur();
                    _glmol.indicator.show();
                    setTimeout.call(applyBtn, applyBtn.click, 30);
                });

                icon.click(function () {
                    elem.tooltip('hide');
                    if (settingsBox.hasClass('in')) {
                        settingsBox.removeClass('in');
                    } else {
                        settingsBox.addClass('in');
                    }
                });
                var applyFunc = (function (_elem, _glmol, _settings) {
                    var defaultSettings = {
                        'mainchain': 'ribbon',
                        'bases': 'lines',
                        'color': 'chainbow',
                        'color_sc': 'hide',
                        'sidechains': 'hide',
                        'solvent': 'hide',
                        'nonbonded': 'sticks',
                        'cell': 'hide',
                        'biomt': 'hide',
                        'packing': 'hide',
                        'bgcolor': '#000000',
                        'surface': 'hide',
                        'surface_wf': 'hide'
                    };

                    // merge
                    if (typeof (_settings) !== 'undefined') {
                        for (var attrname in _settings) { defaultSettings[attrname] = _settings[attrname]; }
                    }

                    // set checked on controls
                    for (var attrname in defaultSettings) {
                        _elem.children('.settings-icon').find('.menuitem[data-setting="' + attrname + '"][data-value="' + defaultSettings[attrname] + '"]').click();
                    }

                    // set bgcolor
                    _elem.children('.settings-icon').find('.menuitem[data-setting="bgcolor"] > input').spectrum('set', defaultSettings.bgcolor);
                    
                    return function (event) {
                        var _elem = elem;
                        var _glmol = glmol;
                        // get all checked buttons
                        var settings = {};
                        for (var attrname in defaultSettings) {
                            settings[attrname] = defaultSettings[attrname];
                        }

                        var checked = _elem.children('.settings-icon').find('.menuitem.checked');
                        checked.each(function () {
                            var k = $(this).attr('data-setting');
                            var v = $(this).attr('data-value');
                            if (settings[k] !== 'undefined') {
                                settings[k] = v;
                            }
                        });
                        settings.bgcolor = '0x' + _elem.children('.settings-icon').find('.menuitem[data-setting="bgcolor"] > input').spectrum('get').toHex();
                        function defineViewRep() {
                            var all = this.getAllAtoms();
                            var allHet = this.getHetatms(all);
                            var hetatm = this.removeSolvents(allHet);
                            // color

                            var colorSidechain = settings.color_sc === 'show';
                            if (colorSidechain) {
                                for (var i in all) {
                                    var atom = this.atoms[all[i]]; if (atom === undefined) continue;
                                    if (atom.hetflag) continue;
                                    atom.color = '0xAAAAAA'; // all carbon grey
                                }
                            } else {
                                this.colorByAtom(all, {});
                            }
                            switch (settings.color) {
                                case "ss":
                                    this.colorByStructure(all, 0xcc00cc, 0x00cccc, colorSidechain);
                                    break;
                                case "chain":
                                    this.colorByChain(all, colorSidechain);
                                    break;
                                case "chainbow":
                                    this.colorChainbow(all, colorSidechain);
                                    break;
                                case "b":
                                    this.colorByBFactor(all, colorSidechain);
                                    break;
                                case "polarity":
                                    break;
                            }
                            var asu = new THREE.Object3D();
                            // Mainchain
                            var doNotSmoothen = false;
                            switch (settings.mainchain) {
                                case 'ribbon':
                                    this.drawCartoon(asu, all, doNotSmoothen);
                                    this.drawCartoonNucleicAcid(asu, all);
                                    break;
                                case 'thickribbon':
                                    this.drawCartoon(asu, all, doNotSmoothen, this.thickness);
                                    this.drawCartoonNucleicAcid(asu, all, null, this.thickness);
                                    break;
                                case 'strand':
                                    this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen);
                                    this.drawStrandNucleicAcid(asu, all);
                                    break;
                                case 'cylinder':
                                    this.drawHelixAsCylinder(asu, all, 1.6);
                                    this.drawCartoonNucleicAcid(asu, all);
                                    break;
                                case 'ca':
                                    this.drawMainchainCurve(asu, all, this.curveWidth, 'CA', 1);
                                    this.drawMainchainCurve(asu, all, this.curveWidth, 'O3\'', 1);
                                    break;
                                case 'bonds':
                                    this.drawBondsAsLine(asu, all, this.lineWidth);
                                    break;
                            }

                            // Bases
                            switch (settings.bases) {
                                case 'sticks':
                                    this.drawNucleicAcidStick(this.modelGroup, all);
                                    break;
                                case 'lines':
                                    this.drawNucleicAcidLine(this.modelGroup, all);
                                    break;
                                case 'poly':
                                    this.drawNucleicAcidLadder(this.modelGroup, all);
                                    break;
                            }
                            // sidechains
                            if (settings.sidechains === 'show') {
                                this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);
                            }

                            // solvent
                            if (settings.solvent === 'show') {
                                var nonBonded = this.getNonbonded(allHet);
                                this.drawAsCross(this.modelGroup, nonBonded, 0.3, true);
                            }
                            // Nonbonded
                            switch (settings.nonbonded) {
                                case 'sticks':
                                    this.drawBondsAsStick(this.modelGroup, hetatm, this.cylinderRadius, this.cylinderRadius, true);
                                    break;
                                case 'ball_stick':
                                    this.drawBondsAsStick(this.modelGroup, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, false, 0.3);
                                    break;
                                case 'lines':
                                    this.drawBondsAsLine(this.modelGroup, hetatm, this.curveWidth);
                                    break;
                                case 'spheres':
                                    this.drawAtomsAsSphere(this.modelGroup, hetatm, this.sphereRadius);
                                    break;
                            }
                            // unit cell
                            if (settings.cell === 'show') {
                                this.drawUnitcell(this.modelGroup);
                            }
                            // biological assembly
                            if (settings.biomt === 'show') {
                                this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
                            }
                            // crystal packing
                            if (settings.packing === 'show') {
                                this.drawSymmetryMatesWithTranslation2(this.modelGroup, asu, this.protein.symMat);
                            }

                            // surface
                            if (!!glmol.plugin.surface) {
                                var surface_wf = settings.surface_wf === 'show';
                                var colorChanged = (this.colorMode !== settings.color) || (this.colorSideChain !== settings.color_sc);
                                switch (settings.surface) {
                                    case 'sas':
                                        this.generateMesh(this.modelGroup, all, 3, colorChanged, surface_wf);
                                        break;
                                    case 'ses':
                                        this.generateMesh(this.modelGroup, all, 2, colorChanged, surface_wf);
                                        break;
                                    case 'ms':
                                        this.generateMesh(this.modelGroup, all, 4, colorChanged, surface_wf);
                                        break;
                                    case 'vdw':
                                        this.generateMesh(this.modelGroup, all, 1, colorChanged, surface_wf);
                                        break;
                                }
                            }
                            this.setBackground(parseInt(settings.bgcolor, 16));
                            this.modelGroup.add(asu);
                            this.colorMode = settings.color;
                            this.colorSidechain = settings.color_sc;
                        }

                        _glmol.defineRepresentation = defineViewRep;
                        _glmol.rebuildScene();
                        _glmol.show();
                        event.stopPropagation();
                        $(this).blur();
                        glmol.indicator.hide();
                    };
                })(elem, glmol, myOptions);
                applyBtn.click(applyFunc);
                applyBtn.click();
            }
        },
    };

    function setControls(control, position, options) {
        var me = this;
        var glmol = $(this.container);
        var containers = glmol.children('.glmol-control-container');
        if (containers.length === 0) {
            // create containers
            glmol.append('<div class="glmol-control-container top"></div>');
            glmol.append('<div class="glmol-control-container bottom"></div>');
        }
        containers = glmol.children('.glmol-control-container');

        var cntrls = control.split(' ').filter(function(el) {
            return (typeof (controls[el]) !== 'undefined');
        });

        var positions = {
            top: {
                left: [],
                right: []
            },
            bottom: {
                left: [],
                right: []
            }
        };
        // only one control, try to use the position parameter
        if (cntrls.length === 1 && typeof(position) !== 'undefined') {
            p = position.split(' ');
            if (p.length === 2) {
                // assume vertical pos is at idx 1, horizontal at idx 2
                positions[p[0]][p[1]].push(control);
            }
        }
        else { // use default positions
            for (var i = 0; i < cntrls.length; i++) {
                c = controls[cntrls[i]];
                p = c.position.split(' ');
                positions[p[0]][p[1]].push(cntrls[i]);
            }
        }

        positions.top.right.reverse();
        positions.bottom.right.reverse();
        // top left
        $.each(positions, function (vertical, h) {
            $.each(h, function (horizontal) {
                if (this.length > 0) {
                    container = containers.filter('.' + vertical);
                    for (var i = 0; i < this.length; i++) {
                        if (containers.find('.glmol-control.' + this[i]).length === 0) {
                            control = controls[this[i]];
                            container.append(control.html);
                            elem = container.children().last();
                            elem.addClass(horizontal);
                            control.register(elem, me, options);
                        }
                    }
                }
            });
        });
        return this;
    }

    glmol.prototype.setControls = setControls;

    if (typeof (glmol.prototype.create) !== 'undefined') {
        var original_func = glmol.prototype.create;
        glmol.prototype.create = function (id, suppressAutoload) {
            if (!$('#' + id).hasClass('glmol')) $('#' + id).addClass('glmol');
            $('#' + id).append('<p class="message text-center"></p>');
            $('#' + id).append('<div class="indicator right"><i class="fa fa-spinner fa-2x fa-spin"></i></div>');
            this.viewerMessage = $('#' + id + ' p.message');
            this.indicator = $('#' + id + ' div.indicator');
            if ($.support.webgl === $.support.webglModes.YES) {
                this.moleculeLoad({
                    before: function () {
                        this.indicator.show();
                        this.viewerMessage.empty().html('Loading... <i class="fa fa-spinnerfa-spin"></i>').show();
                    },
                    after: function () {
                        this.viewerMessage.hide();
                        this.indicator.hide();
                    }
                });
                original_func.apply(this, [id, suppressAutoload]);
                this.viewerMessage.empty().html('Loading... <i class="fa fa-spinner fa-spin"></i>');
                this.indicator.show();
                var cntrls = $('#' + id).attr('data-controls');
                if (typeof (cntrls) !== 'undefined') {
                    this.setControls(cntrls);
                }
                this.ready = true;
            } else {             
                this.ready = false;
                $('#' + id).css('background-color', '#000');
                if ($.support.webgl === $.support.webglModes.NO) {
                    this.viewerMessage.empty().html('<p class="text-center" data-toggle="tooltip" data-placement="bottom" title="Please make sure WebGL is activated in your web browser. Latest versions of Chrome (8.0 and higher), Firefox (4.0 and higher) and Opera (15.0 and higher) are supporting WebGL by default. In case you are using Safari (5.1 and higher) please activate WebGL under the menu item \'developer\'. Internet Explorer does not support WebGL"><i class="fa fa-warning-sign"></i> Sorry, your browser does not support WebGL. <br /><i class="fa fa-info"></i></p>');
                } else if ($.support.webgl === $.support.webglModes.MAYBE) {
                    this.viewerMessage.empty().html('<p class="text-center" data-toggle="tooltip" data-placement="bottom" title="Your Browser seems to support WebGL. However, it is disabled or unavailable. Please ensure that you are running the latest drivers for your video card and that you are not attempting to use your browser via Remote Desktop (RDP)"><i class="fa fa-warning-sign"></i> Sorry, your browser does not support WebGL. <br /><i class="fa fa-info"></i></p>');
                }
                this.viewerMessage.children('p').tooltip();
            }
        };
    }

}(jQuery, GLmol));