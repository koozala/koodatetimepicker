///<reference path="../typings/jquery/jquery.d.ts" />
///<reference path="../typings/moment/moment.d.ts" />
// Options 
var DateTimePickerOptions = (function () {
    function DateTimePickerOptions() {
        this.format = "DD.MM.YYYY HH:mm";
        this.warnColor = "#ff0000";
    }
    return DateTimePickerOptions;
})();
// Main class
var DateTimePicker = (function () {
    function DateTimePicker(rt, options) {
        // We are assuming an input text field
        var _this = this;
        this.Root = rt;
        this.defaultBackground = this.Root.style.backgroundColor;
        // Merge options with the defaults if they are given
        this.options = new DateTimePickerOptions();
        if (options) {
            for (var key in options) {
                this.options[key] = options[key];
            }
        }
        // Initialize
        // Try to read the value of the input field as a date/time;
        // If not successful, replace with the current date.
        var m = moment(this.Root.value, this.options.format);
        if (!m.isValid()) {
            m = moment();
            this.Root.value = m.format(this.options.format);
        }
        // Create the individual fields (day, month, year, etc.)
        this.fieldList = new Array();
        var searchItems = ["DD", "MM", "YYYY", "HH", "mm"];
        var valid = "0123456789";
        searchItems.forEach(function (item) {
            var index = _this.options.format.search(item);
            if (index > -1) {
                var ff = new DateField(_this.Root, index, index + item.length - 1, item.length, m.format(item), valid);
                _this.fieldList.push(ff);
            }
        });
        // Sort the fields by their position in the element
        this.fieldList.sort(function (a, b) {
            return a.startIndex < b.startIndex ? -1 : (a.startIndex > b.startIndex ? 1 : 0);
        });
        // Start at the first field
        this.currentFieldIndex = 0;
        this.currentField = this.fieldList[this.currentFieldIndex];
        this.currentField.enter();
        // Set the event handlers
        this.Root.onkeypress = function (ev) {
            _this.handleKeyPress(ev);
        };
        this.Root.onkeydown = function (ev) {
            _this.handleKeyDown(ev);
        };
        this.Root.onfocus = function (ev) {
            _this.handleFocus(ev);
        };
    }
    Object.defineProperty(DateTimePicker.prototype, "currentFieldIndex", {
        // Property: The index of the field that the cursor is currently placed at.
        get: function () {
            return this._currentFieldIndex;
        },
        set: function (n) {
            this._currentFieldIndex = n;
        },
        enumerable: true,
        configurable: true
    });
    // When the input field gets focus, the cursor is activated
    DateTimePicker.prototype.handleFocus = function (ev) {
        this.currentFieldIndex = 0;
        var cf = this.fieldList[this.currentFieldIndex];
        cf.enter();
    };
    // Key has been pressed... if it is a valid digit within the current field, update the field.
    // If backspace has been pressed, move the cursor.
    DateTimePicker.prototype.handleKeyPress = function (ev) {
        console.log("key pressed: <" + ev.char + "> <" + ev.charCode + "> <" + ev.which + "> <" + ev.ctrlKey + "> <" + ev.type + "> <" + ev.locale + ">");
        var cf = this.fieldList[this.currentFieldIndex];
        if (cf.validDigit.indexOf(String.fromCharCode(ev.charCode)) > -1) {
            var move = cf.updateDigit(String.fromCharCode(ev.charCode));
            if (move) {
                if (this.currentFieldIndex == this.fieldList.length - 1) {
                    // move out of the element
                    var next = this.Root;
                    while (next = next.nextElementSibling) {
                        if (next instanceof HTMLInputElement) {
                            next.focus();
                            break;
                        }
                    }
                }
                else {
                    this.currentFieldIndex = (this.currentFieldIndex + 1) % this.fieldList.length;
                    this.fieldList[this.currentFieldIndex].enter();
                }
            }
            this.validate();
            ev.preventDefault();
        }
        else if (ev.which == 8) {
            var move = cf.backspace();
            if (move) {
                this.currentFieldIndex = this.currentFieldIndex > 0 ? this.currentFieldIndex - 1 : this.fieldList.length - 1;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        }
        else if (ev.which > 20) {
            // Ignore other keys
            ev.preventDefault();
        }
    };
    // Check if the current value of the input field is a valid date.
    // If it is not, change the background color to indicate a warning.
    DateTimePicker.prototype.validate = function () {
        var m = moment(this.Root.value, this.options.format);
        if (m.isValid()) {
            this.Root.style.backgroundColor = this.defaultBackground;
        }
        else {
            this.Root.style.backgroundColor = this.options.warnColor;
        }
    };
    // Handling for special keys like cursor keys, Pos1, End, etc.
    DateTimePicker.prototype.handleKeyDown = function (ev) {
        console.log("key down: <" + ev.char + "> <" + ev.charCode + "> <" + ev.which + "> <" + ev.ctrlKey + "> <" + ev.type + "> <" + ev.locale + ">");
        var cf = this.fieldList[this.currentFieldIndex];
        if (ev.which == 39) {
            // "Cursor right"
            var move = cf.skip(1);
            if (move) {
                this.currentFieldIndex = (this.currentFieldIndex + 1) % this.fieldList.length;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        }
        else if (ev.which == 37) {
            // "Cursor left"
            var move = cf.skip(-1);
            if (move) {
                this.currentFieldIndex = this.currentFieldIndex > 0 ? this.currentFieldIndex - 1 : this.fieldList.length - 1;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        }
        else if (ev.which == 35) {
            // "End" has been pressed --> move to the last field
            this.currentFieldIndex = this.fieldList.length - 1;
            this.fieldList[this.currentFieldIndex].enter();
        }
        else if (ev.which == 36) {
            // "Pos 1" has been pressed --> move to the first field
            this.currentFieldIndex = 0;
            this.fieldList[this.currentFieldIndex].enter();
        }
        else if (ev.which == 46) {
            // "Del" --> ignore
            ev.preventDefault();
        }
        else if (ev.which == 9) {
            // "Tab" --> move to the next field (if Shift+Tab, move to the previous)
            if (ev.shiftKey && this.currentFieldIndex > 0) {
                this.currentFieldIndex--;
                this.fieldList[this.currentFieldIndex].enter();
                ev.preventDefault();
            }
            else if (!ev.shiftKey && this.currentFieldIndex < this.fieldList.length - 1) {
                this.currentFieldIndex++;
                this.fieldList[this.currentFieldIndex].enter();
                ev.preventDefault();
            }
        }
    };
    return DateTimePicker;
})();
// A DateField object represents a part of the input text, e.g. the day or month.
var DateField = (function () {
    function DateField(e, frompos, topos, n, initValue, valid) {
        this.element = e;
        this.frompos = frompos;
        this.topos = topos;
        this.length = n;
        this.currentPos = 0;
        this.valueString = initValue;
        this._validDigit = valid;
        while (this.valueString.length < this.length) {
            this.valueString = "0" + this.valueString;
        }
        this.updateElement();
    }
    Object.defineProperty(DateField.prototype, "currentPos", {
        // Property: The position of the cursor.
        get: function () {
            return this._currentPos;
        },
        set: function (n) {
            this._currentPos = n;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DateField.prototype, "startIndex", {
        // Property: The starting position of the field.
        get: function () {
            return this.frompos;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DateField.prototype, "validDigit", {
        // Property: The string containing the valid digits for the field.
        // Usually, these are numerical digits (0-9) for day/month/year/hour/minute,
        // but they might be different (e.g. A/P for AM/PM).
        get: function () {
            return this._validDigit;
        },
        enumerable: true,
        configurable: true
    });
    // Enter the field: move the cursor to the beginning of the field.
    DateField.prototype.enter = function () {
        this.currentPos = 0;
        this.updateElement();
    };
    // Move the cursor to the left.
    // Return true if we drop off from the field.
    DateField.prototype.backspace = function () {
        if (this.currentPos > 0) {
            this.currentPos--;
            this.updateElement();
            return false;
        }
        return true;
    };
    // Go m steps forward (or back, if m is negative) within the current field.
    // Return true if that leads out of the bounds of this field; this indicates that
    // the cursor should switch to the next/previous field.
    DateField.prototype.skip = function (m) {
        var p = this.currentPos + m;
        if (p < 0) {
            return true;
        }
        else if (p >= this.length) {
            return true;
        }
        this.currentPos = p;
        this.updateElement();
    };
    // Replace the digit at the current position of the field, and move one step to the right.
    // Additionally, trigger the update of the complete date/time element.
    DateField.prototype.updateDigit = function (d) {
        var prefix = this.valueString.substr(0, Math.min(this.currentPos, this.valueString.length));
        var postfix = this.valueString.substr(this.currentPos + 1, Math.max(0, this.valueString.length - this.currentPos - 1));
        var newString = prefix + d + postfix;
        this.valueString = newString;
        this.currentPos++;
        this.updateElement();
        if (this.currentPos >= this.length) {
            this.currentPos = this.length - 1;
            return true;
        }
        return false;
    };
    // Update the complete date/time element.
    DateField.prototype.updateElement = function () {
        var v = this.element.value;
        var prefix = v.substr(0, Math.min(this.frompos, v.length));
        var postfix = v.substr(Math.min(v.length, this.topos + 1), Math.max(0, v.length - this.topos - 1));
        this.element.value = prefix + this.valueString + postfix;
        this.markFocus();
    };
    // Mark the current position (a.k.a. show the cursor).
    DateField.prototype.markFocus = function () {
        var p = this.frompos + this.currentPos;
        this.createSelection(this.element, p, p + 1);
    };
    // createSelection is acquired from Stackoverflow.
    // This selects the chosen range of the input text.
    DateField.prototype.createSelection = function (field, start, end) {
        if (field.createTextRange) {
            var selRange = field.createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
            field.focus();
        }
        else if (field.setSelectionRange) {
            field.focus();
            field.setSelectionRange(start, end);
        }
        else if (typeof field.selectionStart != 'undefined') {
            field.selectionStart = start;
            field.selectionEnd = end;
            field.focus();
        }
    };
    return DateField;
})();
// Make the class usable as a jquery plug-in
if (jQuery) {
    (function ($) {
        $.fn.dateUtility = function (options) {
            var settings = $.extend({
                format: "DD.MM.YYYY HH:mm",
                warnColor: "#ff0000"
            }, options);
            this.get().forEach(function (item) {
                new DateTimePicker(item, settings);
            });
            return this;
        };
    }(jQuery));
}
//# sourceMappingURL=datetimepicker.js.map