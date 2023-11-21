var $ = jQuery;


// import {setLocaleData} from '@wordpress/i18n'
//
// setLocaleData({
//
// }, 'shypelyk')

/*!
	Zoom 1.7.21
	license: MIT
	http://www.jacklmoore.com/zoom
*/
(function ($) {
    var defaults = {
        url: false,
        callback: false,
        target: false,
        duration: 120,
        on: 'mouseover', // other options: grab, click, toggle
        touch: true, // enables a touch fallback
        onZoomIn: false,
        onZoomOut: false,
        magnify: 1.2
    };

    // Core Zoom Logic, independent of event listeners.
    $.zoom = function (target, source, img, magnify) {
        var targetHeight,
            targetWidth,
            sourceHeight,
            sourceWidth,
            xRatio,
            yRatio,
            offset,
            $target = $(target),
            position = $target.css('position'),
            $source = $(source);

        // The parent element needs positioning so that the zoomed element can be correctly positioned within.
        target.style.position = /(absolute|fixed)/.test(position) ? position : 'relative';
        target.style.overflow = 'hidden';
        img.style.width = img.style.height = '';

        $(img)
            .addClass('zoomImg')
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0,
                width: img.width * magnify,
                height: img.height * magnify,
                border: 'none',
                maxWidth: 'none',
                maxHeight: 'none'
            })
            .appendTo(target);

        return {
            init: function () {
                targetWidth = $target.outerWidth();
                targetHeight = $target.outerHeight();

                if (source === target) {
                    sourceWidth = targetWidth;
                    sourceHeight = targetHeight;
                } else {
                    sourceWidth = $source.outerWidth();
                    sourceHeight = $source.outerHeight();
                }

                xRatio = (img.width - targetWidth) / sourceWidth;
                yRatio = (img.height - targetHeight) / sourceHeight;

                offset = $source.offset();
            },
            move: function (e) {
                var left = (e.pageX - offset.left),
                    top = (e.pageY - offset.top);

                top = Math.max(Math.min(top, sourceHeight), 0);
                left = Math.max(Math.min(left, sourceWidth), 0);

                img.style.left = (left * -xRatio) + 'px';
                img.style.top = (top * -yRatio) + 'px';
            }
        };
    };

    $.fn.zoom = function (options) {
        return this.each(function () {
            var
                settings = $.extend({}, defaults, options || {}),
                //target will display the zoomed image
                target = settings.target && $(settings.target)[0] || this,
                //source will provide zoom location info (thumbnail)
                source = this,
                $source = $(source),
                img = document.createElement('img'),
                $img = $(img),
                mousemove = 'mousemove.zoom',
                clicked = false,
                touched = false;

            // If a url wasn't specified, look for an image element.
            if (!settings.url) {
                var srcElement = source.querySelector('img');
                if (srcElement) {
                    settings.url = srcElement.getAttribute('data-src') || srcElement.currentSrc || srcElement.src;
                }
                if (!settings.url) {
                    return;
                }
            }

            $source.one('zoom.destroy', function (position, overflow) {
                $source.off(".zoom");
                target.style.position = position;
                target.style.overflow = overflow;
                img.onload = null;
                $img.remove();
            }.bind(this, target.style.position, target.style.overflow));

            img.onload = function () {
                var zoom = $.zoom(target, source, img, settings.magnify);

                function start(e) {
                    zoom.init();
                    zoom.move(e);

                    // Skip the fade-in for IE8 and lower since it chokes on fading-in
                    // and changing position based on mousemovement at the same time.
                    $img.stop()
                        .fadeTo($.support.opacity ? settings.duration : 0, 1, $.isFunction(settings.onZoomIn) ? settings.onZoomIn.call(img) : false);
                }

                function stop() {
                    $img.stop()
                        .fadeTo(settings.duration, 0, $.isFunction(settings.onZoomOut) ? settings.onZoomOut.call(img) : false);
                }

                // Mouse events
                if (settings.on === 'grab') {
                    $source
                        .on('mousedown.zoom',
                            function (e) {
                                if (e.which === 1) {
                                    $(document).one('mouseup.zoom',
                                        function () {
                                            stop();

                                            $(document).off(mousemove, zoom.move);
                                        }
                                    );

                                    start(e);

                                    $(document).on(mousemove, zoom.move);

                                    e.preventDefault();
                                }
                            }
                        );
                } else if (settings.on === 'click') {
                    $source.on('click.zoom',
                        function (e) {
                            if (clicked) {
                                // bubble the event up to the document to trigger the unbind.
                                return;
                            } else {
                                clicked = true;
                                start(e);
                                $(document).on(mousemove, zoom.move);
                                $(document).one('click.zoom',
                                    function () {
                                        stop();
                                        clicked = false;
                                        $(document).off(mousemove, zoom.move);
                                    }
                                );
                                return false;
                            }
                        }
                    );
                } else if (settings.on === 'toggle') {
                    $source.on('click.zoom',
                        function (e) {
                            if (clicked) {
                                stop();
                            } else {
                                start(e);
                            }
                            clicked = !clicked;
                        }
                    );
                } else if (settings.on === 'mouseover') {
                    zoom.init(); // Preemptively call init because IE7 will fire the mousemove handler before the hover handler.

                    $source
                        .on('mouseenter.zoom', start)
                        .on('mouseleave.zoom', stop)
                        .on(mousemove, zoom.move);
                }

                // Touch fallback
                if (settings.touch) {
                    $source
                        .on('touchstart.zoom', function (e) {
                            e.preventDefault();
                            if (touched) {
                                touched = false;
                                stop();
                            } else {
                                touched = true;
                                start(e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]);
                            }
                        })
                        .on('touchmove.zoom', function (e) {
                            e.preventDefault();
                            zoom.move(e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]);
                        })
                        .on('touchend.zoom', function (e) {
                            e.preventDefault();
                            if (touched) {
                                touched = false;
                                stop();
                            }
                        });
                }

                if ($.isFunction(settings.callback)) {
                    settings.callback.call(img);
                }
            };

            img.setAttribute('role', 'presentation');
            img.alt = '';
            img.src = settings.url;
        });
    };

    $.fn.zoom.defaults = defaults;
}(window.jQuery));

/*!
 * OverlayScrollbars
 * https://github.com/KingSora/OverlayScrollbars
 *
 * Version: 1.13.0
 *
 * Copyright KingSora | Rene Haas.
 * https://github.com/KingSora
 *
 * Released under the MIT license.
 * Date: 02.08.2020
 */
