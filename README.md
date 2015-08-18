# koodatetimepicker
Date and time picker for web applications, available as a jQuery plug-in and a TypeScript class

This TypeScript class/JQuery plug-in has been created out of the need to have support for entering dates (and times)
in a web application in a very efficient way, mostly using the keyboard instead of the mouse.

The idea is simple: define a input text element and turn it into a datetime field by applying the class.

Here is an example: https://jsfiddle.net/ezxkagsc/

The functionality can be used as a TypeScript class. Just provide the input element to the constructor of the class `DateTimePicker`:

```
<script>
    new DateTimePicker(document.getElementById("F_DateTime"));
</script>
```

Or you can use it as a JQuery plug-in, if you prefer it this way:

```
<script>
    $("#F_DateTime").dateUtility();
</script>
```

Note the difference of the naming for the class and the JQuery plug-in.

This project depends on `JQuery` and `moment.js`.

The project is still in an alpha state.

