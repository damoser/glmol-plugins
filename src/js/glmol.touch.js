(function ($, glmol) {
    if (!!!glmol.prototype.plugin.handlers) return;
    glmol.prototype.plugin = glmol.prototype.plugin || {};
    glmol.prototype.plugin.touch = true;

    glmol.prototype.enableTouch = function () {
        var me = this, glDOM = $(this.renderer.domElement)
        me.isDoubletap = false;
        me.isPinch = false;
        //me.container.append('<div id="gesture" style="color: white; position: absolute; left: 10px; bottom: 50px"></div>');
        glDOM.hammer({
            transform_always_block: true,
            transform_min_scale: 0.005,            
        });

        glDOM.on('touch doubletap pinchin pinchout', function (ev) {
            switch (ev.type) {
                case 'touch':
                    me.isPinch = false;
                    break;
                case 'doubletap':
                    me.isDoubletap = !me.isDoubletap;
                    break;
                case 'pinchin':
                    me.isPinch = true;
                    var scaleFactor = (me.rotationGroup.position.z - me.CAMERA_Z) * 0.85;
                    me.rotationGroup.position.z += scaleFactor * ev.gesture.scale / 10;
                    me.show();
                    break;
                case 'pinchout':
                    me.isPinch = true;
                    var scaleFactor = (me.rotationGroup.position.z - me.CAMERA_Z) * 0.85;
                    me.rotationGroup.position.z += scaleFactor * -ev.gesture.scale / 10;
                    me.show();
                    break;

            }
          //  $('#gesture').html("Pointer: " + ev.gesture.pointerType + "<br />Type: " + ev.type + "<br/>is Pinch: " + me.isPinch + "<br/>is Translate: " + me.isDoubletap);            
        });
    };
    glmol.prototype.enableMouse = function () {
        this.enableTouch();
        var me = this, glDOM = $(this.renderer.domElement);

        // TODO: Better touch panel support. 
        // Contribution is needed as I don't own any iOS or Android device with WebGL support.
        glDOM.bind('mousedown touchstart', function (ev) {
            ev.preventDefault();
            if (!me.scene) return;
            var x = ev.pageX, y = ev.pageY;
            if (ev.originalEvent.targetTouches && ev.originalEvent.targetTouches[0]) {
                x = ev.originalEvent.targetTouches[0].pageX;
                y = ev.originalEvent.targetTouches[0].pageY;
            }
            if (x == undefined) return;
            me.isDragging = true;
            me.mouseButton = ev.which;
            me.mouseStartX = x;
            me.mouseStartY = y;
            me.cq = me.rotationGroup.quaternion;
            me.cz = me.rotationGroup.position.z;
            me.currentModelPos = me.modelGroup.position.clone();
            me.cslabNear = me.slabNear;
            me.cslabFar = me.slabFar;
        });

        glDOM.bind('DOMMouseScroll mousewheel', function (ev) { // Zoom
            ev.preventDefault();
            if (!me.scene) return;
            var scaleFactor = (me.rotationGroup.position.z - me.CAMERA_Z) * 0.85;
            if (ev.originalEvent.detail) { // Webkit
                me.rotationGroup.position.z += scaleFactor * ev.originalEvent.detail / 10;
            } else if (ev.originalEvent.wheelDelta) { // Firefox
                me.rotationGroup.position.z -= scaleFactor * ev.originalEvent.wheelDelta / 400;
            }
            console.log(ev.originalEvent.wheelDelta, ev.originalEvent.detail, me.rotationGroup.position.z);
            me.show();
        });
        glDOM.bind("contextmenu", function (ev) { ev.preventDefault(); });
        $('body').bind('mouseup touchend', function (ev) {
            me.isDragging = false;
        });

        glDOM.bind('mousemove touchmove', function (ev) { // touchmove
            ev.preventDefault();
            if (!me.scene) return;
            if (!me.isDragging) return;
            var mode = 0;
            var modeRadio = $('input[name=' + me.id + '_mouseMode]:checked');
            if (modeRadio.length > 0) mode = parseInt(modeRadio.val());

            var x = ev.pageX, y = ev.pageY;
            if (ev.originalEvent.targetTouches && ev.originalEvent.targetTouches[0]) {
                x = ev.originalEvent.targetTouches[0].pageX;
                y = ev.originalEvent.targetTouches[0].pageY;
            }
            if (x == undefined) return;
            var dx = (x - me.mouseStartX) / me.WIDTH;
            var dy = (y - me.mouseStartY) / me.HEIGHT;
            var r = Math.sqrt(dx * dx + dy * dy);
            if (!me.isPinch) {
                if (mode == 3 || (me.mouseButton == 3 && ev.ctrlKey)) { // Slab
                    me.slabNear = me.cslabNear + dx * 100;
                    me.slabFar = me.cslabFar + dy * 100;
                } else if (mode == 2 || me.mouseButton == 3 || ev.shiftKey) { // Zoom
                    var scaleFactor = (me.rotationGroup.position.z - me.CAMERA_Z) * 0.85;
                    if (scaleFactor < 80) scaleFactor = 80;
                    me.rotationGroup.position.z = me.cz - dy * scaleFactor;
                } else if (me.isDoubletap || mode == 1 || me.mouseButton == 2 || ev.ctrlKey) { // Translate
                    var scaleFactor = (me.rotationGroup.position.z - me.CAMERA_Z) * 0.85;
                    if (scaleFactor < 20) scaleFactor = 20;
                    var translationByScreen = new TV3(-dx * scaleFactor, -dy * scaleFactor, 0);
                    var q = me.rotationGroup.quaternion;
                    var qinv = new THREE.Quaternion(q.x, q.y, q.z, q.w).inverse().normalize();
                    var translation = qinv.multiplyVector3(translationByScreen);
                    me.modelGroup.position.x = me.currentModelPos.x + translation.x;
                    me.modelGroup.position.y = me.currentModelPos.y + translation.y;
                    me.modelGroup.position.z = me.currentModelPos.z + translation.z;
                } else if ((mode == 0 || me.mouseButton == 1) && r != 0) { // Rotate
                    var rs = Math.sin(r * Math.PI) / r;
                    me.dq.x = Math.cos(r * Math.PI);
                    me.dq.y = 0;
                    me.dq.z = rs * dx;
                    me.dq.w = rs * dy;
                    me.rotationGroup.quaternion = new THREE.Quaternion(1, 0, 0, 0);
                    me.rotationGroup.quaternion.multiplySelf(me.dq);
                    me.rotationGroup.quaternion.multiplySelf(me.cq);
                }
                me.show();
            }
        });
    };

})(jQuery, GLmol);