!function (t, r) {
    "function" == typeof define && define.amd ? define(["jquery"], function (n) {
        return r(t, t.document, undefined, n)
    }) : "object" == typeof module && "object" == typeof module.exports ? module.exports = r(t, t.document, undefined, require("jquery")) : r(t, t.document, undefined, t.jQuery)
}("undefined" != typeof window ? window : this, function (vi, di, hi, n) {
    "use strict";
    var o, l, f, a, pi = "object", bi = "function", yi = "array", mi = "string", gi = "boolean", wi = "number",
        t = "null", xi = {
            c: "class",
            s: "style",
            i: "id",
            l: "length",
            p: "prototype",
            ti: "tabindex",
            oH: "offsetHeight",
            cH: "clientHeight",
            sH: "scrollHeight",
            oW: "offsetWidth",
            cW: "clientWidth",
            sW: "scrollWidth",
            hOP: "hasOwnProperty",
            bCR: "getBoundingClientRect"
        }, _i = (o = {}, l = {}, {
            e: f = ["-webkit-", "-moz-", "-o-", "-ms-"],
            o: a = ["WebKit", "Moz", "O", "MS"],
            u: function (n) {
                var t = l[n];
                if (l[xi.hOP](n)) return t;
                for (var r, e, i, o = c(n), a = di.createElement("div")[xi.s], u = 0; u < f.length; u++) for (i = f[u].replace(/-/g, ""), r = [n, f[u] + n, i + o, c(i) + o], e = 0; e < r[xi.l]; e++) if (a[r[e]] !== hi) {
                    t = r[e];
                    break
                }
                return l[n] = t
            },
            v: function (n, t, r) {
                var e = n + " " + t, i = l[e];
                if (l[xi.hOP](e)) return i;
                for (var o, a = di.createElement("div")[xi.s], u = t.split(" "), f = r || "", c = 0, s = -1; c < u[xi.l]; c++) for (; s < _i.e[xi.l]; s++) if (o = s < 0 ? u[c] : _i.e[s] + u[c], a.cssText = n + ":" + o + f, a[xi.l]) {
                    i = o;
                    break
                }
                return l[e] = i
            },
            d: function (n, t, r) {
                var e = 0, i = o[n];
                if (!o[xi.hOP](n)) {
                    for (i = vi[n]; e < a[xi.l]; e++) i = i || vi[(t ? a[e] : a[e].toLowerCase()) + c(n)];
                    o[n] = i
                }
                return i || r
            }
        });

    function c(n) {
        return n.charAt(0).toUpperCase() + n.slice(1)
    }

    var Si = {
        wW: e(r, 0, !0),
        wH: e(r, 0),
        mO: e(_i.d, 0, "MutationObserver", !0),
        rO: e(_i.d, 0, "ResizeObserver", !0),
        rAF: e(_i.d, 0, "requestAnimationFrame", !1, function (n) {
            return vi.setTimeout(n, 1e3 / 60)
        }),
        cAF: e(_i.d, 0, "cancelAnimationFrame", !1, function (n) {
            return vi.clearTimeout(n)
        }),
        now: function () {
            return Date.now && Date.now() || (new Date).getTime()
        },
        stpP: function (n) {
            n.stopPropagation ? n.stopPropagation() : n.cancelBubble = !0
        },
        prvD: function (n) {
            n.preventDefault && n.cancelable ? n.preventDefault() : n.returnValue = !1
        },
        page: function (n) {
            var t = ((n = n.originalEvent || n).target || n.srcElement || di).ownerDocument || di,
                r = t.documentElement, e = t.body;
            if (n.touches === hi) return !n.pageX && n.clientX && null != n.clientX ? {
                x: n.clientX + (r && r.scrollLeft || e && e.scrollLeft || 0) - (r && r.clientLeft || e && e.clientLeft || 0),
                y: n.clientY + (r && r.scrollTop || e && e.scrollTop || 0) - (r && r.clientTop || e && e.clientTop || 0)
            } : {x: n.pageX, y: n.pageY};
            var i = n.touches[0];
            return {x: i.pageX, y: i.pageY}
        },
        mBtn: function (n) {
            var t = n.button;
            return n.which || t === hi ? n.which : 1 & t ? 1 : 2 & t ? 3 : 4 & t ? 2 : 0
        },
        inA: function (n, t) {
            for (var r = 0; r < t[xi.l]; r++) try {
                if (t[r] === n) return r
            } catch (e) {
            }
            return -1
        },
        isA: function (n) {
            var t = Array.isArray;
            return t ? t(n) : this.type(n) == yi
        },
        type: function (n) {
            return n === hi || null === n ? n + "" : Object[xi.p].toString.call(n).replace(/^\[object (.+)\]$/, "$1").toLowerCase()
        },
        bind: e
    };

    function r(n) {
        return n ? vi.innerWidth || di.documentElement[xi.cW] || di.body[xi.cW] : vi.innerHeight || di.documentElement[xi.cH] || di.body[xi.cH]
    }

    function e(n, t) {
        if (typeof n != bi) throw "Can't bind function!";
        var r = xi.p, e = Array[r].slice.call(arguments, 2), i = function () {
        }, o = function () {
            return n.apply(this instanceof i ? this : t, e.concat(Array[r].slice.call(arguments)))
        };
        return n[r] && (i[r] = n[r]), o[r] = new i, o
    }

    var i, u, zi, s, v, L, N, d, h, p, b, y, m, g, Ti, Oi = Math, ki = n, Ci = (n.easing, n),
        Ai = (i = [], u = "__overlayScrollbars__", function (n, t) {
            var r = arguments[xi.l];
            if (r < 1) return i;
            if (t) n[u] = t, i.push(n); else {
                var e = Si.inA(n, i);
                if (-1 < e) {
                    if (!(1 < r)) return i[e][u];
                    delete n[u], i.splice(e, 1)
                }
            }
        }), w = (g = [], L = Si.type, y = {
            className: ["os-theme-dark", [t, mi]],
            resize: ["none", "n:none b:both h:horizontal v:vertical"],
            sizeAutoCapable: d = [!0, gi],
            clipAlways: d,
            normalizeRTL: d,
            paddingAbsolute: h = [!(N = [gi, wi, mi, yi, pi, bi, t]), gi],
            autoUpdate: [null, [t, gi]],
            autoUpdateInterval: [33, wi],
            updateOnLoad: [["img"], [mi, yi, t]],
            nativeScrollbarsOverlaid: {showNativeScrollbars: h, initialize: d},
            overflowBehavior: {
                x: ["scroll", b = "v-h:visible-hidden v-s:visible-scroll s:scroll h:hidden"],
                y: ["scroll", b]
            },
            scrollbars: {
                visibility: ["auto", "v:visible h:hidden a:auto"],
                autoHide: ["never", "n:never s:scroll l:leave m:move"],
                autoHideDelay: [800, wi],
                dragScrolling: d,
                clickScrolling: h,
                touchSupport: d,
                snapHandle: h
            },
            textarea: {dynWidth: h, dynHeight: h, inheritedAttrs: [["style", "class"], [mi, yi, t]]},
            callbacks: {
                onInitialized: p = [null, [t, bi]],
                onInitializationWithdrawn: p,
                onDestroyed: p,
                onScrollStart: p,
                onScroll: p,
                onScrollStop: p,
                onOverflowChanged: p,
                onOverflowAmountChanged: p,
                onDirectionChanged: p,
                onContentSizeChanged: p,
                onHostSizeChanged: p,
                onUpdated: p
            }
        }, Ti = {
            m: (m = function (i) {
                var o = function (n) {
                    var t, r, e;
                    for (t in n) n[xi.hOP](t) && (r = n[t], (e = L(r)) == yi ? n[t] = r[i ? 1 : 0] : e == pi && (n[t] = o(r)));
                    return n
                };
                return o(Ci.extend(!0, {}, y))
            })(), g: m(!0), _: function (n, t, C, r) {
                var e = {}, i = {}, o = Ci.extend(!0, {}, n), A = Ci.inArray, H = Ci.isEmptyObject,
                    R = function (n, t, r, e, i, o) {
                        for (var a in t) if (t[xi.hOP](a) && n[xi.hOP](a)) {
                            var u, f, c, s, l, v, d, h, p = !1, b = !1, y = t[a], m = L(y), g = m == pi,
                                w = Si.isA(y) ? y : [y], x = r[a], _ = n[a], S = L(_), z = o ? o + "." : "",
                                T = 'The option "' + z + a + "\" wasn't set, because", O = [], k = [];
                            if (x = x === hi ? {} : x, g && S == pi) e[a] = {}, i[a] = {}, R(_, y, x, e[a], i[a], z + a), Ci.each([n, e, i], function (n, t) {
                                H(t[a]) && delete t[a]
                            }); else if (!g) {
                                for (v = 0; v < w[xi.l]; v++) if (l = w[v], c = (m = L(l)) == mi && -1 === A(l, N)) for (O.push(mi), u = l.split(" "), k = k.concat(u), d = 0; d < u[xi.l]; d++) {
                                    for (s = (f = u[d].split(":"))[0], h = 0; h < f[xi.l]; h++) if (_ === f[h]) {
                                        p = !0;
                                        break
                                    }
                                    if (p) break
                                } else if (O.push(l), S === l) {
                                    p = !0;
                                    break
                                }
                                p ? ((b = _ !== x) && (e[a] = _), (c ? A(x, f) < 0 : b) && (i[a] = c ? s : _)) : C && console.warn(T + " it doesn't accept the type [ " + S.toUpperCase() + ' ] with the value of "' + _ + '".\r\nAccepted types are: [ ' + O.join(", ").toUpperCase() + " ]." + (0 < k[length] ? "\r\nValid strings are: [ " + k.join(", ").split(":").join(", ") + " ]." : "")), delete n[a]
                            }
                        }
                    };
                return R(o, t, r || {}, e, i), !H(o) && C && console.warn("The following options are discarded due to invalidity:\r\n" + vi.JSON.stringify(o, null, 2)), {
                    S: e,
                    z: i
                }
            }
        }, (zi = vi.OverlayScrollbars = function (n, r, e) {
            if (0 === arguments[xi.l]) return this;
            var i, t, o = [], a = Ci.isPlainObject(r);
            return n ? (n = n[xi.l] != hi ? n : [n[0] || n], x(), 0 < n[xi.l] && (a ? Ci.each(n, function (n, t) {
                (i = t) !== hi && o.push(z(i, r, e, s, v))
            }) : Ci.each(n, function (n, t) {
                i = Ai(t), ("!" === r && zi.valid(i) || Si.type(r) == bi && r(t, i) || r === hi) && o.push(i)
            }), t = 1 === o[xi.l] ? o[0] : o), t) : a || !r ? t : o
        }).globals = function () {
            x();
            var n = Ci.extend(!0, {}, s);
            return delete n.msie, n
        }, zi.defaultOptions = function (n) {
            x();
            var t = s.defaultOptions;
            if (n === hi) return Ci.extend(!0, {}, t);
            s.defaultOptions = Ci.extend(!0, {}, t, Ti._(n, Ti.g, !0, t).S)
        }, zi.valid = function (n) {
            return n instanceof zi && !n.getState().destroyed
        }, zi.extension = function (n, t, r) {
            var e = Si.type(n) == mi, i = arguments[xi.l], o = 0;
            if (i < 1 || !e) return Ci.extend(!0, {length: g[xi.l]}, g);
            if (e) if (Si.type(t) == bi) g.push({
                name: n,
                extensionFactory: t,
                defaultOptions: r
            }); else for (; o < g[xi.l]; o++) if (g[o].name === n) {
                if (!(1 < i)) return Ci.extend(!0, {}, g[o]);
                g.splice(o, 1)
            }
        }, zi);

    function x() {
        s = s || new _(Ti.m), v = v || new S(s)
    }

    function _(n) {
        var _ = this, i = "overflow", S = Ci("body"), z = Ci('<div id="os-dummy-scrollbar-size"><div></div></div>'),
            o = z[0], e = Ci(z.children("div").eq(0));
        S.append(z), z.hide().show();
        var t, r, a, u, f, c, s, l, v, d = T(o), h = {x: 0 === d.x, y: 0 === d.y},
            p = (r = vi.navigator.userAgent, u = "substring", f = r[a = "indexOf"]("MSIE "), c = r[a]("Trident/"), s = r[a]("Edge/"), l = r[a]("rv:"), v = parseInt, 0 < f ? t = v(r[u](f + 5, r[a](".", f)), 10) : 0 < c ? t = v(r[u](l + 3, r[a](".", l)), 10) : 0 < s && (t = v(r[u](s + 5, r[a](".", s)), 10)), t);

        function T(n) {
            return {x: n[xi.oH] - n[xi.cH], y: n[xi.oW] - n[xi.cW]}
        }

        Ci.extend(_, {
            defaultOptions: n,
            msie: p,
            autoUpdateLoop: !1,
            autoUpdateRecommended: !Si.mO(),
            nativeScrollbarSize: d,
            nativeScrollbarIsOverlaid: h,
            nativeScrollbarStyling: function () {
                var n = !1;
                z.addClass("os-viewport-native-scrollbars-invisible");
                try {
                    n = "none" === z.css("scrollbar-width") && (9 < p || !p) || "none" === vi.getComputedStyle(o, "::-webkit-scrollbar").getPropertyValue("display")
                } catch (t) {
                }
                return n
            }(),
            overlayScrollbarDummySize: {x: 30, y: 30},
            cssCalc: _i.v("width", "calc", "(1px)") || null,
            restrictedMeasuring: function () {
                z.css(i, "hidden");
                var n = o[xi.sW], t = o[xi.sH];
                z.css(i, "visible");
                var r = o[xi.sW], e = o[xi.sH];
                return n - r != 0 || t - e != 0
            }(),
            rtlScrollBehavior: function () {
                z.css({"overflow-y": "hidden", "overflow-x": "scroll", direction: "rtl"}).scrollLeft(0);
                var n = z.offset(), t = e.offset();
                z.scrollLeft(-999);
                var r = e.offset();
                return {i: n.left === t.left, n: t.left !== r.left}
            }(),
            supportTransform: !!_i.u("transform"),
            supportTransition: !!_i.u("transition"),
            supportPassiveEvents: function () {
                var n = !1;
                try {
                    vi.addEventListener("test", null, Object.defineProperty({}, "passive", {
                        get: function () {
                            n = !0
                        }
                    }))
                } catch (t) {
                }
                return n
            }(),
            supportResizeObserver: !!Si.rO(),
            supportMutationObserver: !!Si.mO()
        }), z.removeAttr(xi.s).remove(), function () {
            if (!h.x || !h.y) {
                var y = Oi.abs, m = Si.wW(), g = Si.wH(), w = x();
                Ci(vi).on("resize", function () {
                    if (0 < Ai().length) {
                        var n = Si.wW(), t = Si.wH(), r = n - m, e = t - g;
                        if (0 == r && 0 == e) return;
                        var i, o = Oi.round(n / (m / 100)), a = Oi.round(t / (g / 100)), u = y(r), f = y(e), c = y(o),
                            s = y(a), l = x(), v = 2 < u && 2 < f, d = !function b(n, t) {
                                var r = y(n), e = y(t);
                                return r !== e && r + 1 !== e && r - 1 !== e
                            }(c, s), h = v && d && (l !== w && 0 < w), p = _.nativeScrollbarSize;
                        h && (S.append(z), i = _.nativeScrollbarSize = T(z[0]), z.remove(), p.x === i.x && p.y === i.y || Ci.each(Ai(), function () {
                            Ai(this) && Ai(this).update("zoom")
                        })), m = n, g = t, w = l
                    }
                })
            }

            function x() {
                var n = vi.screen.deviceXDPI || 0, t = vi.screen.logicalXDPI || 1;
                return vi.devicePixelRatio || n / t
            }
        }()
    }

    function S(r) {
        var c, e = Ci.inArray, s = Si.now, l = "autoUpdate", v = xi.l, d = [], h = [], p = !1, b = 33, y = s(),
            m = function () {
                if (0 < d[v] && p) {
                    c = Si.rAF()(function () {
                        m()
                    });
                    var n, t, r, e, i, o, a = s(), u = a - y;
                    if (b < u) {
                        y = a - u % b, n = 33;
                        for (var f = 0; f < d[v]; f++) (t = d[f]) !== hi && (e = (r = t.options())[l], i = Oi.max(1, r.autoUpdateInterval), o = s(), (!0 === e || null === e) && o - h[f] > i && (t.update("auto"), h[f] = new Date(o += i)), n = Oi.max(1, Oi.min(n, i)));
                        b = n
                    }
                } else b = 33
            };
        this.add = function (n) {
            -1 === e(n, d) && (d.push(n), h.push(s()), 0 < d[v] && !p && (p = !0, r.autoUpdateLoop = p, m()))
        }, this.remove = function (n) {
            var t = e(n, d);
            -1 < t && (h.splice(t, 1), d.splice(t, 1), 0 === d[v] && p && (p = !1, r.autoUpdateLoop = p, c !== hi && (Si.cAF()(c), c = -1)))
        }
    }

    function z(r, n, t, xt, _t) {
        var cn = Si.type, sn = Ci.inArray, d = Ci.each, St = new zi, e = Ci[xi.p];
        if (dt(r)) {
            if (Ai(r)) {
                var i = Ai(r);
                return i.options(n), i
            }
            var zt, Tt, Ot, kt, I, Ct, At, Ht, j, ln, g, A, h, Rt, Lt, Nt, Wt, w, p, Dt, Mt, Et, It, jt, Ft, Pt, Ut, Vt,
                $t, o, a, qt, Bt, Xt, u, F, c, P, Yt, Kt, Gt, Jt, Qt, Zt, nr, tr, rr, er, ir, f, s, l, v, b, y, x, H,
                or, ar, ur, R, fr, cr, sr, lr, vr, dr, hr, pr, br, yr, mr, gr, wr, xr, _r, L, Sr, zr, Tr, Or, kr, Cr,
                Ar, Hr, m, _, Rr, Lr, Nr, Wr, Dr, Mr, Er, Ir, jr, Fr, Pr, Ur, Vr, $r, S, z, T, O, qr, Br, k, C, Xr, Yr,
                Kr, Gr, Jr, U, V, Qr, Zr, ne, te, re = {}, vn = {}, dn = {}, ee = {}, ie = {}, N = "-hidden",
                oe = "margin-", ae = "padding-", ue = "border-", fe = "top", ce = "right", se = "bottom", le = "left",
                ve = "min-", de = "max-", he = "width", pe = "height", be = "float", ye = "", me = "auto", hn = "sync",
                ge = "scroll", we = "100%", pn = "x", bn = "y", W = ".", xe = " ", D = "scrollbar", M = "-horizontal",
                E = "-vertical", _e = ge + "Left", Se = ge + "Top", $ = "mousedown touchstart",
                q = "mouseup touchend touchcancel", B = "mousemove touchmove", X = "mouseenter", Y = "mouseleave",
                K = "keydown", G = "keyup", J = "selectstart", Q = "transitionend webkitTransitionEnd oTransitionEnd",
                Z = "__overlayScrollbarsRO__", nn = "os-", tn = "os-html", rn = "os-host", en = rn + "-foreign",
                on = rn + "-textarea", an = rn + "-" + D + M + N, un = rn + "-" + D + E + N, fn = rn + "-transition",
                ze = rn + "-rtl", Te = rn + "-resize-disabled", Oe = rn + "-scrolling", ke = rn + "-overflow",
                Ce = (ke = rn + "-overflow") + "-x", Ae = ke + "-y", yn = "os-textarea", mn = yn + "-cover",
                gn = "os-padding", wn = "os-viewport", He = wn + "-native-scrollbars-invisible",
                xn = wn + "-native-scrollbars-overlaid", _n = "os-content", Re = "os-content-arrange",
                Le = "os-content-glue", Ne = "os-size-auto-observer", Sn = "os-resize-observer",
                zn = "os-resize-observer-item", Tn = zn + "-final", On = "os-text-inherit", kn = nn + D,
                Cn = kn + "-track", An = Cn + "-off", Hn = kn + "-handle", Rn = Hn + "-off", Ln = kn + "-unusable",
                Nn = kn + "-" + me + N, Wn = kn + "-corner", We = Wn + "-resize", De = We + "-both", Me = We + M,
                Ee = We + E, Dn = kn + M, Mn = kn + E, En = "os-dragging", Ie = "os-theme-none",
                In = [He, xn, An, Rn, Ln, Nn, We, De, Me, Ee, En].join(xe), jn = [], Fn = [xi.ti], Pn = {}, je = {},
                Fe = 42, Un = "load", Vn = [], $n = {}, qn = ["wrap", "cols", "rows"],
                Bn = [xi.i, xi.c, xi.s, "open"].concat(Fn), Xn = [];
            return St.sleep = function () {
                $t = !0
            }, St.update = function (n) {
                var t, r, e, i, o;
                if (!Lt) return cn(n) == mi ? n === me ? (t = function a() {
                    if (!$t && !qr) {
                        var r, e, i, o = [], n = [{T: Kt, O: Bn.concat(":visible")}, {T: Nt ? Yt : hi, O: qn}];
                        return d(n, function (n, t) {
                            (r = t.T) && d(t.O, function (n, t) {
                                e = ":" === t.charAt(0) ? r.is(t) : r.attr(t), i = $n[t], ui(e, i) && o.push(t), $n[t] = e
                            })
                        }), it(o), 0 < o[xi.l]
                    }
                }(), r = function f() {
                    if ($t) return !1;
                    var n, t, r, e, i = oi(), o = Nt && br && !jr ? Yt.val().length : 0, a = !qr && br && !Nt, u = {};
                    return a && (n = nr.css(be), u[be] = Vt ? ce : le, u[he] = me, nr.css(u)), e = {
                        w: i[xi.sW] + o,
                        h: i[xi.sH] + o
                    }, a && (u[be] = n, u[he] = we, nr.css(u)), t = qe(), r = ui(e, m), m = e, r || t
                }(), (e = t || r) && Xe({
                    k: r,
                    C: Rt ? hi : qt
                })) : n === hn ? qr ? (i = T(S.takeRecords()), o = O(z.takeRecords())) : i = St.update(me) : "zoom" === n && Xe({
                    A: !0,
                    k: !0
                }) : (n = $t || n, $t = !1, St.update(hn) && !n || Xe({H: n})), Ye(), e || i || o
            }, St.options = function (n, t) {
                var r, e = {};
                if (Ci.isEmptyObject(n) || !Ci.isPlainObject(n)) {
                    if (cn(n) != mi) return a;
                    if (!(1 < arguments.length)) return bt(a, n);
                    !function f(n, t, r) {
                        for (var e = t.split(W), i = e.length, o = 0, a = {}, u = a; o < i; o++) a = a[e[o]] = o + 1 < i ? {} : r;
                        Ci.extend(n, u, !0)
                    }(e, n, t), r = ot(e)
                } else r = ot(n);
                Ci.isEmptyObject(r) || Xe({C: r})
            }, St.destroy = function () {
                if (!Lt) {
                    for (var n in _t.remove(St), Ve(), Pe(Jt), Pe(Gt), Pn) St.removeExt(n);
                    for (; 0 < Xn[xi.l];) Xn.pop()();
                    $e(!0), rr && mt(rr), tr && mt(tr), Mt && mt(Gt), ft(!0), st(!0), at(!0);
                    for (var t = 0; t < Vn[xi.l]; t++) Ci(Vn[t]).off(Un, rt);
                    Vn = hi, $t = Lt = !0, Ai(r, 0), ti("onDestroyed")
                }
            }, St.scroll = function (n, t, r, e) {
                if (0 === arguments.length || n === hi) {
                    var i = Mr && Vt && Ot.i, o = Mr && Vt && Ot.n, a = vn.R, u = vn.L, f = vn.N;
                    return u = i ? 1 - u : u, a = i ? f - a : a, f *= o ? -1 : 1, {
                        position: {
                            x: a *= o ? -1 : 1,
                            y: dn.R
                        },
                        ratio: {x: u, y: dn.L},
                        max: {x: f, y: dn.N},
                        handleOffset: {x: vn.W, y: dn.W},
                        handleLength: {x: vn.D, y: dn.D},
                        handleLengthRatio: {x: vn.M, y: dn.M},
                        trackLength: {x: vn.I, y: dn.I},
                        snappedHandleOffset: {x: vn.j, y: dn.j},
                        isRTL: Vt,
                        isRTLNormalized: Mr
                    }
                }
                St.update(hn);
                var c, s, l, v, d, m, g, h, p, w = Mr, b = [pn, le, "l"], y = [bn, fe, "t"],
                    x = ["+=", "-=", "*=", "/="], _ = cn(t) == pi, S = _ ? t.complete : e, z = {}, T = {}, O = "begin",
                    k = "nearest", C = "never", A = "ifneeded", H = xi.l, R = [pn, bn, "xy", "yx"],
                    L = [O, "end", "center", k], N = ["always", C, A], W = n[xi.hOP]("el"), D = W ? n.el : n,
                    M = !!(D instanceof Ci || ki) && D instanceof ki, E = !M && dt(D), I = function () {
                        s && Qe(!0), l && Qe(!1)
                    }, j = cn(S) != bi ? hi : function () {
                        I(), S()
                    };

                function F(n, t) {
                    for (c = 0; c < t[H]; c++) if (n === t[c]) return 1
                }

                function P(n, t) {
                    var r = n ? b : y;
                    if (t = cn(t) == mi || cn(t) == wi ? [t, t] : t, Si.isA(t)) return n ? t[0] : t[1];
                    if (cn(t) == pi) for (c = 0; c < r[H]; c++) if (r[c] in t) return t[r[c]]
                }

                function U(n, t) {
                    var r, e, i, o, a = cn(t) == mi, u = n ? vn : dn, f = u.R, c = u.N, s = Vt && n,
                        l = s && Ot.n && !w, v = "replace", d = eval;
                    if ((e = a ? (2 < t[H] && (o = t.substr(0, 2), -1 < sn(o, x) && (r = o)), t = (t = r ? t.substr(2) : t)[v](/min/g, 0)[v](/</g, 0)[v](/max/g, (l ? "-" : ye) + we)[v](/>/g, (l ? "-" : ye) + we)[v](/px/g, ye)[v](/%/g, " * " + c * (s && Ot.n ? -1 : 1) / 100)[v](/vw/g, " * " + ee.w)[v](/vh/g, " * " + ee.h), ii(isNaN(t) ? ii(d(t), !0).toFixed() : t)) : t) !== hi && !isNaN(e) && cn(e) == wi) {
                        var h = w && s, p = f * (h && Ot.n ? -1 : 1), b = h && Ot.i, y = h && Ot.n;
                        switch (p = b ? c - p : p, r) {
                            case"+=":
                                i = p + e;
                                break;
                            case"-=":
                                i = p - e;
                                break;
                            case"*=":
                                i = p * e;
                                break;
                            case"/=":
                                i = p / e;
                                break;
                            default:
                                i = e
                        }
                        i = b ? c - i : i, i *= y ? -1 : 1, i = s && Ot.n ? Oi.min(0, Oi.max(c, i)) : Oi.max(0, Oi.min(c, i))
                    }
                    return i === f ? hi : i
                }

                function V(n, t, r, e) {
                    var i, o, a = [r, r], u = cn(n);
                    if (u == t) n = [n, n]; else if (u == yi) {
                        if (2 < (i = n[H]) || i < 1) n = a; else for (1 === i && (n[1] = r), c = 0; c < i; c++) if (o = n[c], cn(o) != t || !F(o, e)) {
                            n = a;
                            break
                        }
                    } else n = u == pi ? [n[pn] || r, n[bn] || r] : a;
                    return {x: n[0], y: n[1]}
                }

                function $(n) {
                    var t, r, e = [], i = [fe, ce, se, le];
                    for (c = 0; c < n[H] && c !== i[H]; c++) t = n[c], (r = cn(t)) == gi ? e.push(t ? ii(p.css(oe + i[c])) : 0) : e.push(r == wi ? t : 0);
                    return e
                }

                if (M || E) {
                    var q, B = W ? n.margin : 0, X = W ? n.axis : 0, Y = W ? n.scroll : 0, K = W ? n.block : 0,
                        G = [0, 0, 0, 0], J = cn(B);
                    if (0 < (p = M ? D : Ci(D))[H]) {
                        B = J == wi || J == gi ? $([B, B, B, B]) : J == yi ? 2 === (q = B[H]) ? $([B[0], B[1], B[0], B[1]]) : 4 <= q ? $(B) : G : J == pi ? $([B[fe], B[ce], B[se], B[le]]) : G, d = F(X, R) ? X : "xy", m = V(Y, mi, "always", N), g = V(K, mi, O, L), h = B;
                        var Q = vn.R, Z = dn.R, nn = Qt.offset(), tn = p.offset(),
                            rn = {x: m.x == C || d == bn, y: m.y == C || d == pn};
                        tn[fe] -= h[0], tn[le] -= h[3];
                        var en = {x: Oi.round(tn[le] - nn[le] + Q), y: Oi.round(tn[fe] - nn[fe] + Z)};
                        if (Vt && (Ot.n || Ot.i || (en.x = Oi.round(nn[le] - tn[le] + Q)), Ot.n && w && (en.x *= -1), Ot.i && w && (en.x = Oi.round(nn[le] - tn[le] + (vn.N - Q)))), g.x != O || g.y != O || m.x == A || m.y == A || Vt) {
                            var on = p[0], an = ln ? on[xi.bCR]() : {width: on[xi.oW], height: on[xi.oH]},
                                un = {w: an[he] + h[3] + h[1], h: an[pe] + h[0] + h[2]}, fn = function (n) {
                                    var t = ni(n), r = t.F, e = t.P, i = t.U, o = g[i] == (n && Vt ? O : "end"),
                                        a = "center" == g[i], u = g[i] == k, f = m[i] == C, c = m[i] == A, s = ee[r],
                                        l = nn[e], v = un[r], d = tn[e], h = a ? 2 : 1, p = d + v / 2, b = l + s / 2,
                                        y = v <= s && l <= d && d + v <= l + s;
                                    f ? rn[i] = !0 : rn[i] || ((u || c) && (rn[i] = c && y, o = v < s ? b < p : p < b), en[i] -= o || a ? (s / h - v / h) * (n && Vt && w ? -1 : 1) : 0)
                                };
                            fn(!0), fn(!1)
                        }
                        rn.y && delete en.y, rn.x && delete en.x, n = en
                    }
                }
                z[_e] = U(!0, P(!0, n)), z[Se] = U(!1, P(!1, n)), s = z[_e] !== hi, l = z[Se] !== hi, (s || l) && (0 < t || _) ? _ ? (t.complete = j, Zt.animate(z, t)) : (v = {
                    duration: t,
                    complete: j
                }, Si.isA(r) || Ci.isPlainObject(r) ? (T[_e] = r[0] || r.x, T[Se] = r[1] || r.y, v.specialEasing = T) : v.easing = r, Zt.animate(z, v)) : (s && Zt[_e](z[_e]), l && Zt[Se](z[Se]), I())
            }, St.scrollStop = function (n, t, r) {
                return Zt.stop(n, t, r), St
            }, St.getElements = function (n) {
                var t = {
                    target: or,
                    host: ar,
                    padding: fr,
                    viewport: cr,
                    content: sr,
                    scrollbarHorizontal: {scrollbar: f[0], track: s[0], handle: l[0]},
                    scrollbarVertical: {scrollbar: v[0], track: b[0], handle: y[0]},
                    scrollbarCorner: ir[0]
                };
                return cn(n) == mi ? bt(t, n) : t
            }, St.getState = function (n) {
                function t(n) {
                    if (!Ci.isPlainObject(n)) return n;
                    var r = fi({}, n), t = function (n, t) {
                        r[xi.hOP](n) && (r[t] = r[n], delete r[n])
                    };
                    return t("w", he), t("h", pe), delete r.c, r
                }

                var r = {
                    destroyed: !!t(Lt),
                    sleeping: !!t($t),
                    autoUpdate: t(!qr),
                    widthAuto: t(br),
                    heightAuto: t(yr),
                    padding: t(gr),
                    overflowAmount: t(kr),
                    hideOverflow: t(pr),
                    hasOverflow: t(hr),
                    contentScrollSize: t(vr),
                    viewportSize: t(ee),
                    hostSize: t(lr),
                    documentMixed: t(w)
                };
                return cn(n) == mi ? bt(r, n) : r
            }, St.ext = function (n) {
                var t, r = "added removed on contract".split(" "), e = 0;
                if (cn(n) == mi) {
                    if (Pn[xi.hOP](n)) for (t = fi({}, Pn[n]); e < r.length; e++) delete t[r[e]]
                } else for (e in t = {}, Pn) t[e] = fi({}, St.ext(e));
                return t
            }, St.addExt = function (n, t) {
                var r, e, i, o, a = zi.extension(n), u = !0;
                if (a) {
                    if (Pn[xi.hOP](n)) return St.ext(n);
                    if ((r = a.extensionFactory.call(St, fi({}, a.defaultOptions), Ci, Si)) && (i = r.contract, cn(i) == bi && (o = i(vi), u = cn(o) == gi ? o : u), u)) return e = (Pn[n] = r).added, cn(e) == bi && e(t), St.ext(n)
                } else console.warn('A extension with the name "' + n + "\" isn't registered.")
            }, St.removeExt = function (n) {
                var t, r = Pn[n];
                return !!r && (delete Pn[n], t = r.removed, cn(t) == bi && t(), !0)
            }, zi.valid(function wt(n, t, r) {
                var e, i;
                return o = xt.defaultOptions, Ct = xt.nativeScrollbarStyling, Ht = fi({}, xt.nativeScrollbarSize), zt = fi({}, xt.nativeScrollbarIsOverlaid), Tt = fi({}, xt.overlayScrollbarDummySize), Ot = fi({}, xt.rtlScrollBehavior), ot(fi({}, o, t)), At = xt.cssCalc, I = xt.msie, kt = xt.autoUpdateRecommended, j = xt.supportTransition, ln = xt.supportTransform, g = xt.supportPassiveEvents, A = xt.supportResizeObserver, h = xt.supportMutationObserver, xt.restrictedMeasuring, F = Ci(n.ownerDocument), H = F[0], u = Ci(H.defaultView || H.parentWindow), x = u[0], c = gt(F, "html"), P = gt(c, "body"), Yt = Ci(n), or = Yt[0], Nt = Yt.is("textarea"), Wt = Yt.is("body"), w = H !== di, p = Nt ? Yt.hasClass(yn) && Yt.parent().hasClass(_n) : Yt.hasClass(rn) && Yt.children(W + gn)[xi.l], zt.x && zt.y && !qt.nativeScrollbarsOverlaid.initialize ? (ti("onInitializationWithdrawn"), p && (at(!0), ft(!0), st(!0)), $t = Lt = !0) : (Wt && ((e = {}).l = Oi.max(Yt[_e](), c[_e](), u[_e]()), e.t = Oi.max(Yt[Se](), c[Se](), u[Se]()), i = function () {
                    Zt.removeAttr(xi.ti), Yn(Zt, $, i, !0, !0)
                }), at(), ft(), st(), ut(), ct(!0), ct(!1), function s() {
                    var r, t = x.top !== x, e = {}, i = {}, o = {};

                    function a(n) {
                        if (f(n)) {
                            var t = c(n), r = {};
                            (ne || Zr) && (r[he] = i.w + (t.x - e.x) * o.x), (te || Zr) && (r[pe] = i.h + (t.y - e.y) * o.y), Kt.css(r), Si.stpP(n)
                        } else u(n)
                    }

                    function u(n) {
                        var t = n !== hi;
                        Yn(F, [J, B, q], [tt, a, u], !0), si(P, En), ir.releaseCapture && ir.releaseCapture(), t && (r && Ue(), St.update(me)), r = !1
                    }

                    function f(n) {
                        var t = (n.originalEvent || n).touches !== hi;
                        return !$t && !Lt && (1 === Si.mBtn(n) || t)
                    }

                    function c(n) {
                        return I && t ? {x: n.screenX, y: n.screenY} : Si.page(n)
                    }

                    Kn(ir, $, function (n) {
                        f(n) && !Qr && (qr && (r = !0, Ve()), e = c(n), i.w = ar[xi.oW] - (Dt ? 0 : Et), i.h = ar[xi.oH] - (Dt ? 0 : It), o = vt(), Yn(F, [J, B, q], [tt, a, u]), ci(P, En), ir.setCapture && ir.setCapture(), Si.prvD(n), Si.stpP(n))
                    })
                }(), Gn(), Pe(Jt, Jn), Wt && (Zt[_e](e.l)[Se](e.t), di.activeElement == n && cr.focus && (Zt.attr(xi.ti, "-1"), cr.focus(), Yn(Zt, $, i, !1, !0))), St.update(me), Rt = !0, ti("onInitialized"), d(jn, function (n, t) {
                    ti(t.n, t.a)
                }), jn = [], cn(r) == mi && (r = [r]), Si.isA(r) ? d(r, function (n, t) {
                    St.addExt(t)
                }) : Ci.isPlainObject(r) && d(r, function (n, t) {
                    St.addExt(n, t)
                }), setTimeout(function () {
                    j && !Lt && ci(Kt, fn)
                }, 333)), St
            }(r, n, t)) && Ai(r, St), St
        }

        function Yn(n, t, r, e, i) {
            var o = Si.isA(t) && Si.isA(r), a = e ? "removeEventListener" : "addEventListener", u = e ? "off" : "on",
                f = !o && t.split(xe), c = 0, s = Ci.isPlainObject(i), l = g && (s ? i.V : i) || !1,
                v = s && (i.$ || !1), d = g ? {passive: l, capture: v} : v;
            if (o) for (; c < t[xi.l]; c++) Yn(n, t[c], r[c], e, i); else for (; c < f[xi.l]; c++) g ? n[0][a](f[c], r, d) : n[u](f[c], r)
        }

        function Kn(n, t, r, e) {
            Yn(n, t, r, !1, e), Xn.push(Si.bind(Yn, 0, n, t, r, !0, e))
        }

        function Pe(n, t) {
            if (n) {
                var r = Si.rO(), e = "animationstart mozAnimationStart webkitAnimationStart MSAnimationStart",
                    i = "childNodes", o = 3333333, a = function () {
                        n[Se](o)[_e](Vt ? Ot.n ? -o : Ot.i ? 0 : o : o), t()
                    };
                if (t) {
                    if (A) ((k = n.addClass("observed").append(ai(Sn)).contents()[0])[Z] = new r(a)).observe(k); else if (9 < I || !kt) {
                        n.prepend(ai(Sn, ai({c: zn, dir: "ltr"}, ai(zn, ai(Tn)) + ai(zn, ai({
                            c: Tn,
                            style: "width: 200%; height: 200%"
                        })))));
                        var u, f, c, s, l = n[0][i][0][i][0], v = Ci(l[i][1]), d = Ci(l[i][0]), h = Ci(d[0][i][0]),
                            p = l[xi.oW], b = l[xi.oH], y = xt.nativeScrollbarSize, m = function () {
                                d[_e](o)[Se](o), v[_e](o)[Se](o)
                            }, g = function () {
                                f = 0, u && (p = c, b = s, a())
                            }, w = function (n) {
                                return c = l[xi.oW], s = l[xi.oH], u = c != p || s != b, n && u && !f ? (Si.cAF()(f), f = Si.rAF()(g)) : n || g(), m(), n && (Si.prvD(n), Si.stpP(n)), !1
                            }, x = {}, _ = {};
                        ri(_, ye, [-2 * (y.y + 1), -2 * y.x, -2 * y.y, -2 * (y.x + 1)]), Ci(l).css(_), d.on(ge, w), v.on(ge, w), n.on(e, function () {
                            w(!1)
                        }), x[he] = o, x[pe] = o, h.css(x), m()
                    } else {
                        var S = H.attachEvent, z = I !== hi;
                        if (S) n.prepend(ai(Sn)), gt(n, W + Sn)[0].attachEvent("onresize", a); else {
                            var T = H.createElement(pi);
                            T.setAttribute(xi.ti, "-1"), T.setAttribute(xi.c, Sn), T.onload = function () {
                                var n = this.contentDocument.defaultView;
                                n.addEventListener("resize", a), n.document.documentElement.style.display = "none"
                            }, T.type = "text/html", z && n.prepend(T), T.data = "about:blank", z || n.prepend(T), n.on(e, a)
                        }
                    }
                    if (n[0] === R) {
                        var O = function () {
                            var n = Kt.css("direction"), t = {}, r = 0, e = !1;
                            return n !== L && (r = "ltr" === n ? (t[le] = 0, t[ce] = me, o) : (t[le] = me, t[ce] = 0, Ot.n ? -o : Ot.i ? 0 : o), Jt.children().eq(0).css(t), Jt[_e](r)[Se](o), L = n, e = !0), e
                        };
                        O(), Kn(n, ge, function (n) {
                            return O() && Xe(), Si.prvD(n), Si.stpP(n), !1
                        })
                    }
                } else if (A) {
                    var k, C = (k = n.contents()[0])[Z];
                    C && (C.disconnect(), delete k[Z])
                } else mt(n.children(W + Sn).eq(0))
            }
        }

        function Gn() {
            if (h) {
                var o, a, u, f, c, s, r, e, i, l, n = Si.mO(), v = Si.now();
                O = function (n) {
                    var t = !1;
                    return Rt && !$t && (d(n, function () {
                        return !(t = function o(n) {
                            var t = n.attributeName, r = n.target, e = n.type, i = "closest";
                            if (r === sr) return null === t;
                            if ("attributes" === e && (t === xi.c || t === xi.s) && !Nt) {
                                if (t === xi.c && Ci(r).hasClass(rn)) return et(n.oldValue, r.className);
                                if (typeof r[i] != bi) return !0;
                                if (null !== r[i](W + Sn) || null !== r[i](W + kn) || null !== r[i](W + Wn)) return !1
                            }
                            return !0
                        }(this))
                    }), t && (e = Si.now(), i = yr || br, l = function () {
                        Lt || (v = e, Nt && Be(), i ? Xe() : St.update(me))
                    }, clearTimeout(r), 11 < e - v || !i ? l() : r = setTimeout(l, 11))), t
                }, S = new n(T = function (n) {
                    var t, r = !1, e = !1, i = [];
                    return Rt && !$t && (d(n, function () {
                        o = (t = this).target, a = t.attributeName, u = a === xi.c, f = t.oldValue, c = o.className, p && u && !e && -1 < f.indexOf(en) && c.indexOf(en) < 0 && (s = lt(!0), ar.className = c.split(xe).concat(f.split(xe).filter(function (n) {
                            return n.match(s)
                        })).join(xe), r = e = !0), r = r || (u ? et(f, c) : a !== xi.s || f !== o[xi.s].cssText), i.push(a)
                    }), it(i), r && St.update(e || me)), r
                }), z = new n(O)
            }
        }

        function Ue() {
            h && !qr && (S.observe(ar, {
                attributes: !0,
                attributeOldValue: !0,
                attributeFilter: Bn
            }), z.observe(Nt ? or : sr, {
                attributes: !0,
                attributeOldValue: !0,
                subtree: !Nt,
                childList: !Nt,
                characterData: !Nt,
                attributeFilter: Nt ? qn : Bn
            }), qr = !0)
        }

        function Ve() {
            h && qr && (S.disconnect(), z.disconnect(), qr = !1)
        }

        function Jn() {
            if (!$t) {
                var n, t = {w: R[xi.sW], h: R[xi.sH]};
                n = ui(t, _), _ = t, n && Xe({A: !0})
            }
        }

        function Qn() {
            Jr && Ge(!0)
        }

        function Zn() {
            Jr && !P.hasClass(En) && Ge(!1)
        }

        function nt() {
            Gr && (Ge(!0), clearTimeout(C), C = setTimeout(function () {
                Gr && !Lt && Ge(!1)
            }, 100))
        }

        function tt(n) {
            return Si.prvD(n), !1
        }

        function rt(n) {
            var r = Ci(n.target);
            yt(function (n, t) {
                r.is(t) && Xe({k: !0})
            })
        }

        function $e(n) {
            n || $e(!0), Yn(Kt, B.split(xe)[0], nt, !Gr || n, !0), Yn(Kt, [X, Y], [Qn, Zn], !Jr || n, !0), Rt || n || Kt.one("mouseover", Qn)
        }

        function qe() {
            var n = {};
            return Wt && tr && (n.w = ii(tr.css(ve + he)), n.h = ii(tr.css(ve + pe)), n.c = ui(n, $r), n.f = !0), !!($r = n).c
        }

        function et(n, t) {
            var r, e, i = typeof t == mi ? t.split(xe) : [], o = function u(n, t) {
                var r, e, i = [], o = [];
                for (r = 0; r < n.length; r++) i[n[r]] = !0;
                for (r = 0; r < t.length; r++) i[t[r]] ? delete i[t[r]] : i[t[r]] = !0;
                for (e in i) o.push(e);
                return o
            }(typeof n == mi ? n.split(xe) : [], i), a = sn(Ie, o);
            if (-1 < a && o.splice(a, 1), 0 < o[xi.l]) for (e = lt(!0, !0), r = 0; r < o.length; r++) if (!o[r].match(e)) return !0;
            return !1
        }

        function it(n) {
            d(n = n || Fn, function (n, t) {
                if (-1 < Si.inA(t, Fn)) {
                    var r = Yt.attr(t);
                    cn(r) == mi ? Zt.attr(t, r) : Zt.removeAttr(t)
                }
            })
        }

        function Be() {
            if (!$t) {
                var n, t, r, e, i = !jr, o = ee.w, a = ee.h, u = {}, f = br || i;
                return u[ve + he] = ye, u[ve + pe] = ye, u[he] = me, Yt.css(u), n = or[xi.oW], t = f ? Oi.max(n, or[xi.sW] - 1) : 1, u[he] = br ? me : we, u[ve + he] = we, u[pe] = me, Yt.css(u), r = or[xi.oH], e = Oi.max(r, or[xi.sH] - 1), u[he] = t, u[pe] = e, er.css(u), u[ve + he] = o, u[ve + pe] = a, Yt.css(u), {
                    q: n,
                    B: r,
                    X: t,
                    Y: e
                }
            }
        }

        function Xe(n) {
            clearTimeout(Xt), n = n || {}, je.A |= n.A, je.k |= n.k, je.H |= n.H;
            var t, r = Si.now(), e = !!je.A, i = !!je.k, o = !!je.H, a = n.C,
                u = 0 < Fe && Rt && !Lt && !o && !a && r - Bt < Fe && !yr && !br;
            if (u && (Xt = setTimeout(Xe, Fe)), !(Lt || u || $t && !a || Rt && !o && (t = Kt.is(":hidden")) || "inline" === Kt.css("display"))) {
                Bt = r, je = {}, !Ct || zt.x && zt.y ? Ht = fi({}, xt.nativeScrollbarSize) : (Ht.x = 0, Ht.y = 0), ie = {
                    x: 3 * (Ht.x + (zt.x ? 0 : 3)),
                    y: 3 * (Ht.y + (zt.y ? 0 : 3))
                }, a = a || {};
                var f = function () {
                        return ui.apply(this, [].slice.call(arguments).concat([o]))
                    }, c = {x: Zt[_e](), y: Zt[Se]()}, s = qt.scrollbars, l = qt.textarea, v = s.visibility, d = f(v, Rr),
                    h = s.autoHide, p = f(h, Lr), b = s.clickScrolling, y = f(b, Nr), m = s.dragScrolling, g = f(m, Wr),
                    w = qt.className, x = f(w, Er), _ = qt.resize, S = f(_, Dr) && !Wt, z = qt.paddingAbsolute,
                    T = f(z, Sr), O = qt.clipAlways, k = f(O, zr), C = qt.sizeAutoCapable && !Wt, A = f(C, Hr),
                    H = qt.nativeScrollbarsOverlaid.showNativeScrollbars, R = f(H, Cr), L = qt.autoUpdate, N = f(L, Ar),
                    W = qt.overflowBehavior, D = f(W, Or, o), M = l.dynWidth, E = f(Vr, M), I = l.dynHeight,
                    j = f(Ur, I);
                if (Yr = "n" === h, Kr = "s" === h, Gr = "m" === h, Jr = "l" === h, Xr = s.autoHideDelay, Ir = Er, Qr = "n" === _, Zr = "b" === _, ne = "h" === _, te = "v" === _, Mr = qt.normalizeRTL, H = H && zt.x && zt.y, Rr = v, Lr = h, Nr = b, Wr = m, Er = w, Dr = _, Sr = z, zr = O, Hr = C, Cr = H, Ar = L, Or = fi({}, W), Vr = M, Ur = I, hr = hr || {
                    x: !1,
                    y: !1
                }, x && (si(Kt, Ir + xe + Ie), ci(Kt, w !== hi && null !== w && 0 < w.length ? w : Ie)), N && (!0 === L || null === L && kt ? (Ve(), _t.add(St)) : (_t.remove(St), Ue())), A) if (C) if (rr ? rr.show() : (rr = Ci(ai(Le)), Qt.before(rr)), Mt) Gt.show(); else {
                    Gt = Ci(ai(Ne)), ur = Gt[0], rr.before(Gt);
                    var F = {w: -1, h: -1};
                    Pe(Gt, function () {
                        var n = {w: ur[xi.oW], h: ur[xi.oH]};
                        ui(n, F) && (Rt && yr && 0 < n.h || br && 0 < n.w || Rt && !yr && 0 === n.h || !br && 0 === n.w) && Xe(), F = n
                    }), Mt = !0, null !== At && Gt.css(pe, At + "(100% + 1px)")
                } else Mt && Gt.hide(), rr && rr.hide();
                o && (Jt.find("*").trigger(ge), Mt && Gt.find("*").trigger(ge)), t = t === hi ? Kt.is(":hidden") : t;
                var P, U = !!Nt && "off" !== Yt.attr("wrap"), V = f(U, jr), $ = Kt.css("direction"), q = f($, _r),
                    B = Kt.css("box-sizing"), X = f(B, mr), Y = ei(ae);
                try {
                    P = Mt ? ur[xi.bCR]() : null
                } catch (gt) {
                    return
                }
                Dt = "border-box" === B;
                var K = (Vt = "rtl" === $) ? le : ce, G = Vt ? ce : le, J = !1,
                    Q = !(!Mt || "none" === Kt.css(be)) && (0 === Oi.round(P.right - P.left) && (!!z || 0 < ar[xi.cW] - Et));
                if (C && !Q) {
                    var Z = ar[xi.oW], nn = rr.css(he);
                    rr.css(he, me);
                    var tn = ar[xi.oW];
                    rr.css(he, nn), (J = Z !== tn) || (rr.css(he, Z + 1), tn = ar[xi.oW], rr.css(he, nn), J = Z !== tn)
                }
                var rn = (Q || J) && C && !t, en = f(rn, br), on = !rn && br,
                    an = !(!Mt || !C || t) && 0 === Oi.round(P.bottom - P.top), un = f(an, yr), fn = !an && yr,
                    cn = ei(ue, "-" + he, !(rn && Dt || !Dt), !(an && Dt || !Dt)), sn = ei(oe), ln = {}, vn = {},
                    dn = function () {
                        return {w: ar[xi.cW], h: ar[xi.cH]}
                    }, hn = function () {
                        return {
                            w: fr[xi.oW] + Oi.max(0, sr[xi.cW] - sr[xi.sW]),
                            h: fr[xi.oH] + Oi.max(0, sr[xi.cH] - sr[xi.sH])
                        }
                    }, pn = Et = Y.l + Y.r, bn = It = Y.t + Y.b;
                if (pn *= z ? 1 : 0, bn *= z ? 1 : 0, Y.c = f(Y, gr), jt = cn.l + cn.r, Ft = cn.t + cn.b, cn.c = f(cn, wr), Pt = sn.l + sn.r, Ut = sn.t + sn.b, sn.c = f(sn, xr), jr = U, _r = $, mr = B, br = rn, yr = an, gr = Y, wr = cn, xr = sn, q && Mt && Gt.css(be, G), Y.c || q || T || en || un || X || A) {
                    var yn = {}, mn = {}, gn = [Y.t, Y.r, Y.b, Y.l];
                    ri(vn, oe, [-Y.t, -Y.r, -Y.b, -Y.l]), z ? (ri(yn, ye, gn), ri(Nt ? mn : ln, ae)) : (ri(yn, ye), ri(Nt ? mn : ln, ae, gn)), Qt.css(yn), Yt.css(mn)
                }
                ee = hn();
                var wn = !!Nt && Be(), xn = Nt && f(wn, Pr),
                    _n = Nt && wn ? {w: M ? wn.X : wn.q, h: I ? wn.Y : wn.B} : {};
                if (Pr = wn, an && (un || T || X || Y.c || cn.c) ? ln[pe] = me : (un || T) && (ln[pe] = we), rn && (en || T || X || Y.c || cn.c || q) ? (ln[he] = me, vn[de + he] = we) : (en || T) && (ln[he] = we, ln[be] = ye, vn[de + he] = ye), rn ? (vn[he] = me, ln[he] = _i.v(he, "max-content intrinsic") || me, ln[be] = G) : vn[he] = ye, vn[pe] = an ? _n.h || sr[xi.cH] : ye, C && rr.css(vn), nr.css(ln), ln = {}, vn = {}, e || i || xn || q || X || T || en || rn || un || an || R || D || k || S || d || p || g || y || E || j || V) {
                    var Sn = "overflow", zn = Sn + "-x", Tn = Sn + "-y";
                    if (!Ct) {
                        var On = {}, kn = hr.y && pr.ys && !H ? zt.y ? Zt.css(K) : -Ht.y : 0,
                            Cn = hr.x && pr.xs && !H ? zt.x ? Zt.css(se) : -Ht.x : 0;
                        ri(On, ye), Zt.css(On)
                    }
                    var An = oi(), Hn = {w: _n.w || An[xi.cW], h: _n.h || An[xi.cH]}, Rn = An[xi.sW], Ln = An[xi.sH];
                    Ct || (On[se] = fn ? ye : Cn, On[K] = on ? ye : kn, Zt.css(On)), ee = hn();
                    var Nn = dn(), Wn = {w: Nn.w - Pt - jt - (Dt ? 0 : Et), h: Nn.h - Ut - Ft - (Dt ? 0 : It)},
                        Dn = {w: Oi.max((rn ? Hn.w : Rn) + pn, Wn.w), h: Oi.max((an ? Hn.h : Ln) + bn, Wn.h)};
                    if (Dn.c = f(Dn, Tr), Tr = Dn, C) {
                        (Dn.c || an || rn) && (vn[he] = Dn.w, vn[pe] = Dn.h, Nt || (Hn = {w: An[xi.cW], h: An[xi.cH]}));
                        var Mn = {}, En = function (n) {
                            var t = ni(n), r = t.F, e = t.K, i = n ? rn : an, o = n ? jt : Ft, a = n ? Et : It,
                                u = n ? Pt : Ut, f = ee[r] - o - u - (Dt ? 0 : a);
                            i && (i || !cn.c) || (vn[e] = Wn[r] - 1), !(i && Hn[r] < f) || n && Nt && U || (Nt && (Mn[e] = ii(er.css(e)) - 1), --vn[e]), 0 < Hn[r] && (vn[e] = Oi.max(1, vn[e]))
                        };
                        En(!0), En(!1), Nt && er.css(Mn), rr.css(vn)
                    }
                    rn && (ln[he] = we), !rn || Dt || qr || (ln[be] = "none"), nr.css(ln), ln = {};
                    var In = {w: An[xi.sW], h: An[xi.sH]};
                    In.c = i = f(In, vr), vr = In, ee = hn(), e = f(Nn = dn(), lr), lr = Nn;
                    var jn = Nt && (0 === ee.w || 0 === ee.h), Fn = kr, Pn = {}, Un = {}, Vn = {}, $n = {}, qn = {},
                        Bn = {}, Xn = {}, Yn = fr[xi.bCR](), Kn = function (n) {
                            var t = ni(n), r = ni(!n).U, e = t.U, i = t.F, o = t.K, a = ge + t.G + "Max",
                                u = Yn[o] ? Oi.abs(Yn[o] - ee[i]) : 0, f = Fn && 0 < Fn[e] && 0 === cr[a];
                            Pn[e] = "v-s" === W[e], Un[e] = "v-h" === W[e], Vn[e] = "s" === W[e], $n[e] = Oi.max(0, Oi.round(100 * (In[i] - ee[i])) / 100), $n[e] *= jn || f && 0 < u && u < 1 ? 0 : 1, qn[e] = 0 < $n[e], Bn[e] = Pn[e] || Un[e] ? qn[r] && !Pn[r] && !Un[r] : qn[e], Bn[e + "s"] = !!Bn[e] && (Vn[e] || Pn[e]), Xn[e] = qn[e] && Bn[e + "s"]
                        };
                    if (Kn(!0), Kn(!1), $n.c = f($n, kr), kr = $n, qn.c = f(qn, hr), hr = qn, Bn.c = f(Bn, pr), pr = Bn, zt.x || zt.y) {
                        var Gn, Jn = {}, Qn = {}, Zn = o;
                        (qn.x || qn.y) && (Qn.w = zt.y && qn.y ? In.w + Tt.y : ye, Qn.h = zt.x && qn.x ? In.h + Tt.x : ye, Zn = f(Qn, dr), dr = Qn), (qn.c || Bn.c || In.c || q || en || un || rn || an || R) && (ln[oe + G] = ln[ue + G] = ye, Gn = function (n) {
                            var t = ni(n), r = ni(!n), e = t.U, i = n ? se : K, o = n ? an : rn;
                            zt[e] && qn[e] && Bn[e + "s"] ? (ln[oe + i] = !o || H ? ye : Tt[e], ln[ue + i] = n && o || H ? ye : Tt[e] + "px solid transparent") : (Qn[r.F] = ln[oe + i] = ln[ue + i] = ye, Zn = !0)
                        }, Ct ? li(Zt, He, !H) : (Gn(!0), Gn(!1))), H && (Qn.w = Qn.h = ye, Zn = !0), Zn && !Ct && (Jn[he] = Bn.y ? Qn.w : ye, Jn[pe] = Bn.x ? Qn.h : ye, tr || (tr = Ci(ai(Re)), Zt.prepend(tr)), tr.css(Jn)), nr.css(ln)
                    }
                    var nt, tt = {};
                    yn = {};
                    if ((e || qn.c || Bn.c || In.c || D || X || R || q || k || un) && (tt[G] = ye, (nt = function (n) {
                        var t = ni(n), r = ni(!n), e = t.U, i = t.J, o = n ? se : K, a = function () {
                            tt[o] = ye, re[r.F] = 0
                        };
                        qn[e] && Bn[e + "s"] ? (tt[Sn + i] = ge, H || Ct ? a() : (tt[o] = -(zt[e] ? Tt[e] : Ht[e]), re[r.F] = zt[e] ? Tt[r.U] : 0)) : (tt[Sn + i] = ye, a())
                    })(!0), nt(!1), !Ct && (ee.h < ie.x || ee.w < ie.y) && (qn.x && Bn.x && !zt.x || qn.y && Bn.y && !zt.y) ? (tt[ae + fe] = ie.x, tt[oe + fe] = -ie.x, tt[ae + G] = ie.y, tt[oe + G] = -ie.y) : tt[ae + fe] = tt[oe + fe] = tt[ae + G] = tt[oe + G] = ye, tt[ae + K] = tt[oe + K] = ye, qn.x && Bn.x || qn.y && Bn.y || jn ? Nt && jn && (yn[zn] = yn[Tn] = "hidden") : (!O || Un.x || Pn.x || Un.y || Pn.y) && (Nt && (yn[zn] = yn[Tn] = ye), tt[zn] = tt[Tn] = "visible"), Qt.css(yn), Zt.css(tt), tt = {}, (qn.c || X || en || un) && (!zt.x || !zt.y))) {
                        var rt = sr[xi.s];
                        rt.webkitTransform = "scale(1)", rt.display = "run-in", sr[xi.oH], rt.display = ye, rt.webkitTransform = ye
                    }
                    if (ln = {}, q || en || un) if (Vt && rn) {
                        var et = nr.css(be), it = Oi.round(nr.css(be, ye).css(le, ye).position().left);
                        nr.css(be, et), it !== Oi.round(nr.position().left) && (ln[le] = it)
                    } else ln[le] = ye;
                    if (nr.css(ln), Nt && i) {
                        var ot = function wt() {
                            var n = or.selectionStart;
                            if (n === hi) return;
                            var t, r, e = Yt.val(), i = e[xi.l], o = e.split("\n"), a = o[xi.l],
                                u = e.substr(0, n).split("\n"), f = 0, c = 0, s = u[xi.l], l = u[u[xi.l] - 1][xi.l];
                            for (r = 0; r < o[xi.l]; r++) t = o[r][xi.l], c < t && (f = r + 1, c = t);
                            return {Q: s, Z: l, nn: a, tn: c, rn: f, en: n, "in": i}
                        }();
                        if (ot) {
                            var at = Fr === hi || ot.nn !== Fr.nn, ut = ot.Q, ft = ot.Z, ct = ot.rn, st = ot.nn,
                                lt = ot.tn, vt = ot.en, dt = ot["in"] <= vt && Br, ht = {
                                    x: U || ft !== lt || ut !== ct ? -1 : kr.x,
                                    y: (U ? dt || at && Fn && c.y === Fn.y : (dt || at) && ut === st) ? kr.y : -1
                                };
                            c.x = -1 < ht.x ? Vt && Mr && Ot.i ? 0 : ht.x : c.x, c.y = -1 < ht.y ? ht.y : c.y
                        }
                        Fr = ot
                    }
                    Vt && Ot.i && zt.y && qn.x && Mr && (c.x += re.w || 0), rn && Kt[_e](0), an && Kt[Se](0), Zt[_e](c.x)[Se](c.y);
                    var pt = "v" === v, bt = "h" === v, yt = "a" === v, mt = function (n, t) {
                        t = t === hi ? n : t, Ke(!0, n, Xn.x), Ke(!1, t, Xn.y)
                    };
                    li(Kt, ke, Bn.x || Bn.y), li(Kt, Ce, Bn.x), li(Kt, Ae, Bn.y), q && !Wt && li(Kt, ze, Vt), Wt && ci(Kt, Te), S && (li(Kt, Te, Qr), li(ir, We, !Qr), li(ir, De, Zr), li(ir, Me, ne), li(ir, Ee, te)), (d || D || Bn.c || qn.c || R) && (H ? R && (si(Kt, Oe), H && mt(!1)) : yt ? mt(Xn.x, Xn.y) : pt ? mt(!0) : bt && mt(!1)), (p || R) && ($e(!Jr && !Gr), Ge(Yr, !Yr)), (e || $n.c || un || en || S || X || T || R || q) && (Je(!0), Qe(!0), Je(!1), Qe(!1)), y && Ze(!0, b), g && Ze(!1, m), ti("onDirectionChanged", {
                        isRTL: Vt,
                        dir: $
                    }, q), ti("onHostSizeChanged", {
                        width: lr.w,
                        height: lr.h
                    }, e), ti("onContentSizeChanged", {width: vr.w, height: vr.h}, i), ti("onOverflowChanged", {
                        x: qn.x,
                        y: qn.y,
                        xScrollable: Bn.xs,
                        yScrollable: Bn.ys,
                        clipped: Bn.x || Bn.y
                    }, qn.c || Bn.c), ti("onOverflowAmountChanged", {x: $n.x, y: $n.y}, $n.c)
                }
                Wt && $r && (hr.c || $r.c) && ($r.f || qe(), zt.y && hr.x && nr.css(ve + he, $r.w + Tt.y), zt.x && hr.y && nr.css(ve + pe, $r.h + Tt.x), $r.c = !1), Rt && a.updateOnLoad && Ye(), ti("onUpdated", {forced: o})
            }
        }

        function Ye() {
            Nt || yt(function (n, t) {
                nr.find(t).each(function (n, t) {
                    Si.inA(t, Vn) < 0 && (Vn.push(t), Ci(t).off(Un, rt).on(Un, rt))
                })
            })
        }

        function ot(n) {
            var t = Ti._(n, Ti.g, !0, a);
            return a = fi({}, a, t.S), qt = fi({}, qt, t.z), t.z
        }

        function at(e) {
            var n = "parent", t = yn + xe + On, r = Nt ? xe + On : ye, i = qt.textarea.inheritedAttrs, o = {},
                a = function () {
                    var r = e ? Yt : Kt;
                    d(o, function (n, t) {
                        cn(t) == mi && (n == xi.c ? r.addClass(t) : r.attr(n, t))
                    })
                }, u = [rn, en, on, Te, ze, an, un, fn, Oe, ke, Ce, Ae, Ie, yn, On, Er].join(xe), f = {};
            Kt = Kt || (Nt ? p ? Yt[n]()[n]()[n]()[n]() : Ci(ai(on)) : Yt), nr = nr || pt(_n + r), Zt = Zt || pt(wn + r), Qt = Qt || pt(gn + r), Jt = Jt || pt("os-resize-observer-host"), er = er || (Nt ? pt(mn) : hi), p && ci(Kt, en), e && si(Kt, u), i = cn(i) == mi ? i.split(xe) : i, Si.isA(i) && Nt && d(i, function (n, t) {
                cn(t) == mi && (o[t] = e ? Kt.attr(t) : Yt.attr(t))
            }), e ? (p && Rt ? (Jt.children().remove(), d([Qt, Zt, nr, er], function (n, t) {
                t && si(t.removeAttr(xi.s), In)
            }), ci(Kt, Nt ? on : rn)) : (mt(Jt), nr.contents().unwrap().unwrap().unwrap(), Nt && (Yt.unwrap(), mt(Kt), mt(er), a())), Nt && Yt.removeAttr(xi.s), Wt && si(c, tn)) : (Nt && (qt.sizeAutoCapable || (f[he] = Yt.css(he), f[pe] = Yt.css(pe)), p || Yt.addClass(On).wrap(Kt), Kt = Yt[n]().css(f)), p || (ci(Yt, Nt ? t : rn), Kt.wrapInner(nr).wrapInner(Zt).wrapInner(Qt).prepend(Jt), nr = gt(Kt, W + _n), Zt = gt(Kt, W + wn), Qt = gt(Kt, W + gn), Nt && (nr.prepend(er), a())), Ct && ci(Zt, He), zt.x && zt.y && ci(Zt, xn), Wt && ci(c, tn), R = Jt[0], ar = Kt[0], fr = Qt[0], cr = Zt[0], sr = nr[0], it())
        }

        function ut() {
            var r, t,
                e = [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 123, 33, 34, 37, 38, 39, 40, 16, 17, 18, 19, 20, 144],
                i = [], n = "focus";

            function o(n) {
                Be(), St.update(me), n && kt && clearInterval(r)
            }

            Nt ? (9 < I || !kt ? Kn(Yt, "input", o) : Kn(Yt, [K, G], [function a(n) {
                var t = n.keyCode;
                sn(t, e) < 0 && (i[xi.l] || (o(), r = setInterval(o, 1e3 / 60)), sn(t, i) < 0 && i.push(t))
            }, function u(n) {
                var t = n.keyCode, r = sn(t, i);
                sn(t, e) < 0 && (-1 < r && i.splice(r, 1), i[xi.l] || o(!0))
            }]), Kn(Yt, [ge, "drop", n, n + "out"], [function f(n) {
                return Yt[_e](Ot.i && Mr ? 9999999 : 0), Yt[Se](0), Si.prvD(n), Si.stpP(n), !1
            }, function c(n) {
                setTimeout(function () {
                    Lt || o()
                }, 50)
            }, function s() {
                Br = !0, ci(Kt, n)
            }, function l() {
                Br = !1, i = [], si(Kt, n), o(!0)
            }])) : Kn(nr, Q, function v(n) {
                !0 !== Ar && function l(n) {
                    if (!Rt) return 1;
                    var t = "flex-grow", r = "flex-shrink", e = "flex-basis",
                        i = [he, ve + he, de + he, oe + le, oe + ce, le, ce, "font-weight", "word-spacing", t, r, e],
                        o = [ae + le, ae + ce, ue + le + he, ue + ce + he],
                        a = [pe, ve + pe, de + pe, oe + fe, oe + se, fe, se, "line-height", t, r, e],
                        u = [ae + fe, ae + se, ue + fe + he, ue + se + he], f = "s" === Or.x || "v-s" === Or.x, c = !1,
                        s = function (n, t) {
                            for (var r = 0; r < n[xi.l]; r++) if (n[r] === t) return !0;
                            return !1
                        };
                    return ("s" === Or.y || "v-s" === Or.y) && ((c = s(a, n)) || Dt || (c = s(u, n))), f && !c && ((c = s(i, n)) || Dt || (c = s(o, n))), c
                }((n = n.originalEvent || n).propertyName) && St.update(me)
            }), Kn(Zt, ge, function d(n) {
                $t || (t !== hi ? clearTimeout(t) : ((Kr || Gr) && Ge(!0), ht() || ci(Kt, Oe), ti("onScrollStart", n)), V || (Qe(!0), Qe(!1)), ti("onScroll", n), t = setTimeout(function () {
                    Lt || (clearTimeout(t), t = hi, (Kr || Gr) && Ge(!1), ht() || si(Kt, Oe), ti("onScrollStop", n))
                }, 175))
            }, !0)
        }

        function ft(i) {
            var n, t, o = function (n) {
                var t = pt(kn + xe + (n ? Dn : Mn), !0), r = pt(Cn, t), e = pt(Hn, t);
                return p || i || (t.append(r), r.append(e)), {an: t, un: r, cn: e}
            };

            function r(n) {
                var t = ni(n), r = t.an, e = t.un, i = t.cn;
                p && Rt ? d([r, e, i], function (n, t) {
                    si(t.removeAttr(xi.s), In)
                }) : mt(r || o(n).an)
            }

            i ? (r(!0), r()) : (n = o(!0), t = o(), f = n.an, s = n.un, l = n.cn, v = t.an, b = t.un, y = t.cn, p || (Qt.after(v), Qt.after(f)))
        }

        function ct(z) {
            var T, i, O, k, e = ni(z), C = e.sn, t = x.top !== x, A = e.U, r = e.J, H = ge + e.G, o = "active",
                a = "snapHandle", u = "click", R = 1, f = [16, 17];

            function c(n) {
                return I && t ? n["screen" + r] : Si.page(n)[A]
            }

            function s(n) {
                return qt.scrollbars[n]
            }

            function l() {
                R = .5
            }

            function v() {
                R = 1
            }

            function d(n) {
                Si.stpP(n)
            }

            function L(n) {
                -1 < sn(n.keyCode, f) && l()
            }

            function N(n) {
                -1 < sn(n.keyCode, f) && v()
            }

            function W(n) {
                var t = (n.originalEvent || n).touches !== hi;
                return !($t || Lt || ht() || !Wr || t && !s("touchSupport")) && (1 === Si.mBtn(n) || t)
            }

            function h(n) {
                if (W(n)) {
                    var t = C.I, r = C.D, e = C.N * ((c(n) - O) * k / (t - r));
                    e = isFinite(e) ? e : 0, Vt && z && !Ot.i && (e *= -1), Zt[H](Oi.round(i + e)), V && Qe(z, i + e), g || Si.prvD(n)
                } else D(n)
            }

            function D(n) {
                if (n = n || n.originalEvent, Yn(F, [B, q, K, G, J], [h, D, L, N, tt], !0), Si.rAF()(function () {
                    Yn(F, u, d, !0, {$: !0})
                }), V && Qe(z, !0), V = !1, si(P, En), si(e.cn, o), si(e.un, o), si(e.an, o), k = 1, v(), T !== (O = i = hi) && (St.scrollStop(), clearTimeout(T), T = hi), n) {
                    var t = ar[xi.bCR]();
                    n.clientX >= t.left && n.clientX <= t.right && n.clientY >= t.top && n.clientY <= t.bottom || Zn(), (Kr || Gr) && Ge(!1)
                }
            }

            function M(n) {
                i = Zt[H](), i = isNaN(i) ? 0 : i, (Vt && z && !Ot.n || !Vt) && (i = i < 0 ? 0 : i), k = vt()[A], O = c(n), V = !s(a), ci(P, En), ci(e.cn, o), ci(e.an, o), Yn(F, [B, q, J], [h, D, tt]), Si.rAF()(function () {
                    Yn(F, u, d, !1, {$: !0})
                }), !I && w || Si.prvD(n), Si.stpP(n)
            }

            Kn(e.cn, $, function p(n) {
                W(n) && M(n)
            }), Kn(e.un, [$, X, Y], [function E(n) {
                if (W(n)) {
                    var d, t = e.sn.D / Math.round(Oi.min(1, ee[e.F] / vr[e.F]) * e.sn.I), h = Oi.round(ee[e.F] * t),
                        p = 270 * t, b = 400 * t, y = e.un.offset()[e.P], r = n.ctrlKey, m = n.shiftKey, g = m && r,
                        w = !0, x = function (n) {
                            V && Qe(z, n)
                        }, _ = function () {
                            x(), M(n)
                        }, S = function () {
                            if (!Lt) {
                                var n = (O - y) * k, t = C.W, r = C.I, e = C.D, i = C.N, o = C.R, a = p * R,
                                    u = w ? Oi.max(b, a) : a, f = i * ((n - e / 2) / (r - e)),
                                    c = Vt && z && (!Ot.i && !Ot.n || Mr), s = c ? t < n : n < t, l = {}, v = {
                                        easing: "linear", step: function (n) {
                                            V && (Zt[H](n), Qe(z, n))
                                        }
                                    };
                                f = isFinite(f) ? f : 0, f = Vt && z && !Ot.i ? i - f : f, m ? (Zt[H](f), g ? (f = Zt[H](), Zt[H](o), f = c && Ot.i ? i - f : f, f = c && Ot.n ? -f : f, l[A] = f, St.scroll(l, fi(v, {
                                    duration: 130,
                                    complete: _
                                }))) : _()) : (d = w ? s : d, (c ? d ? n <= t + e : t <= n : d ? t <= n : n <= t + e) ? (clearTimeout(T), St.scrollStop(), T = hi, x(!0)) : (T = setTimeout(S, u), l[A] = (d ? "-=" : "+=") + h, St.scroll(l, fi(v, {duration: a}))), w = !1)
                            }
                        };
                    r && l(), k = vt()[A], O = Si.page(n)[A], V = !s(a), ci(P, En), ci(e.un, o), ci(e.an, o), Yn(F, [q, K, G, J], [D, L, N, tt]), S(), Si.prvD(n), Si.stpP(n)
                }
            }, function b(n) {
                U = !0, (Kr || Gr) && Ge(!0)
            }, function y(n) {
                U = !1, (Kr || Gr) && Ge(!1)
            }]), Kn(e.an, $, function m(n) {
                Si.stpP(n)
            }), j && Kn(e.an, Q, function (n) {
                n.target === e.an[0] && (Je(z), Qe(z))
            })
        }

        function Ke(n, t, r) {
            var e = n ? f : v;
            li(Kt, n ? an : un, !t), li(e, Ln, !r)
        }

        function Ge(n, t) {
            if (clearTimeout(k), n) si(f, Nn), si(v, Nn); else {
                var r, e = function () {
                    U || Lt || (!(r = l.hasClass("active") || y.hasClass("active")) && (Kr || Gr || Jr) && ci(f, Nn), !r && (Kr || Gr || Jr) && ci(v, Nn))
                };
                0 < Xr && !0 !== t ? k = setTimeout(e, Xr) : e()
            }
        }

        function Je(n) {
            var t = {}, r = ni(n), e = r.sn, i = Oi.min(1, ee[r.F] / vr[r.F]);
            t[r.K] = Oi.floor(100 * i * 1e6) / 1e6 + "%", ht() || r.cn.css(t), e.D = r.cn[0]["offset" + r.ln], e.M = i
        }

        function Qe(n, t) {
            var r, e, i = cn(t) == gi, o = Vt && n, a = ni(n), u = a.sn, f = "translate(", c = _i.u("transform"),
                s = _i.u("transition"), l = n ? Zt[_e]() : Zt[Se](), v = t === hi || i ? l : t, d = u.D,
                h = a.un[0]["offset" + a.ln], p = h - d, b = {},
                y = (cr[ge + a.ln] - cr["client" + a.ln]) * (Ot.n && o ? -1 : 1), m = function (n) {
                    return isNaN(n / y) ? 0 : Oi.max(0, Oi.min(1, n / y))
                }, g = function (n) {
                    var t = p * n;
                    return t = isNaN(t) ? 0 : t, t = o && !Ot.i ? h - d - t : t, t = Oi.max(0, t)
                }, w = m(l), x = g(m(v)), _ = g(w);
            u.N = y, u.R = l, u.L = w, ln ? (r = o ? -(h - d - x) : x, e = n ? f + r + "px, 0)" : f + "0, " + r + "px)", b[c] = e, j && (b[s] = i && 1 < Oi.abs(x - u.W) ? function S(n) {
                var t = _i.u("transition"), r = n.css(t);
                if (r) return r;
                for (var e, i, o, a = "\\s*(([^,(]+(\\(.+?\\))?)+)[\\s,]*", u = new RegExp(a), f = new RegExp("^(" + a + ")+$"), c = "property duration timing-function delay".split(" "), s = [], l = 0, v = function (n) {
                    if (e = [], !n.match(f)) return n;
                    for (; n.match(u);) e.push(RegExp.$1), n = n.replace(u, ye);
                    return e
                }; l < c[xi.l]; l++) for (i = v(n.css(t + "-" + c[l])), o = 0; o < i[xi.l]; o++) s[o] = (s[o] ? s[o] + xe : ye) + i[o];
                return s.join(", ")
            }(a.cn) + ", " + (c + xe + 250) + "ms" : ye)) : b[a.P] = x, ht() || (a.cn.css(b), ln && j && i && a.cn.one(Q, function () {
                Lt || a.cn.css(s, ye)
            })), u.W = x, u.j = _, u.I = h
        }

        function Ze(n, t) {
            var r = t ? "removeClass" : "addClass", e = n ? b : y, i = n ? An : Rn;
            (n ? s : l)[r](i), e[r](i)
        }

        function ni(n) {
            return {
                K: n ? he : pe,
                ln: n ? "Width" : "Height",
                P: n ? le : fe,
                G: n ? "Left" : "Top",
                U: n ? pn : bn,
                J: n ? "X" : "Y",
                F: n ? "w" : "h",
                vn: n ? "l" : "t",
                un: n ? s : b,
                cn: n ? l : y,
                an: n ? f : v,
                sn: n ? vn : dn
            }
        }

        function st(n) {
            ir = ir || pt(Wn, !0), n ? p && Rt ? si(ir.removeAttr(xi.s), In) : mt(ir) : p || Kt.append(ir)
        }

        function ti(n, t, r) {
            if (!1 !== r) if (Rt) {
                var e, i = qt.callbacks[n], o = n;
                "on" === o.substr(0, 2) && (o = o.substr(2, 1).toLowerCase() + o.substr(3)), cn(i) == bi && i.call(St, t), d(Pn, function () {
                    cn((e = this).on) == bi && e.on(o, t)
                })
            } else Lt || jn.push({n: n, a: t})
        }

        function ri(n, t, r) {
            r = r || [ye, ye, ye, ye], n[(t = t || ye) + fe] = r[0], n[t + ce] = r[1], n[t + se] = r[2], n[t + le] = r[3]
        }

        function ei(n, t, r, e) {
            return t = t || ye, n = n || ye, {
                t: e ? 0 : ii(Kt.css(n + fe + t)),
                r: r ? 0 : ii(Kt.css(n + ce + t)),
                b: e ? 0 : ii(Kt.css(n + se + t)),
                l: r ? 0 : ii(Kt.css(n + le + t))
            }
        }

        function lt(n, t) {
            var r, e, i, o = function (n, t) {
                if (i = "", t && typeof n == mi) for (e = n.split(xe), r = 0; r < e[xi.l]; r++) i += "|" + e[r] + "$";
                return i
            };
            return new RegExp("(^" + rn + "([-_].+|)$)" + o(Er, n) + o(Ir, t), "g")
        }

        function vt() {
            var n = fr[xi.bCR]();
            return {
                x: ln && 1 / (Oi.round(n.width) / fr[xi.oW]) || 1,
                y: ln && 1 / (Oi.round(n.height) / fr[xi.oH]) || 1
            }
        }

        function dt(n) {
            var t = "ownerDocument", r = "HTMLElement", e = n && n[t] && n[t].parentWindow || vi;
            return typeof e[r] == pi ? n instanceof e[r] : n && typeof n == pi && null !== n && 1 === n.nodeType && typeof n.nodeName == mi
        }

        function ii(n, t) {
            var r = t ? parseFloat(n) : parseInt(n, 10);
            return isNaN(r) ? 0 : r
        }

        function ht() {
            return Cr && zt.x && zt.y
        }

        function oi() {
            return Nt ? er[0] : sr
        }

        function ai(r, n) {
            return "<div " + (r ? cn(r) == mi ? 'class="' + r + '"' : function () {
                var n, t = ye;
                if (Ci.isPlainObject(r)) for (n in r) t += ("c" === n ? "class" : n) + '="' + r[n] + '" ';
                return t
            }() : ye) + ">" + (n || ye) + "</div>"
        }

        function pt(n, t) {
            var r = cn(t) == gi, e = !r && t || Kt;
            return p && !e[xi.l] ? null : p ? e[r ? "children" : "find"](W + n.replace(/\s/g, W)).eq(0) : Ci(ai(n))
        }

        function bt(n, t) {
            for (var r, e = t.split(W), i = 0; i < e.length; i++) {
                if (!n[xi.hOP](e[i])) return;
                r = n[e[i]], i < e.length && cn(r) == pi && (n = r)
            }
            return r
        }

        function yt(n) {
            var t = qt.updateOnLoad;
            t = cn(t) == mi ? t.split(xe) : t, Si.isA(t) && !Lt && d(t, n)
        }

        function ui(n, t, r) {
            if (r) return r;
            if (cn(n) != pi || cn(t) != pi) return n !== t;
            for (var e in n) if ("c" !== e) {
                if (!n[xi.hOP](e) || !t[xi.hOP](e)) return !0;
                if (ui(n[e], t[e])) return !0
            }
            return !1
        }

        function fi() {
            return Ci.extend.apply(this, [!0].concat([].slice.call(arguments)))
        }

        function ci(n, t) {
            return e.addClass.call(n, t)
        }

        function si(n, t) {
            return e.removeClass.call(n, t)
        }

        function li(n, t, r) {
            return (r ? ci : si)(n, t)
        }

        function mt(n) {
            return e.remove.call(n)
        }

        function gt(n, t) {
            return e.find.call(n, t).eq(0)
        }
    }

    return ki && ki.fn && (ki.fn.overlayScrollbars = function (n, t) {
        return ki.isPlainObject(n) ? (ki.each(this, function () {
            w(this, n, t)
        }), this) : w(this, n)
    }), w
});


