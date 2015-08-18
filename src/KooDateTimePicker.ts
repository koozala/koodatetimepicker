
///<reference path="../typings/jquery/jquery.d.ts" />
///<reference path="../typings/moment/moment.d.ts" />

// Options 

class DateTimePickerOptions {
    public format: string;
    public warnColor: string;

    constructor() {
        this.format = "DD.MM.YYYY HH:mm";
        this.warnColor = "#ff0000";
    }
}

// Main class

class DateTimePicker {

    private Root: HTMLInputElement;

    private options: DateTimePickerOptions;
    private defaultBackground: string;

    private fieldList: Array<DateField>;
    private currentField: DateField;
    private _currentFieldIndex: number;

    constructor(rt: HTMLInputElement, options?: DateTimePickerOptions) {

        // We are assuming an input text field

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

        this.fieldList = new Array<DateField>();

        let searchItems = ["DD", "MM", "YYYY", "HH", "mm"];
        let valid = "0123456789";

        searchItems.forEach(item => {
            let index = this.options.format.search(item);
            if (index > -1) {
                let ff = new DateField(this.Root, index, index + item.length - 1, item.length, m.format(item), valid);
                this.fieldList.push(ff);
            }
        });

        // Sort the fields by their position in the element

        this.fieldList.sort((a, b) => {
            return a.startIndex < b.startIndex ? -1 : (a.startIndex > b.startIndex ? 1 : 0);
        });

        // Start at the first field

        this.currentFieldIndex = 0;
        this.currentField = this.fieldList[this.currentFieldIndex];
        this.currentField.enter();

        // Set the event handlers

        this.Root.onkeypress = (ev: KeyboardEvent) => {
            this.handleKeyPress(ev);
        };

        this.Root.onkeydown = (ev: KeyboardEvent) => {
            this.handleKeyDown(ev);
        };

        this.Root.onfocus = (ev: FocusEvent) => {
            this.handleFocus(ev);
        };

    }

    // Property: The index of the field that the cursor is currently placed at.

    private get currentFieldIndex(): number {
        return this._currentFieldIndex;
    }

    private set currentFieldIndex(n: number) {
        this._currentFieldIndex = n;
    }

    // When the input field gets focus, the cursor is activated

    private handleFocus(ev: FocusEvent): void {
        this.currentFieldIndex = 0;
        var cf = this.fieldList[this.currentFieldIndex];
        cf.enter();
    }

    // Key has been pressed... if it is a valid digit within the current field, update the field.
    // If backspace has been pressed, move the cursor.

