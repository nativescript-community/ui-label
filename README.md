# NativeScript Label widget
[![npm downloads](https://img.shields.io/npm/dm/nativescript-htmllabel.svg)](https://www.npmjs.com/package/nativescript-htmllabel)
[![npm downloads](https://img.shields.io/npm/dt/nativescript-htmllabel.svg)](https://www.npmjs.com/package/nativescript-htmllabel)
[![npm](https://img.shields.io/npm/v/nativescript-htmllabel.svg)](https://www.npmjs.com/package/nativescript-htmllabel)

A NativeScript Label widget. It is a direct replacement for the {N} Label widget.

## Installation
Run the following command from the root of your project:

`tns plugin add nativescript-htmllabel`

This command automatically installs the necessary files, as well as stores nativescript-htmllabel as a dependency in your project's package.json file.

## Configuration
It works exactly the same way as the {N} plugin. However it adds a few improvements


## iOS Performances
On iOS generating html string can be slow using the system way.
You can enable `DTCoreText` to make it faster.

* add pod `DTCoreText` in your app Podfile at `App_Resources/ios`
```
pod 'DTCoreText'
```
* enable it in your `app.(js|ts)` (as soon as possible)
```javascript
require('nativescript-htmlabel').enableIOSDTCoreText();
```

### Properties
* **html**  
Html text that will be used to render text. HTML supported tags are a bit different on iOS and Android. To make sure it works as expected, for now only used Android [supported ones](https://stackoverflow.com/questions/9754076/which-html-tags-are-supported-by-android-textview)

* **verticalTextAlignment**  
You can also set it through css with `vertical-text-alignment`

* **textShadow**  
You can also set it through css with `text-shadow`. The format is `offsetx offsety blurradius color`

## Improvements

* Override the {N} font loading system to make it much faster
* faster creation of `FormattedString`
* faster label creation and drawing, especially on android