var shhBody, searchPopup, menuPopup;
$(function () {
    shhBody = $('body');


    let notifyForm = $('#notifywhenappear-form');
    menuPopup = $('#menu-popup');
    searchPopup = $('#search-popup');
    let sizeguidePopup = $('#sizeguide-popup');
    let sizeguideForm = $('#sizeguide');

    let color_picker = $('.color-picker');
    let color_hex;
    let color_title;
    let color_slug;
    let color_style;
    let size_picker = $('.size-picker');
    let size_ch;

    let color_image_mobile;
    let notifySocial;

    let video;

    if ($('body.home').length) {
        loadHomepageVideo();
    }

    if ($('body.page-id-89').length || $('body.page-id-94').length || $('body.page-id-96').length || $('body.page-id-13559').length) {
        $('.wp-block-buttons:not(:last-child) a').each(function () {
            $(this).addClass($(this).text().toLowerCase());
        })
    }

    if ($('#wrapper.category').length || $('.wishlist-items').length) {
        loadVideo('.items .item');
    }
    if ($('#wrapper.item').length) {
        loadVideo('.slider-for .ig-item');
        loadVideo('.shh-additional .items .item');


        if ($('.item-size li[data-size="one-size"]').length) {
            $('.item-size div').css('padding-bottom', '10px');
            $('.item-size div .findout').hide();

            $('.item-form .item-size').find('li[data-size="one-size"]').trigger('click');
        }

        $('.swatchly-type-color .swatchly-swatch').each(function () {
            if ($(this).attr('data-tooltip_image') !== undefined) {
                color_image_mobile = $(this).attr('data-tooltip_image');
            }
        })

        let active_color_load = $('.swatchly-type-color .swatchly-swatch.swatchly-selected').attr('data-tooltip_text');
        $('.swatchly-type-color').parents('tr').find('td.label label span').text(': ' + active_color_load);

        $('.swatchly-type-color .swatchly-swatch').on('click', function () {
            console.log('clicked');
            if ($(this).hasClass('out-of-stock')) {
                $('.item-content').addClass('out-of-stock');
            } else {
                $('.item-content').removeClass('out-of-stock');
            }

            $(this).parents('tr').find('td.label label span').text(': ' + $(this).attr('data-tooltip_text'));
        })

        $('a.notifywhenappear').on('click', function () {
            let colourname = $('.item-form table.variations .swatchly-type-color .swatchly-swatch.swatchly-selected').attr('data-tooltip_text');
            let sizename = $('.item-size div ul li.selected').attr('data-size');
            notifyForm.find('input[name="colourname"]').val(colourname);
            notifyForm.find('input[name="sizename"]').val(sizename);

            shhBody.addClass('popup popup-cart');
            $('#notifywhenappear-modal').addClass('on-screen');
        })


        notifyForm.find('ul.checkout-social li').on('click', function () {
            let select = document.querySelector('#social_to_answer');
            notifySocial = $(this).attr('data-value');
            select.classList.add('selected');
            select.value = notifySocial;
            select.dispatchEvent(new Event('change'));

            $(this).parent().find('li').removeClass('selected');
            $(this).addClass('selected');

            notifyForm.find('p.form-row#phone_field, p.form-row#nickname_field').addClass('hidden');
            if (notifySocial === 'telegram') {
                notifyForm.find('p.form-row#phone_field').removeClass('hidden');
            } else {
                notifyForm.find('p.form-row#nickname_field').removeClass('hidden');
            }
        })
    }


    if ($('.items .item').length && $(window).width() < 1024) {
        $('.items .item').each(function () {
            let $item = $(this);
            $item.find('.swatchly-type-color').slick({
                infinite: false,
                slidesToShow: 6,
                slidesToScroll: 6
            })
            $item.find('.swatchly-type-color').css('opacity', '1');

            $item.find('.swatchly-swatch').on('click', function () {
                $item.find('.swatchly-swatch').each(function () {
                    $(this).removeClass('swatchly-selected');
                })
                $(this).addClass('swatchly-selected');
            })
        })

    }


    $('.open-menu').on('click', function () {
        if (shhBody.hasClass('popup-cart')) {
            shhBody.find('.shh-cart').trigger('click');
        }
        $(this).toggleClass('active');
        $('.shh-search button').removeClass('active');
        searchPopup.removeClass('on-screen');
        menuPopup.toggleClass('on-screen');

        if (menuPopup.hasClass('on-screen')) {
            shhBody.addClass('popup');
        } else {
            shhBody.removeClass('popup');
        }
    })
    $('.shh-search button').on('click', function () {
        if (shhBody.hasClass('popup-cart')) {
            shhBody.find('.shh-cart').trigger('click');
        }
        $(this).toggleClass('active');
        $('.open-menu').removeClass('active');
        menuPopup.removeClass('on-screen');
        searchPopup.toggleClass('on-screen');

        if (searchPopup.hasClass('on-screen')) {
            $('.popup-overlay').hide();
            shhBody.addClass('popup');
        } else {
            setTimeout(function () {
                $('.popup-overlay').show();
            }, 100)
            shhBody.removeClass('popup');
        }
    })
    $('.item-size_scheme').on('click', function () {
        shhBody.addClass('popup');
        sizeguidePopup.addClass('on-screen');
        sizeguidePopup.find('input[type="number"]').eq(0).focus();
    })

    shhBody.on('click', '.shh-cart', showCart);

    shhBody.on('click', '.popup-close', function () {
        $('.shh-cart').removeClass('close');
        $(this).parent().removeClass('on-screen findout');
        if (!$('.popup.on-screen').length) {
            shhBody.removeClass('popup popup-cart');
        }
    })

    $('.shh-lang ul li').each(function () {
        if ($(this).text() === $('.shh-lang .lang > span').text()) {
            $(this).addClass('hidden');
        }
    })
    $('.shh-lang ul li').on('click', function () {
        $('.shh-lang .lang > span').text($(this).text());
        $('.shh-lang ul li').removeClass('hidden');
        $(this).addClass('hidden');
    })

    $('.favourite').on('click', function () {
        $(this).toggleClass('active');
    })
    $('.messenger ul li label').on('click', function () {
        $('.messenger ul li').removeClass('selected');
        $(this).parent().addClass('selected');
        let radioVal = $(this).parent().find('input[type="radio"]').attr('id');
        $('input[type="radio"][value="' + radioVal + '"]').prop('checked', true);
    })

    if ($(window).scrollTop() > 10) {
        $('#shh-header').addClass('scroll');
    }

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 10) {
            $('#shh-header').addClass('scroll');
        } else {
            $('#shh-header').removeClass('scroll');
        }
    })

    if ($('.item-gallery').length) {
        $('.zoom').zoom({on: 'click'});

        $('.details-title').on('click', function () {
            if ($(this).parent().hasClass('active')) {
                $(this).parent().removeClass('active');
                $(this).parent().find('.details-content').slideUp();
            } else {
                $('.details-chapter').removeClass('active');
                $('.details-chapter .details-content').slideUp();

                $(this).parent().addClass('active');
                $(this).parent().find('.details-content').slideDown();
            }
        })
    }

    $('div:not(.size-picker):not(.item-size) button.findout').on('click', function () {
        sizeguidePopup.addClass('on-screen findout');
        sizeguidePopup.find('input[type="number"]').eq(0).focus();
    })
    $('div.size-picker button.findout, div.item-size span.findout').on('click', function () {
        sizeguidePopup.addClass('on-screen findout findout-only');
        sizeguidePopup.find('input[type="number"]').eq(0).focus();
    })
    $('.popup-back').on('click', function () {
        if ($(this).parents('#sizeguide-popup').hasClass('findout-only')) {
            sizeguidePopup.removeClass('findout findout-only on-screen');
        } else {
            sizeguidePopup.removeClass('findout');
        }
    })

    $('#sizeguide-popup .advice a').on('click tap', function (e) {
        e.preventDefault();
        $('.sizeguide-info a').trigger('click');
    })
    $('.sizeguide-info a').on('click', function (e) {
        e.preventDefault();
        $('#contact-popup').addClass('on-screen');
    })


    $('.mobile-color').on('click', function () {
        color_picker.addClass('on-screen');
    })
    $('.mobile-size').on('click', function () {
        size_picker.addClass('on-screen');
    })

    color_picker.find('li').on('click', function () {
        color_picker.find('li').removeClass('selected');
        $(this).addClass('selected');

        color_slug = $(this).attr('data-colorslug');
        color_hex = $(this).find('.colorbox').attr('data-hex');
        color_title = $(this).find('.color-title').text();
        color_style = $(this).find('.colorbox').attr('style');
        let color_bg = $(this).find('.colorbox').attr('data-url');

        if (!color_bg) {
            $('.mobile-color .color-square').css('background', color_hex);
        } else {
            $('.mobile-color .color-square').css({
                'background-image': 'url("' + color_bg + '")',
                'background-size': 'cover'
            });
        }
        $('.mobile-color .color-title').text(color_title);

        $('.swatchly-type-color .swatchly-swatch:not(.swatchly-selected)[data-attr_value="' + color_slug + '"]').trigger('click');

        color_picker.removeClass('on-screen');
    })
    color_picker.find('.picker-close').on('click', function () {
        color_picker.removeClass('on-screen');
    })
    color_picker.find('li').eq(0).trigger('click');

    size_picker.find('li').on('click', function () {
        size_picker.find('li').removeClass('selected');
        $(this).addClass('selected');

        size_ch = $(this).attr('data-size');

        $('.mobile-size span').text(size_ch);
        $('.item-form .item-size').find('li[data-size="' + size_ch + '"]').trigger('click');

        size_picker.removeClass('on-screen');
    })
    size_picker.find('.picker-close').on('click', function () {
        size_picker.removeClass('on-screen');
    })
    size_picker.find('li').eq(0).trigger('click');

    $('.item-form .item-color').find('li').on('click', function () {
        $(this).parent().find('li').removeClass('selected');
        $(this).addClass('selected');

        color_title = $(this).find('.color-title').text();
        $('.item-color > span span').text(color_title);
    })
    $('.item-form .item-size').find('.size-text').on('click', function () {
        $(this).parent().toggleClass('opened');
    })
    $('.item-form .item-size').find('li').on('click', function () {
        $(this).parent().find('li').removeClass('selected');
        $(this).addClass('selected');
        $(this).parents('.item-size').find('.size-text').html('<span>' + $(this).text() + '</span>');

        $(this).parents('.item-size').removeClass('opened');
        $('.item-form input[type="submit"]').removeAttr('disabled');
        $('.shh-content .item-content .mobile-controls .add-to-cart').removeAttr('disabled');
    })
    $('.item-form .item-size').find('li').eq(0).trigger('click');

    if ($('body.product-type-simple').length && $('.item-form input.nyp-input').length > 0) {
        let inputPrice = parseInt($('.item-form input.nyp-input').val());
        $('.item-form button[type="submit"]').attr('disabled', 'disabled');

        $('.item-form input.nyp-input').on('keyup', function () {
            let $this = $(this);
            inputPrice = parseInt($this.val());

            if (inputPrice >= 100) {
                $('.item-form button[type="submit"]').removeAttr('disabled');
            } else {
                $('.item-form button[type="submit"]').attr('disabled', 'disabled');
            }
        })
    }


    shhBody.on('click', '#country-popup li, #postoffice-popup li, #delivery-popup li, #payment-popup li', function () {
        $(this).parent().find('li').removeClass('selected');

        $(this).find('input[type="radio"]').prop('checked', true);
        $(this).addClass('selected');
        $(this).parents('.popup').find('.popup-close').trigger('click');
    })

    optionSelect('#country-popup li', '#shipping_country');
    optionSelect('#postoffice-popup li', '#shipping_postoffice');
    optionSelect('#delivery-popup li', '#shipping_place');
    optionSelect('#payment-popup li', '#payment_type');


    if ($('.video').length) {
        $('.video-thumbnail').on('click', function () {
            $(this).hide();

            let iframe_src = $(this).parent().find('iframe').attr('data-src').split('.be/')[1];
            $(this).parent().find('iframe').prop('src', 'https://www.youtube.com/embed/' + iframe_src + '?autoplay=1');
        })
    }

    setTimeout(function () {
        let options_set = '';
        $('#payment-popup').find('ul li').each(function () {
            if (!$('#payment_type').find('option[value="' + $(this).attr('data-value') + '"]').length) {
                options_set += '<option value="' + $(this).attr('data-value') + '">' + $(this).find('label').text() + '</option>';
            }
        })
        $('#payment_type').append(options_set);
        $('#payment-popup').find('ul li:first-child').trigger('click');
    }, 2000)


    $('select.checkout-select').on('mousedown', function (e) {
        e.preventDefault();
        this.blur();
        window.focus();

        shhBody.addClass('popup');
        let $id = $(this).attr('id');

        switch ($id) {
            case 'shipping_country':
                $('#country-popup').addClass('on-screen');
                break;

            case 'shipping_postoffice':
                $('#postoffice-popup').addClass('on-screen');
                break;

            case 'shipping_place':
                $('#delivery-popup').addClass('on-screen');
                break;

            case 'payment_type':
                $('#payment-popup').addClass('on-screen');
                let options_set = '';
                $('#payment-popup').find('ul li').each(function () {
                    if (!$('#payment_type').find('option[value="' + $(this).attr('data-value') + '"]').length) {
                        options_set += '<option value="' + $(this).attr('data-value') + '">' + $(this).find('label').text() + '</option>';
                    }
                })
                $('#payment_type').append(options_set);

                if ($('#select2-wcus_np_billing_warehouse-container').text().indexOf('Поштомат') > -1) {
                    $('li.payment_method_cod').addClass('disabled');
                } else {
                    $('li.payment_method_cod').removeClass('disabled');
                }
        }
    });

    $('.popup-overlay').on('click', function () {
        $('.popup.on-screen .popup-close').trigger('click');
    })

    $('.item-expand').on('click', function () {
        $(this).parent().toggleClass('scaled');
    })

    $('.item-sidebar .item-favorites').on('click', function () {
        $(this).toggleClass('added');
        if ($(this).hasClass('added')) {
            $(this).text('Додано до улюбленого');
        } else {
            $(this).text('Додати до улюбленого');
        }
    })

    if (sizeguideForm.length) {
        let numInput = sizeguideForm.find('input[type="number"]');
        let sizeGuideEmpty = true;

        numInput.on('keydown', function (e) {
            let key = e.which || e.keyCode || e.charCode;
            let $this = $(this);
            let $thisLen = $this.val().length;
            if (!$this.val().length && key == 8 && $this.prev().length !== 0) {
                $this.blur();
                $this.prev().focus();
            }
        })
        numInput.on('keyup', function () {
            let $this = $(this);
            let $thisFirst = $this.val().substring(0, 1);
            $this.val($thisFirst);
            let $thisLen = $this.val().length;

            if ($this.val().length && $this.next().length !== 0) {
                $this.blur();
                $this.next().focus();
            }
            sizeGuideEmpty = false;

            numInput.each(function () {
                if ($(this).val().length === 0) {
                    sizeGuideEmpty = true;
                    return false;
                }
            })
            sizeGuideEmpty == false ? sizeguidePopup.find('input[type=submit]').removeAttr('disabled') : sizeguidePopup.find('input[type=submit]').attr('disabled', 'disabled');

            if ($this.index() === 0) {
                let firstSaved = parseInt($this.val());
                if (firstSaved > 1) {
                    $this.val('0');
                    $this.parent().find('input').eq(1).val(firstSaved);
                    $this.parent().find('input').eq(2).focus();
                }
            }
            if ($this.index() === 2 && $this.val().length) {
                if ($this.parent().index() === 1) {
                    $this.parents('form').find('.line').eq(1).find('input').eq(0).focus();
                } else if (parseInt($this.parent().index()) === 3) {
                    $this.parents('form').find('.line').eq(2).find('input').eq(0).focus();
                }
            }
        })

        sizeguideForm.find('input[type="submit"]').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            let bust = '';
            let waist = '';
            let hips = '';

            let bustSize;
            let waistSize;
            let hipsSize;

            $(this).parent().find('.line:nth-child(2) input').each(function () {
                if ($(this).index() === 0 && $(this).val() === '0') {

                } else {
                    bust += $(this).val();
                }
            })
            $(this).parent().find('.line:nth-child(4) input').each(function () {
                if ($(this).index() === 0 && $(this).val() === '0') {

                } else {
                    waist += $(this).val();
                }
            })
            $(this).parent().find('.line:nth-child(6) input').each(function () {
                if ($(this).index() === 0 && $(this).val() === '0') {

                } else {
                    hips += $(this).val();
                }
            })

            bust = parseInt(bust);
            waist = parseInt(waist);
            hips = parseInt(hips);

            if (bust < 82) {
                bustSize = 'XXS';
            } else if (bust > 81 && bust < 86) {
                bustSize = 'XS';
            } else if (bust > 85 && bust < 90) {
                bustSize = 'S';
            } else if (bust > 89 && bust < 94) {
                bustSize = 'M';
            } else if (bust > 93 && bust < 100) {
                bustSize = 'L';
            } else {
                bustSize = 'XL';
            }

            if (waist < 62) {
                waistSize = 'XS';
            } else if (waist > 61 && waist < 66) {
                waistSize = 'S';
            } else if (waist > 65 && waist < 70) {
                waistSize = 'S';
            } else if (waist > 69 && waist < 74) {
                waistSize = 'M';
            } else if (waist > 73 && waist < 78) {
                waistSize = 'L';
            } else {
                waistSize = 'XL';
            }

            if (hips < 90) {
                hipsSize = 'XXS';
            } else if (hips > 89 && hips < 95) {
                hipsSize = 'XS';
            } else if (hips > 94 && hips < 99) {
                hipsSize = 'S';
            } else if (hips > 98 && hips < 103) {
                hipsSize = 'M';
            } else if (hips > 102 && hips < 107) {
                hipsSize = 'L';
            } else {
                hipsSize = 'XL';
            }

            console.log(bustSize);
            console.log(waistSize);
            console.log(hipsSize);

            function findoutSize(size) {
                $('.findout-step.step2 .size-result').text(size);
                $('.findout-step.step2 .advice span').text(size);
            }

            if (bustSize === waistSize && bustSize === hipsSize) {
                findoutSize(bustSize);
            } else {
                if (bustSize === 'XL' || waistSize === 'XL' || hipsSize === 'XL') {
                    findoutSize('XL');
                } else if (bustSize === 'L' || waistSize === 'L' || hipsSize === 'L') {
                    findoutSize('L');
                } else if (bustSize === 'M' || waistSize === 'M' || hipsSize === 'M') {
                    findoutSize('M');
                } else if (bustSize === 'S' || waistSize === 'S' || hipsSize === 'S') {
                    findoutSize('S');
                } else if (bustSize === 'XS' || waistSize === 'XS' || hipsSize === 'XS') {
                    findoutSize('XS');
                } else {
                    findoutSize('XXS');
                }
            }

            $('.findout-step.step1').hide();
            $('.findout-step.step2').show();
        })
    }

    if ($('.item-addtocart').length) {
        $('.alg-wc-wl-view-state-add').append('<span>' + translatevars.addtowishtext + '</span>');
        $('.alg-wc-wl-view-state-remove').append('<span>' + translatevars.removewishtext + '</span>');
    }

    let cart_items = $('.cart-items');

    if (cart_items.length) {
        cart_items.overlayScrollbars({});

        shhBody.on('wc_fragments_loaded wc_fragments_refreshed', function () {
            $('.cart-items').overlayScrollbars({});
        })
    }

    if (window.location.search.indexOf('attribute_pa_colour') > -1) {
        $('.shh-content .item-content .mobile-controls .color-picker ul li.selected').trigger('click');

        let loadSize = window.location.search.split('attribute_pa_size=')[1];
        $('.shh-content .item-content .mobile-controls .size-picker ul li[data-size="' + loadSize + '"]').trigger('click');
    }

    if (window.location.pathname === '/wishlist/' || window.location.pathname === '/wish-list/') {
        $('.shh-wishlist a').addClass('active');
    }

    shhBody.on('click', '.add-to-cart.add-to-cart-mobile', function () {
        let $thiss = $(this);
        $('.item-form input[type=submit]').trigger('click');
    })

    shhBody.on('added_to_cart', function () {
        console.log('added to cart / custom');

        setTimeout(function () {
            $('.shh-cart').addClass('noClick');
        }, 10)

        setTimeout(function () {
            if ($('.shh-cart').hasClass('full') && !$('.shh-cart').hasClass('close')) {
                $('.shh-cart').addClass('close');
                shhBody.addClass('popup popup-cart');
                $('#cart-popup').addClass('on-screen');
            } else if ($('.shh-cart').hasClass('close')) {
                $('.shh-cart').removeClass('close');
                shhBody.removeClass('popup popup-cart');
                $('#cart-popup').removeClass('on-screen');
            }
            $('.shh-cart').removeClass('noClick');
        }, 50)
    })


    if ($('.shop-filter').length) {
        let shopFilterIn = $('.shop-filter-in');
        let filterLen = 0;

        shopFilterIn.find('a').each(function () {
            filterLen += $(this).width() + 30
        })
        shopFilterIn.css('width', filterLen);

        $('.shop-filter-outer').scrollLeft(shopFilterIn.find('a.active').offset().left - 30);
    }

    $('.popup-menu > li:first-child > a').on('click', function (e) {
        e.preventDefault();

        $('.popup-menu > li:first-child > ul').slideToggle();
    })

    $('.slider-nav .slick-slide').on('click', function () {
        $('.slider-nav .slick-slide').each(function () {
            let $this = $(this);
            $this.css('pointer-events', 'none');

            setTimeout(function () {
                $this.css('pointer-events', 'auto');
            }, 500)
        })
    })

    function loadVideo(section) {
        $(section).each(function () {
            if ($(this).find('video').length) {
                $(this).addClass('item-video');

                video = $(this).find('video')[0];
                if (video !== null) {
                    video.load();
                    video.play();
                }
            }
        })
    }

    function optionSelect(popup, select) {
        var selectField = document.querySelector(select);

        shhBody.on('click', popup, function () {
            selectField.classList.add('selected');
            selectField.value = $(this).attr('data-value');
            selectField.dispatchEvent(new Event('change'));
        })
    }
});