    private handleKeyPress(ev: KeyboardEvent): void {
        console.log("key pressed: <" + ev.char + "> <" + ev.charCode + "> <" + ev.which + "> <" + ev.ctrlKey + "> <" + ev.type + "> <" + ev.locale + ">");

        var cf = this.fieldList[this.currentFieldIndex];

        if (cf.validDigit.indexOf(String.fromCharCode(ev.charCode)) > -1) {
            let move = cf.updateDigit(String.fromCharCode(ev.charCode));
            if (move) {
                if (this.currentFieldIndex == this.fieldList.length - 1) {
                    // move out of the element
                    let next = <Element>this.Root;
                    while (next = next.nextElementSibling) {
                        if (next instanceof HTMLInputElement) {
                            (<HTMLInputElement>next).focus();
                            break;
                        }
                    }
                } else {
                    this.currentFieldIndex = (this.currentFieldIndex + 1) % this.fieldList.length;
                    this.fieldList[this.currentFieldIndex].enter();
                }
            }
            this.validate();
            ev.preventDefault();
        } else if (ev.which == 8) {
            let move = cf.backspace();
            if (move) {
                this.currentFieldIndex = this.currentFieldIndex > 0 ? this.currentFieldIndex - 1 : this.fieldList.length - 1;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        } else if (ev.which > 20) {
            // Ignore other keys
            ev.preventDefault();
        }
    }

    // Check if the current value of the input field is a valid date.
    // If it is not, change the background color to indicate a warning.

    private validate() {
        let m = moment(this.Root.value, this.options.format);
        if (m.isValid()) {
            this.Root.style.backgroundColor = this.defaultBackground;
        } else {
            this.Root.style.backgroundColor = this.options.warnColor;
        }
    }

    // Handling for special keys like cursor keys, Pos1, End, etc.

    private handleKeyDown(ev: KeyboardEvent): void {
        console.log("key down: <" + ev.char + "> <" + ev.charCode + "> <" + ev.which + "> <" + ev.ctrlKey + "> <" + ev.type + "> <" + ev.locale + ">");

        var cf = this.fieldList[this.currentFieldIndex];

        if (ev.which == 39) {
            // "Cursor right"
            let move = cf.skip(1);
            if (move) {
                this.currentFieldIndex = (this.currentFieldIndex + 1) % this.fieldList.length;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        } else if (ev.which == 37) {
            // "Cursor left"
            let move = cf.skip(-1);
            if (move) {
                this.currentFieldIndex = this.currentFieldIndex > 0 ? this.currentFieldIndex - 1 : this.fieldList.length - 1;
                this.fieldList[this.currentFieldIndex].enter();
            }
            ev.preventDefault();
        } else if (ev.which == 35) {
            // "End" has been pressed --> move to the last field
            this.currentFieldIndex = this.fieldList.length - 1;
            this.fieldList[this.currentFieldIndex].enter();
        } else if (ev.which == 36) {
            // "Pos 1" has been pressed --> move to the first field
            this.currentFieldIndex = 0;
            this.fieldList[this.currentFieldIndex].enter();
        } else if (ev.which == 46) {
            // "Del" --> ignore
            ev.preventDefault();
        } else if (ev.which == 9) {  
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
    }
}


// A DateField object represents a part of the input text, e.g. the day or month.

class DateField {

    private element: HTMLInputElement;
    private frompos: number;
    private topos: number;

    private length: number;
    private _currentPos: number;
    private valueString: string;
    private _validDigit: string;

    constructor(e: HTMLInputElement, frompos: number, topos: number, n: number, initValue: string, valid: string) {
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

    // Property: The position of the cursor.

    private get currentPos(): number {
        return this._currentPos;
    }

    private set currentPos(n: number) {
        this._currentPos = n;
    }

    // Property: The starting position of the field.

    public get startIndex() {
        return this.frompos;
    }

    // Property: The string containing the valid digits for the field.
    // Usually, these are numerical digits (0-9) for day/month/year/hour/minute,
    // but they might be different (e.g. A/P for AM/PM).

    public get validDigit(): string {
        return this._validDigit;
    }

    // Enter the field: move the cursor to the beginning of the field.

    public enter() {
        this.currentPos = 0;
        this.updateElement();
    }

    // Move the cursor to the left.
    // Return true if we drop off from the field.

    public backspace(): boolean {
        if (this.currentPos > 0) {
            this.currentPos--;
            this.updateElement();
            return false;
        }
        return true;
    }

    // Go m steps forward (or back, if m is negative) within the current field.
    // Return true if that leads out of the bounds of this field; this indicates that
    // the cursor should switch to the next/previous field.

    public skip(m: number): boolean {
        let p = this.currentPos + m;
        if (p < 0) {
            return true;
        } else if (p >= this.length) {
            return true;
        }
        this.currentPos = p;
        this.updateElement();
    }

    // Replace the digit at the current position of the field, and move one step to the right.
    // Additionally, trigger the update of the complete date/time element.

    public updateDigit(d: string): boolean {
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
    }

    // Update the complete date/time element.

    private updateElement() {
        var v = this.element.value;
        var prefix = v.substr(0, Math.min(this.frompos, v.length));
        var postfix = v.substr(Math.min(v.length, this.topos + 1), Math.max(0, v.length - this.topos - 1));
        this.element.value = prefix + this.valueString + postfix;
        this.markFocus();
    }

    // Mark the current position (a.k.a. show the cursor).

    public markFocus() {
        var p = this.frompos + this.currentPos;
        this.createSelection(this.element, p, p + 1);
    }

    // createSelection is acquired from Stackoverflow.
    // This selects the chosen range of the input text.

    private createSelection(field, start, end) {
        if (field.createTextRange) {
            var selRange = field.createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
            field.focus();
        } else if (field.setSelectionRange) {
            field.focus();
            field.setSelectionRange(start, end);
        } else if (typeof field.selectionStart != 'undefined') {
            field.selectionStart = start;
            field.selectionEnd = end;
            field.focus();
        }
    }

}



// Make the class usable as a jquery plug-in

if (jQuery) {

    (function ($) {

        $.fn.dateUtility = function (options) {

            var settings = $.extend({
                format: "DD.MM.YYYY HH:mm",
                warnColor: "#ff0000"
            }, options);

            this.get().forEach(item => {
                new DateTimePicker(item, settings);
            });
            return this;
        };

    } (jQuery))

}
