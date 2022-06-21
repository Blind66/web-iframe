/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
if (window.Element && !Element.prototype.closest) {
    // eslint valid-jsdoc: "off"
    Element.prototype.closest =
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var el      = this;
            var i;
            do {
                i = matches.length;
                while (--i >= 0 && matches.item(i) !== el) {
                    // continue
                }
            } while ((i < 0) && (el = el.parentElement));
            return el;
        };
}

if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i       = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                // continue
            }
            return i > -1;
        };
}

if (!Object.assign) {
    Object.assign = function(target, varArgs) { // .length of function is 2
        "use strict";
        if (target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

(function(arr) {
    "use strict";
    arr.forEach(function(item) {
        if (item.hasOwnProperty("remove")) {
            return;
        }
        Object.defineProperty(item, "remove", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var devicePixelRatio = window.devicePixelRatio || 1;

    function SmartImage(noScriptElement, options) {
        var that = this;
        var showsLazyLoader = false;
        var image;
        var container;
        var anchor;
        var dropContainer;
        var initDone = false;

        that.defaults = {
            loadHidden: false,
            imageSelector: "img",
            containerSelector: ".cmp-image",
            sourceAttribute: "src",
            lazyEnabled: true,
            lazyThreshold: 0,
            lazyEmptyPixel: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            lazyLoaderClass: "loading",
            lazyLoaderStyle: {
                "height": 0,
                "padding-bottom": "" // will get replaced with ratio in %
            }
        };

        function init() {
            var tmp = document.createElement("div");
            tmp.innerHTML = decodeNoScript(noScriptElement.textContent.trim());
            var imageElement = tmp.firstElementChild;
            var source = imageElement.getAttribute(options.sourceAttribute);
            imageElement.removeAttribute(options.sourceAttribute);
            imageElement.setAttribute("data-src-disabled", source);
            container.insertBefore(imageElement, noScriptElement);
            noScriptElement.remove();

            if (container.matches(options.imageSelector)) {
                image = container;
            } else {
                image = imageElement;
            }

            that.container = container;
            that.options = options;
            that.image = image;
            if (options.lazyEnabled) {
                addLazyLoader();
            }
            window.addEventListener("scroll", that.update);
            window.addEventListener("resize", that.update);
            window.addEventListener("update", that.update);
            image.addEventListener("cmp-image-redraw", that.update);
            that.update();
        }

        function loadImage() {
            if (options.smartSizes && options.smartImages && options.smartSizes.length > 0) {
                if (options.smartSizes.length === options.smartImages.length) {
                    var containerWidth = 0;

                    if (container.tagName.toLowerCase() === "a") {
                        containerWidth = container.parentElement.clientWidth;
                    } else {
                        containerWidth = container.clientWidth;
                    }
                    var optimalSize = containerWidth * devicePixelRatio;
                    var len = options.smartSizes.length;
                    var key = 0;

                    while ((key < len - 1) && (options.smartSizes[key] < optimalSize)) {
                        key++;
                    }

                    if (image.getAttribute(options.sourceAttribute) !== options.smartImages[key]) {
                        image.setAttribute(options.sourceAttribute, options.smartImages[key]);
                        image.removeAttribute("data-src-disabled");
                        window.removeEventListener("scroll", that.update);
                    }
                }
            } else {
                if (!initDone) {
                    image.setAttribute(options.sourceAttribute, image.getAttribute("data-src-disabled"));
                    image.removeAttribute("data-src-disabled");
                    window.removeEventListener("scroll", that.update);
                    initDone = true;
                }
            }

            if (showsLazyLoader) {
                image.addEventListener("load", removeLazyLoader);
            }
        }

        function addLazyLoader() {
            var width = image.getAttribute("width");
            var height = image.getAttribute("height");
            if (width && height) {
                var ratio = (height / width) * 100;
                var styles = options.lazyLoaderStyle;
                styles["padding-bottom"] = ratio + "%";
                for (var s in styles) {
                    if (styles.hasOwnProperty(s)) {
                        image.style[s] = styles[s];
                    }
                }
            }
            image.setAttribute(options.sourceAttribute, options.lazyEmptyPixel);
            image.classList.add(options.lazyLoaderClass);
            showsLazyLoader = true;
        }

        function removeLazyLoader() {
            image.classList.remove(options.lazyLoaderClass);
            for (var property in options.lazyLoaderStyle) {
                if (options.lazyLoaderStyle.hasOwnProperty(property)) {
                    image.style[property] = "";
                }
            }
            image.removeEventListener("load", removeLazyLoader);
            showsLazyLoader = false;
        }

        function isLazyVisible() {

            if (container.offsetParent === null) {
                return false;
            }

            var wt = window.pageYOffset;
            var wb = wt + document.documentElement.clientHeight;
            var et = container.getBoundingClientRect().top + wt;
            var eb = et + container.clientHeight;

            return eb >= wt - options.lazyThreshold && et <= wb + options.lazyThreshold;
        }

        that.update = function() {
            if (options.lazyEnabled) {
                if (isLazyVisible() || options.loadHidden) {
                    loadImage();
                }
            } else {
                loadImage();
            }
        };

        options = Object.assign(that.defaults, options);

        container = noScriptElement.closest(options.containerSelector);
        if (container) {
            dropContainer = noScriptElement.closest(".cq-dd-image");
            if (dropContainer) {
                container = dropContainer;
            }
            anchor = container.querySelector(".cmp-image--link");
            if (anchor !== null) {
                container = anchor;
            }
            init();
        }
    }

    document.addEventListener("DOMContentLoaded", function() {

        var imageElements = document.querySelectorAll("noscript[data-cmp-image]");
        var images        = [];
        for (var index = 0; index < imageElements.length; index++) {
            var noScriptElement = imageElements[index];
            var imageOptions    = noScriptElement.dataset.cmpImage;
            noScriptElement.removeAttribute("data-cmp-image");
            images.push(new SmartImage(noScriptElement, JSON.parse(imageOptions)));
        }
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var noScriptArray = [].slice.call(addedNode.querySelectorAll("noscript[data-cmp-image]"));
                            noScriptArray.forEach(function(noScriptElement) {
                                var imageOptions = JSON.parse(noScriptElement.dataset.cmpImage);
                                noScriptElement.removeAttribute("data-cmp-image");
                                images.push(new SmartImage(noScriptElement, imageOptions));
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    });

    /*
         on drag & drop of the component into a parsys, noscript's content will be escaped multiple times by the editor which creates
         the DOM for editing; the HTML parser cannot be used here due to the multiple escaping
     */
    function decodeNoScript(text) {
        text = text.replace(/&(amp;)*lt;/g, "<");
        text = text.replace(/&(amp;)*gt;/g, ">");
        return text;
    }
})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    function documentReady(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    var INPUT_FIELD = ".cmp-form-field input";
    var REQUIRED_MSG_ATTRIBUTE = "data-cmp-required";
    var CONSTRAINT_MSG_ATTRIBUTE = "data-cmp-constraint";

    documentReady(function() {
        var inputFields = document.querySelectorAll(INPUT_FIELD);
        var inputField;
        var index;

        for (index = 0; index < inputFields.length; index++) {
            inputField = inputFields[index];
            inputField.addEventListener("invalid", function(e) {
                e.target.setCustomValidity("");
                if (e.target.validity.typeMismatch) {
                    if (inputField.hasAttribute(CONSTRAINT_MSG_ATTRIBUTE)) {
                        e.target.setCustomValidity(inputField.getAttribute(CONSTRAINT_MSG_ATTRIBUTE));
                    }
                } else if (e.target.validity.valueMissing) {
                    if (inputField.hasAttribute(REQUIRED_MSG_ATTRIBUTE)) {
                        e.target.setCustomValidity(inputField.getAttribute(REQUIRED_MSG_ATTRIBUTE));
                    }
                }
            });
            inputField.addEventListener("input", function(e) {
                e.target.setCustomValidity("");
            });
        }
    });

})();

/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.3.7
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.3.7'

  Alert.TRANSITION_DURATION = 150

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = $(selector === '#' ? [] : selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.closest('.alert')
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.3.7
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.3.7'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state += 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state])

      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d).prop(d, true)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d).prop(d, false)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) changed = false
        $parent.find('.active').removeClass('active')
        this.$element.addClass('active')
      } else if ($input.prop('type') == 'checkbox') {
        if (($input.prop('checked')) !== this.$element.hasClass('active')) changed = false
        this.$element.toggleClass('active')
      }
      $input.prop('checked', this.$element.hasClass('active'))
      if (changed) $input.trigger('change')
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'))
      this.$element.toggleClass('active')
    }
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document)
    .on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      var $btn = $(e.target).closest('.btn')
      Plugin.call($btn, 'toggle')
      if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
        // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
        e.preventDefault()
        // The target component still receive the focus
        if ($btn.is('input,button')) $btn.trigger('focus')
        else $btn.find('input:visible,button:visible').first().trigger('focus')
      }
    })
    .on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type))
    })

}(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.3.7
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options     = options
    this.paused      = null
    this.sliding     = null
    this.interval    = null
    this.$active     = null
    this.$items      = null

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this))

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '3.3.7'

  Carousel.TRANSITION_DURATION = 600

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  }

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active)
    var willWrap = (direction == 'prev' && activeIndex === 0)
                || (direction == 'next' && activeIndex == (this.$items.length - 1))
    if (willWrap && !this.options.wrap) return active
    var delta = direction == 'prev' ? -1 : 1
    var itemIndex = (activeIndex + delta) % this.$items.length
    return this.$items.eq(itemIndex)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.bs.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || this.getItemForDirection(type, $active)
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var that      = this

    if ($next.hasClass('active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('active')
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () {
            that.$element.trigger(slidEvent)
          }, 0)
        })
        .emulateTransitionEnd(Carousel.TRANSITION_DURATION)
    } else {
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.carousel

  $.fn.carousel             = Plugin
  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var href
    var $this   = $(this)
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
    if (!$target.hasClass('carousel')) return
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  }

  $(document)
    .on('click.bs.carousel.data-api', '[data-slide]', clickHandler)
    .on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler)

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.$trigger      = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                           '[data-toggle="collapse"][data-target="#' + element.id + '"]')
    this.transitioning = null

    if (this.options.parent) {
      this.$parent = this.getParent()
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger)
    }

    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '3.3.7'

  Collapse.TRANSITION_DURATION = 350

  Collapse.DEFAULTS = {
    toggle: true
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return

    var activesData
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing')

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse')
      if (activesData && activesData.transitioning) return
    }

    var startEvent = $.Event('show.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    if (actives && actives.length) {
      Plugin.call(actives, 'hide')
      activesData || actives.data('bs.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)
      .attr('aria-expanded', true)

    this.$trigger
      .removeClass('collapsed')
      .attr('aria-expanded', true)

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return

    var startEvent = $.Event('hide.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('collapsing')
      .removeClass('collapse in')
      .attr('aria-expanded', false)

    this.$trigger
      .addClass('collapsed')
      .attr('aria-expanded', false)

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']()
  }

  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element)
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element)
      }, this))
      .end()
  }

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in')

    $element.attr('aria-expanded', isOpen)
    $trigger
      .toggleClass('collapsed', !isOpen)
      .attr('aria-expanded', isOpen)
  }

  function getTargetFromTrigger($trigger) {
    var href
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

    return $(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin
  $.fn.collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this   = $(this)

    if (!$this.attr('data-target')) e.preventDefault()

    var $target = getTargetFromTrigger($this)
    var data    = $target.data('bs.collapse')
    var option  = data ? 'toggle' : $this.data()

    Plugin.call($target, option)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.3.7'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget))
    })
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget))
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a'
    var $items = $parent.find('.dropdown-menu' + desc)

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--         // up
    if (e.which == 40 && index < $items.length - 1) index++         // down
    if (!~index)                                    index = 0

    $items.eq(index).trigger('focus')
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown)

}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options             = options
    this.$body               = $(document.body)
    this.$element            = $(element)
    this.$dialog             = this.$element.find('.modal-dialog')
    this.$backdrop           = null
    this.isShown             = null
    this.originalBodyPad     = null
    this.scrollbarWidth      = 0
    this.ignoreBackdropClick = false

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.3.7'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.setScrollbar()
    this.$body.addClass('modal-open')

    this.escape()
    this.resize()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
      })
    })

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      that.adjustDialog()

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element.addClass('in')

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$dialog // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()
    this.resize()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal')

    this.$dialog.off('mousedown.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (document !== e.target &&
            this.$element[0] !== e.target &&
            !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal')
    }
  }

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
    } else {
      $(window).off('resize.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$body.removeClass('modal-open')
      that.resetAdjustments()
      that.resetScrollbar()
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $(document.createElement('div'))
        .addClass('modal-backdrop ' + animate)
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false
          return
        }
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide()
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog()
  }

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    })
  }

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    })
  }

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth
    if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect()
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    this.originalBodyPad = document.body.style.paddingRight || ''
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad)
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       = null
    this.options    = null
    this.enabled    = null
    this.timeout    = null
    this.hoverState = null
    this.$element   = null
    this.inState    = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.3.7'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
    this.inState   = { click: false, hover: false, focus: false }

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
    }

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in'
      return
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true
    }

    return false
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
    }

    if (self.isInStateTrue()) return

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
      this.$element.trigger('inserted.bs.' + this.type)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var viewportDim = this.getPosition(this.$viewport)

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  += marginTop
    offset.left += marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /top|bottom/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow()
      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isVertical ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = $(this.$tip)
    var e    = $.Event('hide.bs.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      if (that.$element) { // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element
          .removeAttr('aria-describedby')
          .trigger('hidden.bs.' + that.type)
      }
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && $tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset())
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template)
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
      }
    }
    return this.$tip
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    if (e) {
      self.inState.click = !self.inState.click
      if (self.isInStateTrue()) self.enter(self)
      else self.leave(self)
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
    }
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type)
      if (that.$tip) {
        that.$tip.detach()
      }
      that.$tip = null
      that.$arrow = null
      that.$viewport = null
      that.$element = null
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.3.7'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.7
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body          = $(document.body)
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.selector       = (this.options.target || '') + ' .nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this))
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '3.3.7'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var that          = this
    var offsetMethod  = 'offset'
    var offsetBase    = 0

    this.offsets      = []
    this.targets      = []
    this.scrollHeight = this.getScrollHeight()

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        that.offsets.push(this[0])
        that.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null
      return this.clear()
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target

    this.clear()

    var selector = this.selector +
      '[data-target="' + target + '"],' +
      this.selector + '[href="' + target + '"]'

    var active = $(selector)
      .parents('li')
      .addClass('active')

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active')
    }

    active.trigger('activate.bs.scrollspy')
  }

  ScrollSpy.prototype.clear = function () {
    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.scrollspy

  $.fn.scrollspy             = Plugin
  $.fn.scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element)
    // jscs:enable requireDollarBeforejQueryAssignment
  }

  Tab.VERSION = '3.3.7'

  Tab.TRANSITION_DURATION = 150

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var $previous = $ul.find('.active:last a')
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    })
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    })

    $previous.trigger(hideEvent)
    $this.trigger(showEvent)

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      })
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length)

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
          .removeClass('active')
        .end()
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', false)

      element
        .addClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', true)

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu').length) {
        element
          .closest('li.dropdown')
            .addClass('active')
          .end()
          .find('[data-toggle="tab"]')
            .attr('aria-expanded', true)
      }

      callback && callback()
    }

    $active.length && transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  var clickHandler = function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  }

  $(document)
    .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)
    .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler)

}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      = null
    this.unpin        = null
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.3.7'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var targetHeight = this.$target.height()

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null
    var colliderTop    = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height       = this.$element.height()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = Math.max($(document).height(), $(document.body).height())

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '')

      var affixType = 'affix' + (affix ? '-' + affix : '')
      var e         = $.Event(affixType + '.bs.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop    != null) data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

jQuery.ui.autocomplete.prototype._resizeMenu = function () {
  var ul = this.menu.element;
  ul.outerWidth(this.element.outerWidth());
};
$('.collapsable-container h2').on('click', function(e){
  $(this).toggleClass('expanded');
});
$('.collapsable-container h2').first().addClass('expanded');
window.dtvResponsive = {
    isMobile: function( ) {
        return window.innerWidth < 768;
    }
};
$('.open-watson-btn').click(function() {
    if ($('.watson-container').length > 0) {
        $('.watson-container').removeClass('hidden');
        $('.watson-container .chat .card').removeClass('no-display');
    }
});

$('.open-watson-btn button').click(function() {
    if ($('.watson-container').length > 0) {
        $('.watson-container').removeClass('hidden');
        $('.watson-container .chat .card').removeClass('no-display');
    }
});

$('.link-container a.ant-action.ant-link').click(function(e) {
    e.preventDefault();
    const el = e.target;
    let url = $(el).attr('href');
    const target = $(el).attr('target');

    // if (url.indexOf('https') <= -1 && url.indexOf('.html') <= -1) {
    //     url = url + '.html';
    // }

    if (target == '_blank') {
        window.open(url);
    } else {
        location.href = url;
    }

})
$('.open-watson-btn').click(function() {
    if ($('.watson-container').length > 0) {
        $('.watson-container').removeClass('hidden');
        $('.watson-container .chat .card').removeClass('no-display');
    }
});

$('.open-watson-btn button').click(function() {
    if ($('.watson-container').length > 0) {
        $('.watson-container').removeClass('hidden');
        $('.watson-container .chat .card').removeClass('no-display');
    }
});

$('a.button-wrapper.ant-action.ant-button').click(function(e) {
    console.log('a');
    e.preventDefault();
    const el = e.target;
    if ($(el).hasClass('button-wrapper') && !$(el).hasClass('open-watson-btn')) {
        openLink(el);
    } else {
        if ($(el).parent().hasClass('button-wrapper') && !$(el).parent().hasClass('open-watson-btn')) {
            openLink($(el).parent());
        }
    }

})

function openLink(el) {
    let url = $(el).attr('href');
    const target = $(el).attr('target');

    // if (url.indexOf('https') <= -1 && url.indexOf('.html') <= -1) {
    //     url = url + '.html';
    // }

    if (target == '_blank') {
        window.open(url);
    } else {
        location.href = url;
    }
}

$(document).ready(function () {
    $('.cmp-stepbystep').on('click', '.step-title', function (e) {
        var itemContainer = $(this).parent();
        if(itemContainer.hasClass('active')){
            itemContainer.removeClass('active');
        } else {
          itemContainer.addClass('active');  
        };

        if($('.step-item').hasClass('active')){
            $('.step-show-all').removeClass('show').addClass('hide');
            $('.step-show-all').next('.step-hide-all').addClass('show');
        } else {
            $('.step-hide-all').removeClass('show').addClass('hide');
            $('.step-hide-all').prev('.step-show-all').addClass('show'); 
        };
    });

    $('.cmp-stepbystep').on('click', '.step-show-all', function (e) {
        $(this).parent().find('.step-list').find('.step-item').addClass('active');
        $(this).removeClass('show').addClass('hide');
        $(this).next('.step-hide-all').addClass('show');
    });

    $('.cmp-stepbystep').on('click', '.step-hide-all', function (e) {
        $(this).parent().find('.step-list').find('.step-item').removeClass('active');
        $(this).removeClass('show').addClass('hide');
        $(this).prev('.step-show-all').addClass('show');
    });
});

$(document).ready(function () {
    tag = $(".cmp-search-result--count");
    if (tag.attr("data-total") == "0" && tag.attr("data-redirect") == "") {
        location.replace(tag.attr("data-result-no-data-page") + ".html?q=" + tag.attr("data-term"))
    }
});


$('.search-value').autocomplete({
    source: function (request, response) {
        $.getJSON(`/bin/directv/autocomplete.${cdsCountry}.json/${request.term}`, function (data) {
            response(data);
        });
    },
    select: function (event, ui) {
        $('.search-value').val(ui.item.value);
        $('.search-form').submit();
    },
    appendTo: ".directv-site",
    minLength: 1,
    delay: 100,
    messages: {
        noResults: '',
        results: function () {
        }
    }
});

$(".link-previous").on('click', function (e) {
    $(".form-previous").submit();

});

$(".link-next").on('click', function (e) {
    $(".form-next").submit();

});

$(".current-number").on('click', function (e) {
    $("#number").val(+$.trim($(this).text()));
    $(".form-number").submit();
});

$('.search-value').autocomplete({
    source: function (request, response) {
        $.getJSON(`/bin/directv/autocomplete.${cdsCountry}.json/${request.term}`, function (data) {
            response(data);
        });
    },
    select: function (event, ui) {
        $('.search-value').val(ui.item.value);
        $('.search-form').submit();
    },
    appendTo: ".directv-site",
    minLength: 1,
    delay: 100,
    messages: {
        noResults: '',
        results: function () {
        }
    }
});

$(document).ready(function () {
    $('.remote-control-codes').on('click', '.codes-send-btn', function (e) {
        let brand = $('#remotebrand').val();
        if(brand !== '') {
            $('.remote-control-codes-list ul').removeClass('active');
            $('.remote-control-codes-list').find('#'+brand).addClass('active');
        };
    });
});

$(document).ready(function () {
    saveRating();
});


function renderRatingTemplate(container, data) {

    let templateScript = $("#rating-template").html();
    let template = Handlebars.compile(templateScript);

    let compiledHtml = template(data);
    $(container).html(compiledHtml);


}

function saveRating() {


    $('body').on('click', '.feedback-negative', function (e) {
        e.preventDefault();
        $(this).addClass('active');
        $(this).closest('.feedback').find('.feedback-form').addClass('active');
    });

    $('body').on('click', '.feedback-positive', function (e) {
        e.preventDefault();
        ans = 'yes';
        page = $(this).closest('.feedback').find('.feedback-form').attr("data-pagepath");
        feedbackElement = $(this).closest('.feedback');
        thanks = '<p class="thanks">¡Gracias por tu opinión!</p>';

        var datasend = {answer: ans, currentpage: page};
        $.ajax({
            dataType: "json",
            url: "/bin/directv/rating.json",
            data: datasend
        }).done(function (data) {
            console.log(data);
            feedbackElement.html(thanks);
        });

    });

    $('body').on('click', '.cancel-btn', function (e) {
        e.preventDefault();
        $(this).closest('.feedback').find('.feedback-form').removeClass('active');
        $(this).closest('.feedback').find('.feedback-negative').removeClass('active');
    });
    $('body').on('click', '.send-btn', function (e) {
        e.preventDefault();
        ans = 'not';
        page = $(this).closest('.feedback').find('.feedback-form').attr("data-pagepath");
        reasonnum = $(this).closest('.feedback').find('.reason').val();
        if (reasonnum == null || reasonnum == "") {
            alert("Seleccione un razón por favor");
            return;
        }
        desc = $(this).closest('.feedback').find('.comments').val();
        feedbackElement = $(this).closest('.feedback');
        thanks = '<p class="thanks">¡Gracias por tu opinión!</p>';

        var datasend = {answer: ans, currentpage: page, reason: reasonnum, description: desc};
        $.ajax({
            dataType: "json",
            url: "/bin/directv/rating.json",
            data: datasend
        }).done(function (data) {
            console.log(data);
            feedbackElement.html(thanks);
        });

        $(this).closest('.feedback').find('.feedback-form').removeClass('active');
        $(this).closest('.feedback').find('.feedback-negative').removeClass('active');

        $(this).closest('.feedback').find('.reason').val("");
        $(this).closest('.feedback').find('.comments').val("");
    });

}



$(document).ready(function () {
	multiTab();
});

var multiTab = function() {
	$('li:first-child .tab-title').addClass('active');

    $('.cmp-multitab').on('click', '.tab-title a', function (e) {
        e.preventDefault();
        var tabId = $(this).attr('href');
        $('.tab-title.active').removeClass('active');
        $('.tab-content').css('display', 'none');

        $(this).parent().addClass('active');
        $(this).closest('.tab-title-container').closest('.tab-wrapper').next('.tab-content-container').find(tabId).css('display', 'block');
    });

    /*horizontal scroll*/
    var scrollBarWidths = 40;

    var widthOfList = function(){
      var itemsWidth = 0;
      $('.list li').each(function(){
        var itemWidth = $(this).outerWidth();
        $(this).attr('data-item-width', itemWidth);
        itemsWidth+=itemWidth;
      });
      $('.list li:first-child').addClass('active');
      return itemsWidth;
    };
    var widthOfHidden = function(){
      return (($('.tab-wrapper').outerWidth())-widthOfList()-getLeftPosi())-scrollBarWidths;
    };

    var getLeftPosi = function(){
      return $('.list').position().left;
    };

    $('.scroller-left').css('visibility', 'hidden');

    widthOfList();

    $('.scroller-right').click(function() {
      $('.scroller-left').css('visibility', 'visible');

      var amount = $('.list li.active').data('item-width');
      var active = $('.list li.active');
      var next = active.next();

      active.removeClass('active');
      next.addClass('active');

      $('.list').animate({left:"-="+amount+"px"},'slow',function(){
        if(getLeftPosi() <= widthOfHidden()) {
          $('.scroller-right').css('visibility', 'hidden');
        } 
      });
    });

    $('.scroller-left').click(function() {
      $('.scroller-right').css('visibility', 'visible');

      var amount = $('.list li.active').data('item-width');
      var active = $('.list li.active');
      var prev = active.prev();

      active.removeClass('active');
      prev.addClass('active');

      $('.list').animate({left:"+="+amount+"px"},'slow',function(){
        if(getLeftPosi() >= 0) {
          $('.scroller-left').css('visibility', 'hidden');
        }
      });
    });
}
    
$(".cmp-category--nav-item > a:not(.item-internal), .cmp-category--nav-subitem > a:not(.item-internal)").on('click', function(e) {
    e.preventDefault();

    console.log(e);

    let isSubItem = true,
        hasSubItems = false,
        $parent = $(this).parent(),
        $list = $(this).closest('.cmp-category--nav'),
        $result = $('#result'),
        $noCategory = $('.cmp-category--no-category'),
        alreadyActive = $parent.hasClass('active'),
        cont = $parent.attr("data-path"),
        contentType = $(".cmp-category").attr("data-contenttype"),
        title = $parent.attr("data-title"),
        isMobile = window.dtvResponsive.isMobile(),
        seeMore = false;

    if ($parent.hasClass('cmp-category--nav-item')) {
        isSubItem = false;
        hasSubItems = $parent.hasClass('cmp-category--nav-item_with-subitems');
        if (alreadyActive) {
            if (!hasSubItems && !isMobile) {
                return;
            }
            $(".cmp-category--nav-subitem.active").removeClass("active");
            $parent.removeClass('has-active');
            $parent.removeClass('active');
            $list.removeClass('has-active');
            $result.empty();
        } else {
            $(".cmp-category--nav-item.active, .cmp-category--nav-subitem.active").removeClass("active");
            $parent.addClass("active");
            $list.addClass('has-active');
        }
    } else {
        if (alreadyActive && isMobile) {
            $parent.removeClass("active");
            $parent.parent().parent().removeClass('has-active');
            $result.empty();
        } else {
            $(".cmp-category--nav-subitem.active").removeClass("active");
            $parent.addClass("active");
            $parent.parent().parent().addClass('has-active');
        }
    }
    if (!alreadyActive && !hasSubItems) {
        var datasend = { nodepath: cont, type: contentType };
        $.ajax({
            dataType: "json",
            url: "/bin/directv/menusubcategories.json",
            data: datasend
        }).done(function(data) {
            $result.empty();

            var items = [];
            if (contentType == 'articles') {
                $.each(data, function(key, val) {
                    /*key 3 = 4º item*/
                    let description = typeof val.description != 'undefined' ? val.description : "";
                    let title = typeof val.title != 'undefined' ? val.title : "";
                    if (isMobile && (key > 3)) {
                        items.push(`
                            <a href="${val.path}.html" class="see-more cmp-category--content-item">
                                <div class="cmp-category--content-item-icon">
                                    <span class="dtv-cds-icon-${val.imagePath}"></span>
                                </div>
                                <div class="cmp-category--content-item-title">
                                    ${title}
                                </div>
                                <div class="cmp-category--content-item-text">
                                    ${description}
                                </div>
                            </a>
                        `);

                        seeMore = true;
                    } else {
                        items.push(`
                        <a href="${val.path}.html" class="cmp-category--content-item">
                            <div class="cmp-category--content-item-icon">
                                <span class="dtv-cds-icon-${val.imagePath}"></span>
                            </div>
                            <div class="cmp-category--content-item-title">
                                ${title}
                            </div>
                            <div class="cmp-category--content-item-text">
                                ${description}
                            </div>
                        </a>
                    `);
                    }
                });
            } else if (contentType == 'faqs') {
                $.each(data, function(key, val) {
                    let question = typeof val.question != 'undefined' ? val.question : "";
                    let answer = typeof val.answer != 'undefined' ? val.answer : "";
                    items.push(`
                        <div data-href="${val.path}.html" class="cmp-category--content-item faq-item">
                            <div class="cmp-category--content-item-title">
                                ${question}
                            </div>
                            <div class="faq-collapsable">
                                <div class="cmp-category--content-item-text">
                                    ${answer}
                                </div>
                                ${renderRatingFAQ({label: '¿Te fue útil esta respuesta?', path: val.path})}
                            </div>

                        </div>
                    `);
                });
            }

            if (seeMore) {
                $result.html(`
                    <div class="cmp-category--content-title">
                        ${title}
                    </div>
                    ${items.join('')}
                    <a class="see-more-link">Ver Más</a>
                `);
            } else {
                $result.html(`
                    <div class="cmp-category--content-title">
                        ${title}
                    </div>
                    ${items.join('')}
                `);
            }
        });
    }

    setTimeout(function() {
        openItemIfUrlParm();
    }, 200);
});

var openItemIfUrlParm = function() {
    var pathArray = window.location.href.split('#');
    var itemNameParm = pathArray[1];
    var faqItem = $('.cmp-category--content-item.faq-item[data-href*="' + itemNameParm + '"]');

    faqItem.find('.cmp-category--content-item-title').click();
}

$(document).ready(function() {

    if (!window.dtvResponsive.isMobile() || $('.cmp-category').attr('data-expand') == 'true') {
        if (window.location.hash != "") {
            let category = $(`[data-path$='${window.location.hash.substr(1)}']`);
            category.parents("[data-path]").each(function() {
                $(this).find("a").first().click();
            });
            category.find("a").first().click();
        } else {
            $(".cmp-category--nav-item > a").first().click();
        }
    }

    $('.cmp-category').on('click', 'a.see-more-link', function(e) {
        $('.cmp-category a.see-more').removeClass('see-more');
        this.remove();
    });

    $('.cmp-category').on('click', '.faq-item .cmp-category--content-item-title', function(e) {
        $(this).toggleClass('expanded');
    });

});


function renderRatingFAQ(data) {

    let templateScript = $("#rating-template").html();
    let template = Handlebars.compile(templateScript);
    let compiledHtml = template(data);
    return compiledHtml;

}
$( document ).ready(function() {
  let templateScript = $("#looking-for-template").html();
  let template = Handlebars.compile(templateScript);
  let country = $('.looking-for-placeholder').attr("data-country");
  if (country != null && country != ""){
    $.get(`/bin/directv/topVisitedArticles.${country}.json`, function(data){
      if (data.length == 0){
        data = [
          {title: "¿Cómo Programar el Control Remoto?", description: "¿Cómo Programar el Control Remoto?", path: "#"},
          {title: "Errores en Pantalla", description: "Errores en Pantalla", path: "#"},
          {title: "No Entiendo Mi Factura", description: "No Entiendo Mi Factura", path: "#"},
          {title: "Quiero Recargar", description: "Quiero Recargar", path: "#"},
          {title: "Perdí mi SmartCard, ¿Qué Hago?", description: "Perdí mi SmartCard, ¿Qué Hago?", path: "#"}
        ];
      }
      for (var i = 0; i < data.length; i++){
        data[i].path = data[i].path.replace("home/","");
      }
      let context = { articles: data.slice(0, 5) };
      let compiledHtml = template(context);
      $('.looking-for-placeholder').html(compiledHtml);
    });
  }
});

$(document).ready(function () { 
    let optionsComponent = $('.cmp-options');
    let optionsContentDisplayer = $('.cmp-contentdisplayer');
    let componentName = $('.contentdisplayer-list').attr("data-componentname");

    if(optionsComponent && optionsContentDisplayer) {
    	$('.cmp-options select[name='+componentName+']').change(function(e){
	       let componentListValue = $(this).val();
	       let componentList = $('.contentdisplayer-list[data-componentname='+componentName+']');
	       componentList.find('.contentdisplayer-item.active').removeClass('active');
	       componentList.find('.contentdisplayer-item[data-value='+componentListValue+']').addClass('active');
	    });
        $('.cmp-options select[name='+componentName+']').change();
    };
});

/* ----------------------------------------------------------------------
*
* Usage:
*   <script src="isaac.js"></script>
*   var random_number = isaac.random();
*
* Output: [ 0x00000000; 0xffffffff]
*         [-2147483648; 2147483647]
*
*/


/* js string (ucs-2/utf16) to a 32-bit integer (utf-8 chars, little-endian) array */
String.prototype.toIntArray = function() {
    var w1, w2, u, r4 = [], r = [], i = 0;
    var s = this + '\0\0\0'; // pad string to avoid discarding last chars
    var l = s.length - 1;
   
    while(i < l) {
      w1 = s.charCodeAt(i++);
      w2 = s.charCodeAt(i+1);
      if       (w1 < 0x0080) {
        // 0x0000 - 0x007f code point: basic ascii
        r4.push(w1);
      } else if(w1 < 0x0800) {
        // 0x0080 - 0x07ff code point
        r4.push(((w1 >>>  6) & 0x1f) | 0xc0);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if((w1 & 0xf800) != 0xd800) {
        // 0x0800 - 0xd7ff / 0xe000 - 0xffff code point
        r4.push(((w1 >>> 12) & 0x0f) | 0xe0);
        r4.push(((w1 >>>  6) & 0x3f) | 0x80);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if(((w1 & 0xfc00) == 0xd800)
             && ((w2 & 0xfc00) == 0xdc00)) {
        // 0xd800 - 0xdfff surrogate / 0x10ffff - 0x10000 code point
        u = ((w2 & 0x3f) | ((w1 & 0x3f) << 10)) + 0x10000;
        r4.push(((u >>> 18) & 0x07) | 0xf0);
        r4.push(((u >>> 12) & 0x3f) | 0x80);
        r4.push(((u >>>  6) & 0x3f) | 0x80);
        r4.push(((u >>>  0) & 0x3f) | 0x80);
        i++;
      } else {
        // invalid char
      }
      /* add integer (four utf-8 value) to array */
      if(r4.length > 3) {
        // little endian
        r.push((r4.shift() <<  0) | (r4.shift() <<  8) |
               (r4.shift() << 16) | (r4.shift() << 24));
      }
    }
   
    return r;
   }
   
   /* isaac module pattern */
   var isaac = (function(){
   
    /* private: internal states */
    var m = Array(256), // internal memory
        acc = 0,        // accumulator
        brs = 0,        // last result
        cnt = 0,        // counter
        r = Array(256), // result array
        gnt = 0;        // generation counter
   
    seed(Math.random() * 0xffffffff);
   
    /* private: 32-bit integer safe adder */
    function add(x, y) {
      var lsb = (x & 0xffff) + (y & 0xffff);
      var msb = (x >>>   16) + (y >>>   16) + (lsb >>> 16);
      return (msb << 16) | (lsb & 0xffff);
    }
   
    /* public: initialisation */
    function reset() {
      acc = brs = cnt = 0;
      for(var i = 0; i < 256; ++i)
        m[i] = r[i] = 0;
      gnt = 0;
    }
   
    /* public: seeding function */
    function seed(s) {
      var a, b, c, d, e, f, g, h, i;
   
      /* seeding the seeds of love */
      a = b = c = d =
      e = f = g = h = 0x9e3779b9; /* the golden ratio */
   
      if(s && typeof(s) === 'string')
        s = s.toIntArray();
   
      if(s && typeof(s) === 'number') {
        s = [s];
      }
   
      if(s instanceof Array) {
        reset();
        for(i = 0; i < s.length; i++)
          r[i & 0xff] += (typeof(s[i]) === 'number') ? s[i] : 0;
      }
   
      /* private: seed mixer */
      function seed_mix() {
        a ^= b <<  11; d = add(d, a); b = add(b, c);
        b ^= c >>>  2; e = add(e, b); c = add(c, d);
        c ^= d <<   8; f = add(f, c); d = add(d, e);
        d ^= e >>> 16; g = add(g, d); e = add(e, f);
        e ^= f <<  10; h = add(h, e); f = add(f, g);
        f ^= g >>>  4; a = add(a, f); g = add(g, h);
        g ^= h <<   8; b = add(b, g); h = add(h, a);
        h ^= a >>>  9; c = add(c, h); a = add(a, b);
      }
   
      for(i = 0; i < 4; i++) /* scramble it */
        seed_mix();
   
      for(i = 0; i < 256; i += 8) {
        if(s) { /* use all the information in the seed */
          a = add(a, r[i + 0]); b = add(b, r[i + 1]);
          c = add(c, r[i + 2]); d = add(d, r[i + 3]);
          e = add(e, r[i + 4]); f = add(f, r[i + 5]);
          g = add(g, r[i + 6]); h = add(h, r[i + 7]);
        }
        seed_mix();
        /* fill in m[] with messy stuff */
        m[i + 0] = a; m[i + 1] = b; m[i + 2] = c; m[i + 3] = d;
        m[i + 4] = e; m[i + 5] = f; m[i + 6] = g; m[i + 7] = h;
      }
      if(s) {
        /* do a second pass to make all of the seed affect all of m[] */
        for(i = 0; i < 256; i += 8) {
          a = add(a, m[i + 0]); b = add(b, m[i + 1]);
          c = add(c, m[i + 2]); d = add(d, m[i + 3]);
          e = add(e, m[i + 4]); f = add(f, m[i + 5]);
          g = add(g, m[i + 6]); h = add(h, m[i + 7]);
          seed_mix();
          /* fill in m[] with messy stuff (again) */
          m[i + 0] = a; m[i + 1] = b; m[i + 2] = c; m[i + 3] = d;
          m[i + 4] = e; m[i + 5] = f; m[i + 6] = g; m[i + 7] = h;
        }
      }
   
      prng(); /* fill in the first set of results */
      gnt = 256;  /* prepare to use the first set of results */;
    }
   
    /* public: isaac generator, n = number of run */
    function prng(n){
      var i, x, y;
   
      n = (n && typeof(n) === 'number')
        ? Math.abs(Math.floor(n)) : 1;
   
      while(n--) {
        cnt = add(cnt,   1);
        brs = add(brs, cnt);
   
        for(i = 0; i < 256; i++) {
          switch(i & 3) {
            case 0: acc ^= acc <<  13; break;
            case 1: acc ^= acc >>>  6; break;
            case 2: acc ^= acc <<   2; break;
            case 3: acc ^= acc >>> 16; break;
          }
          acc        = add(m[(i +  128) & 0xff], acc); x = m[i];
          m[i] =   y = add(m[(x >>>  2) & 0xff], add(acc, brs));
          r[i] = brs = add(m[(y >>> 10) & 0xff], x);
        }
      }
    }
   
    /* public: return a random number between */
    function rand() {
      if(!gnt--) {
        prng(); gnt = 255;
      }
      return r[gnt];
    }
   
    /* public: return internals in an object*/
    function internals(){
      return {a: acc, b: brs, c: cnt, m: m, r: r};
    }
   
    /* return class object */
    return {
      'reset': reset,
      'seed':  seed,
      'prng':  prng,
      'rand':  rand,
      'internals': internals
    };
   })(); /* declare and execute */
   
   /* public: output*/
   isaac.random = function() {
    return 0.5 + this.rand() * 2.3283064365386963e-10; // 2^-32
   }
const WatsonComponent = (function () {

    const defaults = {
        "selectors": {
            "imClient": ".are-you-client .yes-no button:first-child",
            "imNotClient": ".are-you-client .yes-no button:last-child",

            "preConversation": ".card-body.pre-conversation",
            "conversation": ".card-body.msg_card_body",
            "inputContainer": ".card-footer .input",
            "closeButton": ".user-info span",
            "chat": ".card",
            "initialTime": ".time"
        },
        "classes": {
            "disabled": "disabled",
            "conversation": "conversation",
            "noShow": "no-display"
        },
        "events": {
            "click": "click",
            "scroll": "scroll"
        }
    };

    return class {

        constructor(element, chatUrl, websocket, extraparam, apk, welcome, image, buttonId) {

            this.element = element;
            this.chatUrl = chatUrl;
            this.websocket = websocket;
            this.extraparam = extraparam;
            this.socketConnection = false;
            this.avatar = image;
            this.token = apk;
            this.showWelcome = welcome;
            this.buttonId = buttonId;

            this.uniqueId = this.checkDecimals(isaac.random());

            this.initComponent();
        }

        checkDecimals(number) {
            let n = number.toString().split('.');
            let multiple = 1;
            for (let i = 0; i < n[1].length; i++) {
                multiple = multiple * 10;
            }
            let converted = (number * multiple).toString() + this.element.id;
            return converted;
        }

        initComponent() {
            if (this.showWelcome) {
                this.clientButton = this.element.querySelector(defaults.selectors.imClient);
                this.noClientButton = this.element.querySelector(defaults.selectors.imNotClient);
            }

            this.preConversation = this.element.querySelector(defaults.selectors.preConversation);
            this.conversation = this.element.querySelector(defaults.selectors.conversation);
            this.inputParent = this.element.querySelector(defaults.selectors.inputContainer);
            this.closeButton = this.element.querySelector(defaults.selectors.closeButton);
            this.chat = this.element.querySelector(defaults.selectors.chat);
            this.time = this.element.querySelector(defaults.selectors.initialTime);

            this.bindEvents();
        }



        bindEvents() {
            this.time.innerHTML = this.getTime();
            this.closeButton.onclick = this.closeChat.bind(this);
            if (this.showWelcome) {
                this.clientButton.onclick = this.openWatsonConnection.bind(this);
                if (this.buttonId) {
                    this.closeWatson(this.buttonId);
                } else {
                    this.noClientButton.onclick = this.openLivePerson.bind(this);
                }
                //                
            } else {
                this.openWatsonConnection(event);
            }

        }

        closeWatson(buttonId) {
            var lpButton2 = buttonId;

            function ensureInit(divId, callback) {
                let el = document.getElementById(divId);
                if (el && el !== null) {
                    useDiv(divId, callback);
                }
            }

            function useDiv(divId, callback) {
                if (!document.getElementById(divId).children.length > 0) {
                    setTimeout(function () {
                        ensureInit(divId, callback);

                    }, 50);
                } else {
                    document.getElementById(divId).classList.remove('disabled');
                    if (callback) {
                        callback();
                    }
                }
            }
            callEnsureInit(lpButton2);

            function callEnsureInit(divId) {
                ensureInit(divId, function () {
                    //                    document.getElementById(divId).style.display = "block";


                });


            }
        }

        openWatsonConnection(event) {
            if (this.extraparam && this.extraparam != "") {
                this.socket = io(this.websocket, { path: this.extraparam, withCredentials: true });
            } else {
                this.socket = io(this.websocket, { withCredentials: true });
            }
            this.sendToWS('hola');
            this.socketHandler();
        }

        openLivePerson(event) {
            event.preventDefault();
            this.noShowChat();
            const utm_source = new HeaderHelpers().getCookie('lp_utm_source');
            const chat_url = this.chatUrl + ((utm_source !== null && utm_source !== "") ? "?utm_source=" + utm_source : "");
            window.open(chat_url, "Chat", "width=450,height=450");
        }

        closeChat(event) {
            this.noShowChat();
            if (this.socketConnection) {
                if (window.location.href.indexOf('ayuda') > -1 || window.location.href.indexOf('help') > -1) {
                    this.socket.emit('conversationClosed', { text: 'Adios', pais: cdsCountry.toUpperCase(), id: this.uniqueId });
                } else {
                    this.socket.emit('conversationClosed', { text: 'Adios', pais: countryPS.toUpperCase(), id: this.uniqueId });
                }
                this.socketConnection = false;

                //            this.toggleClasses();
                //            $('.card-footer .input input').attr('disabled', true);
            }
        }

        noShowChat() {
            this.chat.classList.add(defaults.classes.noShow);
        }

        toggleClasses() {
            this.preConversation.classList.add(defaults.classes.conversation);
            this.conversation.classList.add(defaults.classes.conversation);
            this.inputParent.classList.remove(defaults.classes.disabled);
        }

        socketHandler() {

            this.socket.on('connect', () => {

                this.socketConnection = true;

                this.toggleClasses();
                $('.card-footer .input .input-group-append span img').remove();
                let el = '<img src="/content/dam/public-sites/watson/icono.svg">';
                $('.card-footer .input .input-group-append span').append(el);
                $('.card-footer .input input').removeAttr('disabled');

                let $this = this;
                this.scroll();

                $('.button-watson-chat').click(function () {
                    let text = $('.card-footer .input input').val();
                    $('.card-footer .input input').val('');
                    $this.printUserMsg(text);
                    $this.sendToWS(text);
                });
            });

            let input = document.getElementById("usr_input");

            input.addEventListener("keyup", function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $('.button-watson-chat').click();
                }
            });

            this.socket.on("connected", (data) => {
            	if (data.id) {
            	  this.uniqueId = data.id
            	}
            });

            this.socket.on('message', data => {
                if (data.id == null || data.id == 'undefined' || data.id == this.uniqueId) {
                    if (JSON.stringify(data).indexOf('{') > -1) {
                        data = this.realData(data);
                    }
                    this.printServerMsg(data);
                }
            });


            this.socket.on('greetings', (elem1, elem2, elem3) => { });
        }

        realData(json) {
            return json.text;
        }

        scroll() {
            let objDiv = this.conversation;
            $(objDiv).animate({
                scrollTop: objDiv.scrollHeight
            }, 800);
        }

        sendToWS(text) {
            if (text && text != "") {
                if (!text.replace(/\s/g, '').length) {
                    console.log('string only contains whitespace (ie. spaces, tabs or line breaks)');
                } else {
                    if (window.location.href.indexOf('ayuda') > -1 || window.location.href.indexOf('help') > -1) {
                        this.socket.emit('message', { text: text, pais: cdsCountry.toUpperCase(), id: this.uniqueId });
                    } else {
                        this.socket.emit('message', { text: text, pais: countryPS.toUpperCase(), id: this.uniqueId });
                    }
                }
            }
        }

        printServerMsg(message) {
            if (message && message.indexOf('conversationClosed') <= -1) {
                const $chatContainer = $('#divChat'),
                    msgContainer = `
                        <div class="are-you-client">
                            <div class="avatar">
                                <img src="${this.avatar}" alt="">
                            </div>
                        </div>`;
                message = this.injectLinkView(message, $chatContainer, msgContainer);

                const $msgContainer = $(msgContainer).append(`
                    <div class="question">
                        <span>${message.replace(/(\r\n|\n|\r)/gm, '<br />')}</span>
                        <span class="time">${this.getTime()}</span>
                    </div>
                `);

                $chatContainer.append($msgContainer);
            }
            this.scroll();
        }

        /**
         * Inject async link view from URL and generate redirect target blank.
         * @param {String} msgText Complete text to validate and inject.
         * @param {jQuery} $chatContainer Object jQuery with container chat.
         * @param {String} msgContainer Html string with message container.
         * @returns ***String*** with message to indications.
         */
        injectLinkView(msgText, $chatContainer, msgContainer) {
            if (typeof msgText !== 'string' || msgText.length < 1) return msgText;

            const regexWatsonLink = new RegExp(/%%(\w+)%%(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?)%%/gim),
                groups = [...msgText.matchAll(regexWatsonLink)][0];
            if (!groups || groups.length < 3) return msgText;

            msgText = msgText.replace(new RegExp(groups[0], 'g'), '');
            const $msgContainer = $(msgContainer).append(`
                <a class="link-view" href="#">    
                    <div class="linkview question">
                        <div class="img-wrapper">
                            <div class="skeleton-box" style="width:100%;height:157px;">&nbsp;</div>
                            <img class="linkview-img hide" alt="" decoding="async">
                        </div>
                        <div class="container-text">
                            <div class="title">
                                <div class="skeleton-box" style="width:70%;">&nbsp;</div>
                            </div>
                            <div class="description">
                                <div class="skeleton-box" style="width:85%;">&nbsp;</div>
                                <div class="skeleton-box" style="width:75%;">&nbsp;</div>
                            </div>
                        </div>
                        <div class="msg-footer">
                            <div class="domain">
                                <div class="skeleton-box" style="width:70px;">&nbsp;</div>
                            </div>
                            <span class="time">${this.getTime()}</span>
                        </div>
                    </div>
                </a>`);

            $chatContainer.append($msgContainer);
            fetch(`/bin/public-sites/utils/getmetadataog?url=${encodeURIComponent(groups[2])}`).then(res => {
                if (res.ok) {
                    res.json().then(metadataOg => {
                        if (metadataOg && metadataOg.status == 200) {
                            $msgContainer.find('.skeleton-box').hide();
                            $msgContainer.find('.linkview-img').removeClass('hide').attr('src', metadataOg.image);
                            $msgContainer.find('.container-text .title').text(metadataOg.title);
                            $msgContainer.find('.container-text .description').text(metadataOg.description);
                            $msgContainer.find('.link-view').attr('href', metadataOg.url).attr('target', '_blank');
                            const uri = document.createElement('a');
                            uri.href = metadataOg.url;
                            $msgContainer.find('.msg-footer .domain').text(uri.hostname);
                        } else {
                            console.error('NO DATA.', metadataOg.message);
                            $msgContainer.remove();
                        }
                    });
                }
            });

            return msgText;
        }

        printUserMsg(message) {
            if (message) {
                if (!message.replace(/\s/g, '').length) {
                    console.log('string only contains whitespace (ie. spaces, tabs or line breaks)');
                } else {
                    let el = $('#divChat');
                    let msg = '<div class="client">' +
                        '<div class="answer">' +
                        '<span>' +
                        message +
                        '</span>' +
                        '<span class="time">' +
                        this.getTime() +
                        '</span>' +
                        '</div>' +
                        '</div>';
                    $(el).append(msg);
                }
            }
            this.scroll();
        }

        getTime() {
            let time = new Date();
            let timeFormatted;
            if (time.getMinutes() < 10) {
                timeFormatted = time.getHours() + ':0' + time.getMinutes();
            } else {
                timeFormatted = time.getHours() + ':' + time.getMinutes();
            }

            //            this.test();
            return timeFormatted;
        }


    };



})();

$('.watson-chat-container').each(function () {
    const id = $(this).attr('id'),
        chatpath = $(this).data('liveperson'),
        websocket = $(this).data('ws'),
        extraparam = $(this).data('extraparam'),
        apk = $(this).data('desa'),
        chatUrl = chatpath ? chatpath : '/prev-chat.html',
        element = document.getElementById(id),
        image = $(this).data('watsonimage'),
        buttonId = $(this).data('buttonid');

    let welcome = false;
    if ($('.yes-no').length > 0) {
        welcome = true;
    }

    $('.watson-button').click(function () {
        const component = new WatsonComponent(element, chatUrl, websocket, extraparam, apk, welcome, image, buttonId);
        //    console.log(element);
        //    const component = new WatsonComponent(element)
    });

    if ($(this).parent().hasClass('cmp-watson--fullscreen')) {
        const component = new WatsonComponent(element, chatUrl, websocket, extraparam, apk, welcome, image, buttonId);
    }
});