function showCart(e) {
    e.preventDefault();
    if (searchPopup.hasClass('on-screen')) {
        $('.shh-search button').trigger('click');
    }
    $('.open-menu').removeClass('active');
    menuPopup.removeClass('on-screen');

    if ($(this).hasClass('full') && !$(this).hasClass('close')) {
        $(this).addClass('close');
        shhBody.addClass('popup popup-cart');
        $('#cart-popup').addClass('on-screen');
    } else if ($(this).hasClass('close')) {
        $(this).removeClass('close');
        shhBody.removeClass('popup popup-cart');
        $('#cart-popup').removeClass('on-screen');
    }
}

function hideCart() {
    $('.shh-cart').removeClass('close');
    shhBody.removeClass('popup popup-cart');
    $('#cart-popup').removeClass('on-screen');
}

function loadHomepageVideo(){
    let video = $('.frontpage-image video');
    let homepageVideo;

    if(video.length > 0) {
        if($(window).width() > 1023){
            homepageVideo = video.attr('data-src');
        }else{
            homepageVideo = video.attr('data-mobile-src');
        }
        video.get(0).pause();
        video.attr('src', homepageVideo);
        video.get(0).load();
        video.get(0).play();
    }
}

$(window).on('load', function () {
    $('#wrapper').removeClass('preloaded');
    if ($('.item-gallery').length) {
        $('.shh-content .item-content .item-gallery .ig-item:not(:first-child)').show();

        $('.slider-for').find('.ig-item').eq(0).find('img:not(.zoomImg)').removeAttr('style');
        $('.slider-for').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            dots: true,
            adaptiveHeight: true,
            asNavFor: '.slider-nav',
            draggable: false,
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        swipe: false
                    }
                }
            ]
        });
        $('.slider-nav').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            asNavFor: '.slider-for',
            dots: true,
            arrows: false,
            focusOnSelect: true,
            vertical: true,
            draggable: false,
            swipe: false
        });
    }

    if ($('body.woocommerce-checkout').length) {
        setTimeout(function () {
            $('.woocommerce-billing-fields__field-wrapper.fields.billing-fields').append('<ul class="checkout-social"><li data-value="telegram"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xtelegramlink" x="0px" y="0px" viewBox="0 0 300 300" style="enable-background:new 0 0 300 300;" xml:space="preserve"><g id="XMLID_496_"><path id="XMLID_497_" d="M5.299,144.645l69.126,25.8l26.756,86.047c1.712,5.511,8.451,7.548,12.924,3.891l38.532-31.412c4.039-3.291,9.792-3.455,14.013-0.391l69.498,50.457c4.785,3.478,11.564,0.856,12.764-4.926L299.823,29.22c1.31-6.316-4.896-11.585-10.91-9.259L5.218,129.402C-1.783,132.102-1.722,142.014,5.299,144.645z M96.869,156.711l135.098-83.207c2.428-1.491,4.926,1.792,2.841,3.726L123.313,180.87c-3.919,3.648-6.447,8.53-7.163,13.829l-3.798,28.146c-0.503,3.758-5.782,4.131-6.819,0.494l-14.607-51.325C89.253,166.16,91.691,159.907,96.869,156.711z"/></g></svg></li><li data-value="whatsapp"><svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><g><g><path d="M256.064,0h-0.128C114.784,0,0,114.816,0,256c0,56,18.048,107.904,48.736,150.048l-31.904,95.104l98.4-31.456C155.712,496.512,204,512,256.064,512C397.216,512,512,397.152,512,256S397.216,0,256.064,0z M405.024,361.504c-6.176,17.44-30.688,31.904-50.24,36.128c-13.376,2.848-30.848,5.12-89.664-19.264C189.888,347.2,141.44,270.752,137.664,265.792c-3.616-4.96-30.4-40.48-30.4-77.216s18.656-54.624,26.176-62.304c6.176-6.304,16.384-9.184,26.176-9.184c3.168,0,6.016,0.16,8.576,0.288c7.52,0.32,11.296,0.768,16.256,12.64c6.176,14.88,21.216,51.616,23.008,55.392c1.824,3.776,3.648,8.896,1.088,13.856c-2.4,5.12-4.512,7.392-8.288,11.744c-3.776,4.352-7.36,7.68-11.136,12.352c-3.456,4.064-7.36,8.416-3.008,15.936c4.352,7.36,19.392,31.904,41.536,51.616c28.576,25.44,51.744,33.568,60.032,37.024c6.176,2.56,13.536,1.952,18.048-2.848c5.728-6.176,12.8-16.416,20-26.496c5.12-7.232,11.584-8.128,18.368-5.568c6.912,2.4,43.488,20.48,51.008,24.224c7.52,3.776,12.48,5.568,14.304,8.736C411.2,329.152,411.2,344.032,405.024,361.504z"/></g></g></svg></li><li data-value="viber"><svg id="Layer_1" enable-background="new 0 0 100 100" height="512" viewBox="0 0 100 100" width="512" xmlns="http://www.w3.org/2000/svg"><g id="_x31_2.Viber"><path id="Icon_36_" d="m58 10h-16c-15.4 0-28 12.6-28 28v12c0 10.8 6.3 20.7 16 25.3v13.4c0 1.2 1.5 1.8 2.3.9l11.6-11.6h14.1c15.4 0 28-12.6 28-28v-12c0-15.4-12.6-28-28-28zm10.5 52.5-4.1 4c-4.3 4.2-15.4-.6-25.2-10.6s-14.1-21.2-10-25.4l4-4c1.5-1.5 4-1.4 5.7.1l5.8 6c2.1 2.1 1.2 5.7-1.5 6.5-1.9.6-3.2 2.7-2.6 4.6 1 4.4 6.6 10 10.8 11.1 1.9.4 4-.6 4.7-2.5.9-2.7 4.5-3.5 6.5-1.4l5.8 6c1.6 1.4 1.6 3.9.1 5.6zm-14.9-33.5c-.4 0-.8 0-1.2.1-.7.1-1.4-.5-1.5-1.2s.5-1.4 1.2-1.5c.5-.1 1-.1 1.5-.1 7.3 0 13.3 6 13.3 13.3 0 .5 0 1-.1 1.5-.1.7-.8 1.3-1.5 1.2s-1.3-.8-1.2-1.5c0-.4.1-.8.1-1.2.1-5.8-4.7-10.6-10.6-10.6zm8 10.7c0 .7-.6 1.3-1.3 1.3s-1.3-.6-1.3-1.3c0-2.9-2.4-5.3-5.3-5.3-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3c4.3-.1 7.9 3.5 7.9 7.9zm10.2 4.3c-.2.7-.9 1.2-1.7 1-.7-.2-1.1-.9-.9-1.6.3-1.2.4-2.4.4-3.7 0-8.8-7.2-16-16-16-.4 0-.8 0-1.2 0-.7 0-1.4-.5-1.4-1.2s.5-1.4 1.2-1.4c.5 0 1-.1 1.4-.1 10.3 0 18.7 8.4 18.7 18.7 0 1.4-.2 2.9-.5 4.3z"/></g></svg></li></ul>');

            shhBody.on('click', 'ul.checkout-social li', function () {
                $('ul.checkout-social li').removeClass('selected');
                $(this).addClass('selected');

                let select = document.querySelector('#social_to_answer');
                select.classList.add('selected');
                select.value = $(this).attr('data-value');
                select.dispatchEvent(new Event('change'));
            })
            $('ul.checkout-social li[data-value="telegram"]').trigger('click');
        }, 1000)
    }

    let storyWrapper = $('.story-wrapper');

    $('.stories-tab').on('click', function () {

        if ($(this).attr('data-tab') !== 'all') {
            $('.stories-list > div').hide();
            $('.stories-list > div[data-cat="' + $(this).attr('data-tab') + '"]').show();
        } else {
            $('.stories-list > div').show();
        }
    })
    storyWrapper.on('click', function () {
        storyWrapper.removeClass('active');
        $(this).addClass('active');
        $(this).find('.story-item').eq(0).addClass('active');
    })

    let whichStory;
    let currentStory;

    storyWrapper.find('.sn-nav').on('click', function () {
        currentStory = $(this).parents('.story-wrapper').find('.story-items .story-item.active').index();
        whichStory = $(this).attr('data-go');

        if (whichStory === 'next') {

        }

    })

    if ($('.swatchly-swatch').length) {
        $('.swatchly-swatch').each(function () {

            if ($(this).attr('data-tooltip_image') !== undefined) {
                $(this).css({
                    'background-image': 'url(' + $(this).attr('data-tooltip_image') + ')',
                    'background-size': 'cover'
                })
                $('.color-picker ul li[data-colorslug="' + $(this).attr('data-attr_value') + '"] .colorbox').css({
                    'background-image': 'url(' + $(this).attr('data-tooltip_image') + ')',
                    'background-size': 'cover'
                })
            }

        })
    }

    if ($('body.woocommerce-order-received').length) {
        console.log('ORDER RECIEVED new');

        function createSaleOrder(arguments) {
            newSaleOrder = {
                "version": "0.2",
                "key": "OrrCVpbl26PrbRC73bZT2RRBlr2LOc",
                "action": "call",
                "params": {
                    "method": "saleOrderCreate",
                    "arguments": arguments
                }
            }
        }

        let shhGoods = [];

        let orderJson = JSON.parse($('#json').html());
        let productsJson = JSON.parse($('#products-json').html());

        let orderId = orderJson.id;
        let orderPayment = orderJson.payment_method_title;
        let paymentType;
        orderPayment === 'Оплата при отриманні' ? paymentType = 1110300000000002 : paymentType = 1110300000000001

        let orderNote = orderJson.customer_note;

        let customerId;
        let customerName = orderJson.billing.first_name + ' ' + orderJson.billing.last_name;
        let customerEmail = orderJson.billing.email;
        let customerPhone = orderJson.billing.phone.split(' ').join('');
        let customerCountry = orderJson.billing.country;
        let customerCity = orderJson.billing.city;
        let customerAddress = orderJson.billing.address_1;
        let customerSocial = orderJson.meta_data[3].value;
        if (customerSocial === 'whatsapp') {
            customerSocial = 'whatsApp';
        }

        for (let i = 0; i < productsJson.length; i++) {
            let itemSku = productsJson[i].sku;
            let itemPrice = productsJson[i].price;
            let itemQnt = 1;
            if ($('.order_item').eq(i).find('.product-name > a').text() === productsJson[i].name) {
                itemQnt = $('.order_item').eq(i).find('.product-name > .product-quantity').html().split('&nbsp;')[1];
            }
            shhGoods.push(itemSku + '__' + itemQnt + '__' + itemPrice);
        }

        let contrAgents = {
            "version": "0.2",
            "key": "OrrCVpbl26PrbRC73bZT2RRBlr2LOc",
            "action": "request",
            "params": {
                "from": "catalogs.persons",
                "fields": {
                    "id": "person_id"
                }
            }
        }
        let newCustomer = {
            "version": "0.2",
            "key": "OrrCVpbl26PrbRC73bZT2RRBlr2LOc",
            "action": "saveObject",
            "params":
                {
                    "header":
                        {
                            "id": "catalogs.persons",
                            "name": {"uk": customerName},
                            "parent": 1100100000001002,
                            "personType": 1004000000000035,
                            "details": '{' +
                                '"phones":[{"pr":"' + customerPhone + '","kind":"phone"}],' +
                                '"emails":[{"pr":"' + customerEmail + '","kind":"email"}],' +
                                '"messengers":[{"pr":"' + customerPhone + '","kind":"' + customerSocial + '"}]' +
                                '}'
                        }
                }
        }
        let goods = {
            "version": "0.2",
            "key": "OrrCVpbl26PrbRC73bZT2RRBlr2LOc",
            "action": "request",
            "params": {
                "from": "catalogs.goods",
                "fields": {
                    "id": "good",
                    "productNum": "attribute",
                    "price": "price"
                }
            }
        }

        $.ajax({
            type: 'POST',
            url: 'https://api.delovod.ua',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: "packet=" + JSON.stringify(goods),
            crossDomain: true
        }).done(function (response) {
            let goodsList = JSON.parse(response);
            let goods = [];
            let goodObject;
            for (let i = 0; i < shhGoods.length; i++) {
                goodObject = {};

                goodObject.productNum = shhGoods[i].split('__')[0];
                goodObject.qty = shhGoods[i].split('__')[1];
                goodObject.price = shhGoods[i].split('__')[2];
                goods.push(goodObject);
            }

            $.ajax({
                type: 'POST',
                url: 'https://api.delovod.ua',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: "packet=" + JSON.stringify(contrAgents),
                crossDomain: true
            }).done(function (response) {
                let customers = JSON.parse(response);

                for (let i = 0; i < customers.length; i++) {
                    if (customers[i].person_id__pr.toLowerCase() === customerName.toLowerCase()) {
                        customerId = customers[i].person_id;
                    }
                }
                if (customerId === undefined) {
                    $.ajax({
                        type: 'POST',
                        url: 'https://api.delovod.ua',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: "packet=" + JSON.stringify(newCustomer),
                        crossDomain: true
                    }).done(function (response) {
                        customerId = JSON.parse(response).id;
                        createOrder();
                    });
                } else {
                    createOrder();
                }


                function createOrder() {
                    let soArguments = {
                        "header": {
                            "firm": 1100400000001001,
                            "person": customerId,
                            "deliveryMethod": 1110400000001001,
                            "deliveryRemark": customerAddress,
                            "storage": 1100700000000001,
                            "paymentForm": paymentType,
                            "remarkFromPerson": orderNote,
                            "state": 1111500000000005
                        },
                        "goods": goods
                    }
                    createSaleOrder(soArguments);

                    $.ajax({
                        type: 'POST',
                        url: 'https://api.delovod.ua',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: "packet=" + JSON.stringify(newSaleOrder),
                        crossDomain: true
                    }).done(function (response) {
                        console.log(response);
                    });
                }
            });

        });
    }
})
$(window).on('resize', function () {
    if ($('body.home').length) {
        loadHomepageVideo();
    }
})


// firm_1100400000001001 - постійне значення
// delivery_1110400000000001 - самовивіз
// delivery_1110400000001001 - нова пошта
// storage_1100700000000001 - основний склад
// storage_1100700000001001 - склад матеріалів
// payment_1110300000000001 - безготівковий розрахунок
// payment_1110300000000002 - оплата готівкою