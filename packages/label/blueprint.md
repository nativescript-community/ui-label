{{ load:../../tools/readme/edit-warning.md }}
{{ template:title }}
{{ template:badges }}
{{ template:description }}

| <img src="https://raw.githubusercontent.com/nativescript-community/ui-label/master/images/demo-ios.gif" height="500" /> | <img src="https://raw.githubusercontent.com/nativescript-community/ui-label/master/images/demo-android.gif" height="500" /> |
| --- | ----------- |
| iOS Demo | Android Demo |

{{ template:toc }}

## Installation
Run the following command from the root of your project:

`ns plugin add {{ pkg.name }}`

### Production build

If you are using proguard on Android build you need ensure some resource from this plugin are not minified. You need to add ` tools:keep="@layout/ns_*"` as explained [here](https://developer.android.com/build/shrink-code#keep-resources)

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

## Improvements

-   Override the {N} font loading system to make it much faster
-   faster creation of `FormattedString`
-   faster label creation and drawing, especially on android


### Examples:

- [Basic Drawer](demo-snippets/vue3/BasicDrawer.vue)
  - A basic sliding drawer.
- [All Sides](demo-snippets/vue3/AllSides.vue)
  - An example of drawers on all sides: left, right, top, bottom.

{{ load:../../tools/readme/demos-and-development.md }}
{{ load:../../tools/readme/questions.md }}
