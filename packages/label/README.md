<!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️-->
<!--  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      DO NOT EDIT THIS READEME DIRECTLY! Edit "bluesprint.md" instead.
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
<h1 align="center">@nativescript-community/ui-label</h1>
<p align="center">
		<a href="https://npmcharts.com/compare/@nativescript-community/ui-label?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/@nativescript-community/ui-label.svg" height="20"/></a>
<a href="https://www.npmjs.com/package/@nativescript-community/ui-label"><img alt="NPM Version" src="https://img.shields.io/npm/v/@nativescript-community/ui-label.svg" height="20"/></a>
	</p>

<p align="center">
  <b>Alternative to the built-in NativeScript Label but with better performance and additional features such as HTML rendering and more.</b></br>
  <sub><sub>
</p>

<br />


| <img src="https://raw.githubusercontent.com/nativescript-community/ui-label/master/images/demo-ios.gif" height="500" /> | <img src="https://raw.githubusercontent.com/nativescript-community/ui-label/master/images/demo-android.gif" height="500" /> |
| --- | ----------- |
| iOS Demo | Android Demo |


[](#table-of-contents)

## Table of Contents

* [Installation](#installation)
	* [Production build](#production-build)
* [Configuration](#configuration)
	* [Angular](#angular)
	* [Vue](#vue)
	* [Properties](#properties)
* [Improvements](#improvements)
	* [Examples:](#examples)
* [Demos and Development](#demos-and-development)
	* [Repo Setup](#repo-setup)
	* [Build](#build)
	* [Demos](#demos)
* [Contributing](#contributing)
	* [Update repo ](#update-repo-)
	* [Update readme ](#update-readme-)
	* [Update doc ](#update-doc-)
	* [Publish](#publish)
	* [modifying submodules](#modifying-submodules)
* [Questions](#questions)


[](#installation)

## Installation
Run the following command from the root of your project:

`ns plugin add @nativescript-community/ui-label`

### Production build

If you are using proguard on Android build you need ensure some resource from this plugin are not minified. You need to add ` tools:keep="@layout/ns_*"` as explained [here](https://developer.android.com/build/shrink-code#keep-resources)


[](#configuration)

## Configuration

It works exactly the same way as the {N} plugin. However it adds a few improvements

### Angular

```typescript
import { registerElement } from '@nativescript/angular';

registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
```

```html
<!-- Normal Label Usage -->
<HTMLLabel html="<b>Hello, I am BOLD!></b>" fontFamily="OpenSans" fontSize="16" margin="2 5 5 5" textWrap="true"></HTMLLabel>

<!-- Clickable Link Usage -->
<HTMLLabel
    [html]="someBindedUrl"
    linkColor="#336699"
    linkUnderline="true"
    (linkTap)="onLinkTap($event)"
    fontFamily="OpenSans"
    fontSize="16"
    margin="2 5 5 5"
    textWrap="true"
></HTMLLabel>
```

```typescript
import { Utils } from '@nativescript/core';

export someComponentClass() {
    someBindedUrl = '<a href=\"https://youtube.com\">Open Youtube.com</a>'

    // Event binded to the linkTap function on the HTMLLabel
    onLinkTap(args) {
        const link = args.link;
        // expected to be https://youtube.com from the binded `<a>` tag href value
        // be sure to encodeURIComponent of any query string parameters if needed.
        Utils.openUrl(link);
    }
}


```

### Vue

```typescript
import Vue from 'nativescript-vue';

Vue.registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
```

```html
<!-- Normal Label Usage -->
<HTMLLabel
    fontSize="50"
    fontFamily="Cabin Sketch,res/cabinsketch"
    width="100%"
    paddingTop="5"
    color="#336699"
    textWrap="true"
    :html="someBindedValue"
    verticalAlignment="top"
/>

<!-- Clickable Link Usage -->
<HTMLLabel
    html="<a href='https://youtube.com'>Open Youtube.com</a>"
    linkColor="pink"
    linkUnderline="false"
    @linkTap="onLinkTap($event)"
    fontFamily="OpenSans"
    fontSize="16"
    margin="2 5 5 5"
    textWrap="true"
></HTMLLabel>
```

```typescript
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    data() {
        return {
            someBindedValue: "<p>This is really powerful. <b>Amazing to be quite honest</b></p>",
        };
    },
    methods: {
        // event binded to the linkTap on the HTMLLabel
        onLinkTap(args) {
            Utils.openUrl(args.link);
        },
    },
    beforeDestroy() {},
});
</script>
```

### Properties

-   **html**  
    Html text that will be used to render text. HTML supported tags are a bit different on iOS and Android. To make sure it works as expected, for now only used Android [supported ones](https://stackoverflow.com/questions/9754076/which-html-tags-are-supported-by-android-textview).

    If using a `url` with parameters, be sure to encode the query string so Android can open the link accordingly.

-   **verticalTextAlignment**  
    You can also set it through css with `vertical-text-alignment`

-   **textShadow**  
    You can also set it through css with `text-shadow`. The format is `offsetx offsety blurradius color`

-   **linkColor**
    Color for any `<a>` tags inside the `HTMLLabel`.

-   **linkUnderline**
    Boolean to enable underline for any `<a>` tags inside the `HTMLLabel`.
-   **linkTap**
    Event to handle taps of any `<a>` tags inside the `HTMLLabel`. Access the `link` property of the event data from the `linkTap` event. See Samples above for example.


[](#improvements)

## Improvements

-   Override the {N} font loading system to make it much faster
-   faster creation of `FormattedString`
-   faster label creation and drawing, especially on android


### Examples:

- [Basic Drawer](demo-snippets/vue3/BasicDrawer.vue)
  - A basic sliding drawer.
- [All Sides](demo-snippets/vue3/AllSides.vue)
  - An example of drawers on all sides: left, right, top, bottom.


[](#demos-and-development)

## Demos and Development


### Repo Setup

The repo uses submodules. If you did not clone with ` --recursive` then you need to call
```
git submodule update --init
```

The package manager used to install and link dependencies must be `pnpm` or `yarn`. `npm` wont work.

To develop and test:
if you use `yarn` then run `yarn`
if you use `pnpm` then run `pnpm i`

**Interactive Menu:**

To start the interactive menu, run `npm start` (or `yarn start` or `pnpm start`). This will list all of the commonly used scripts.

### Build

```bash
npm run build.all
```
WARNING: it seems `yarn build.all` wont always work (not finding binaries in `node_modules/.bin`) which is why the doc explicitly uses `npm run`

### Demos

```bash
npm run demo.[ng|react|svelte|vue].[ios|android]

npm run demo.svelte.ios # Example
```

Demo setup is a bit special in the sense that if you want to modify/add demos you dont work directly in `demo-[ng|react|svelte|vue]`
Instead you work in `demo-snippets/[ng|react|svelte|vue]`
You can start from the `install.ts` of each flavor to see how to register new demos 


[](#contributing)

## Contributing

### Update repo 

You can update the repo files quite easily

First update the submodules

```bash
npm run update
```

Then commit the changes
Then update common files

```bash
npm run sync
```
Then you can run `yarn|pnpm`, commit changed files if any

### Update readme 
```bash
npm run readme
```

### Update doc 
```bash
npm run doc
```

### Publish

The publishing is completely handled by `lerna` (you can add `-- --bump major` to force a major release)
Simply run 
```shell
npm run publish
```

### modifying submodules

The repo uses https:// for submodules which means you won't be able to push directly into the submodules.
One easy solution is t modify `~/.gitconfig` and add
```
[url "ssh://git@github.com/"]
	pushInsteadOf = https://github.com/
```


[](#questions)

## Questions

If you have any questions/issues/comments please feel free to create an issue or start a conversation in the [NativeScript Community Discord](https://nativescript.org/discord).
