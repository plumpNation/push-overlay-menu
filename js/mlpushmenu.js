/**
 * mlpushmenu.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2013, Codrops
 * http://www.codrops.com
 *
 * Simplifying and modernising 2016 plumpnation
 */
;(function (window) {
    'use strict';

    // taken from https://github.com/inuyaksa/jquery.nicescroll/blob/master/jquery.nicescroll.js
    function hasParent(e, id) {
        var el;

        if (!e) return false;

        el = e.target || e.srcElement || e || false;

        while (el && el.id != id) {
            el = el.parentNode || false;
        }

        return el !== false;
    }

    // returns the depth of the element "e" relative to element with id=id
    // for this calculation only parents with classname = waypoint are considered
    function getLevelDepth(e, id, waypoint, cnt) {
        cnt = cnt || 0;

        if (e.id.indexOf(id) >= 0) return cnt;

        if (e.classList.contains(waypoint)) {
            ++cnt;
        }

        return e.parentNode && getLevelDepth(e.parentNode, id, waypoint, cnt);
    }

    // returns the closest element to 'e' that has class "classname"
    function closest(e, classname) {
        if (e.classList.contains(classname)) {
            return e;
        }
        return e.parentNode && closest(e.parentNode, classname);
    }

    function mlPushMenu(el, trigger, options) {
        this.el = el;
        this.trigger = trigger;

        this._init();
    }

    mlPushMenu.prototype = {
        options : {
            // space between each overlapped level
            levelSpacing : 40,
            // classname for the element (if any) that when clicked closes the current level
            backClass : 'mp-back'
        },

        _init : function () {
            // if menu is open or not
            this.open = false;

            // level depth
            this.level = 0;

            // the mp-level elements
            this.levels = [].slice.call(this.el.querySelectorAll('.mp-level'));

            // save the depth of each of these mp-level elements
            this.levels.forEach(function (el, i) {
                el.setAttribute('data-level', getLevelDepth(el, this.el.id, 'mp-level'));
            }, this);

            // the menu items
            this.menuItems = [].slice.call(this.el.querySelectorAll('li'));

            // if type == "cover" these will serve as hooks to move back to the previous level
            this.levelBack = [].slice.call(this.el.querySelectorAll('.' + this.options.backClass));

            this.el.classList.add('mp-overlap');

            // initialize / bind the necessary events
            this._initEvents();
        },

        _initEvents : function () {
            var self = this;

            // the menu should close if clicking somewhere on the body
            var bodyClickFn = function (el) {
                self._resetMenu();
                el.removeEventListener('click', bodyClickFn);
            };

            // open (or close) the menu
            this.trigger.addEventListener('click', function (ev) {
                ev.stopPropagation();
                ev.preventDefault();

                if (self.open) {
                    self._resetMenu();

                } else {
                    self._openMenu();
                    // the menu should close if clicking somewhere on the body
                    // (excluding clicks on the menu)
                    document.addEventListener('click', function (ev) {
                        if (self.open && !hasParent(ev.target, self.el.id)) {
                            bodyClickFn(this);
                        }
                    });
                }
            });

            // opening a sub level menu
            this.menuItems.forEach(function (el, i) {
                // check if it has a sub level
                var subLevel = el.querySelector('div.mp-level');

                if (subLevel) {
                    el.querySelector('a').addEventListener('click', function (ev) {
                        var level = closest(el, 'mp-level').getAttribute('data-level');

                        ev.preventDefault();

                        if (self.level <= level) {
                            ev.stopPropagation();

                            closest(el, 'mp-level').classList.add('mp-level-overlay');
                            self._openMenu(subLevel);
                        }
                    });
                }
            });

            // closing the sub levels :
            // by clicking on the visible part of the level element
            this.levels.forEach(function (el, i) {
                el.addEventListener('click', function (ev) {
                    var level = el.getAttribute('data-level');

                    ev.stopPropagation();

                    if (self.level > level) {
                        self.level = level;
                        self._closeMenu();
                    }
                });
            });

            // by clicking on a specific element
            this.levelBack.forEach(function (el, i) {
                el.addEventListener('click', function (ev) {
                    var level = closest(el, 'mp-level').getAttribute('data-level');

                    ev.preventDefault();

                    if (self.level <= level) {
                        ev.stopPropagation();

                        self.level = closest(el, 'mp-level').getAttribute('data-level') - 1;
                        self.level === 0 ? self._resetMenu() : self._closeMenu();
                    }
                });
            });
        },

        _openMenu : function (subLevel) {
            var levelFactor = (this.level) * this.options.levelSpacing,
                translateVal = levelFactor;

            this.level += 1;

            // move the main wrapper
            this._setTransform('translate3d(' + translateVal + 'px, 0, 0)');

            if (subLevel) {
                // reset transform for sublevel
                this._setTransform('', subLevel);

                // need to reset the translate value for the level menus that have the
                // same level depth and are not open
                for (var i = 1, len = this.levels.length; i < len; i += 1) {
                    var levelEl = this.levels[i];

                    if (levelEl != subLevel && !levelEl.classList.contains('mp-level-open')) {
                        this._setTransform(
                            'translate3d(-100%, 0, 0) ' +
                                'translate3d(' + (-1 * levelFactor) + 'px, 0, 0)',

                            levelEl
                        );
                    }
                }
            }

            // add class mp-pushed to main wrapper if opening the first time
            if (this.level === 1) {
                this.open = true;
            }

            // add class mp-level-open to the opening level element
            (subLevel || this.levels[0]).classList.add('mp-level-open');
        },

        // close the menu
        _resetMenu : function () {
            this.level = 0;
            this.open = false;

            this._setTransform('translate3d(-100%, 0, 0)');
            this._toggleLevels();
        },

        // close sub menus
        _closeMenu : function () {
            var translateVal = (this.level - 1) * this.options.levelSpacing;

            this._setTransform('translate3d(' + translateVal + 'px, 0, 0)');
            this._toggleLevels();
        },

        // translate the el
        _setTransform : function (val, el) {
            el = el || this.el;

            el.style.transform = val;
        },

        // removes classes mp-level-open from closing levels
        _toggleLevels : function () {
            var levelEl;

            for (var i = 0, len = this.levels.length; i < len; i += 1) {
                levelEl = this.levels[i];

                if (levelEl.getAttribute('data-level') >= this.level + 1) {
                    levelEl.classList.remove('mp-level-open');
                    levelEl.classList.remove('mp-level-overlay');

                } else if (parseInt(levelEl.getAttribute('data-level'), 10) === this.level) {
                    levelEl.classList.remove('mp-level-overlay');
                }
            }
        }
    }

    // add to global namespace
    window.mlPushMenu = mlPushMenu;

})(window);
