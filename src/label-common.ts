import {
    VerticalTextAlignment,
    cssProperty,
    init,
    overrideSpanAndFormattedString,
    overrideSpanAndFormattedStringEnabled
} from '@nativescript-community/text';
import {
    CSSType,
    Color,
    CoreTypes,
    CssProperty,
    FormattedString,
    Property,
    Style,
    Label as TNLabel,
    Utils,
    booleanConverter,
    fontInternalProperty
} from '@nativescript/core';
import type { Label as LabelViewDefinition, LineBreak, TextShadow } from './label';

// declare module '@nativescript/core/ui/text-base/formatted-string' {
//     interface FormattedString {
//         addPropertyChangeHandler(span: Span);
//         removePropertyChangeHandler(span: Span);
//     }
// }

// init text to ensure font overrides are called
init();
const useLightFormatString =
    typeof __UI_LABEL_USE_LIGHT_FORMATTEDSTRING__ != 'undefined' ? __UI_LABEL_USE_LIGHT_FORMATTEDSTRING__ : false;
overrideSpanAndFormattedString(useLightFormatString);

export const needSetText = function (target: any, propertyKey: string | Symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        this._setNativeText();
        return result;
    };
};
export const needTextSet = function (target: any, propertyKey: string | Symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        if (!this.mCanChangeText) {
            this._needFontComputation = true;
            return;
        }
        return originalMethod.apply(this, args);
    };
};

@CSSType('HTMLLabel')
export abstract class LabelBase extends TNLabel implements LabelViewDefinition {
    //@ts-ignore
    @cssProperty maxLines: string | number;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    @cssProperty lineBreak: LineBreak;
    @cssProperty linkColor: Color;
    @cssProperty linkUnderline: boolean;
    @cssProperty selectable: boolean;
    html: string;
    //@ts-ignore
    formattedText: FormattedString;

    @cssProperty autoFontSize: boolean;
    @cssProperty minFontSize: number;
    @cssProperty maxFontSize: number;
    @cssProperty autoFontSizeStep: number;

    mCanChangeText = true;
    mNeedSetText = false;
    mNeedFontComputation = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this.mCanChangeText = false;
        super.onResumeNativeUpdates();
        this.mCanChangeText = true;
        if (this.mNeedSetText) {
            this.mNeedSetText = false;
            this._setNativeText();
        }
        if (this.mNeedFontComputation) {
            this.mNeedFontComputation = false;
            this[fontInternalProperty.setNative](this.style.fontInternal);
        }
    }
}

// TODO: Can we use Label.ios optimization for affectsLayout???
export const htmlProperty = new Property<LabelBase, string>({
    name: 'html',
    defaultValue: null,
    affectsLayout: global.isAndroid
});
htmlProperty.register(LabelBase);

export const lineBreakProperty = new CssProperty<Style, string>({
    name: 'lineBreak',
    cssName: 'line-break'
});
lineBreakProperty.register(Style);
export const linkColorProperty = new CssProperty<Style, Color>({
    name: 'linkColor',
    cssName: 'link-color',
    valueConverter: (v) => new Color(v)
});
linkColorProperty.register(Style);

export const linkUnderlineProperty = new CssProperty<Style, boolean>({
    name: 'linkUnderline',
    cssName: 'link-underline',
    valueConverter: booleanConverter,
    defaultValue: true
});
linkUnderlineProperty.register(Style);

export const selectableProperty = new CssProperty<Style, boolean>({
    name: 'selectable',
    cssName: 'selectable',
    valueConverter: booleanConverter
});
selectableProperty.register(Style);

export const autoFontSizeProperty = new CssProperty<Style, boolean>({
    name: 'autoFontSize',
    cssName: 'auto-font-size',
    valueConverter: booleanConverter
});
autoFontSizeProperty.register(Style);
export const autoFontSizeStepProperty = new CssProperty<Style, number>({
    name: 'autoFontSizeStep',
    cssName: 'auto-font-size-step',
    valueConverter: (v) => parseFloat(v)
});
autoFontSizeStepProperty.register(Style);
export const minFontSizeProperty = new CssProperty<Style, number>({
    name: 'minFontSize',
    cssName: 'min-font-size',
    valueConverter: (v) => parseFloat(v)
});
minFontSizeProperty.register(Style);
export const maxFontSizeProperty = new CssProperty<Style, number>({
    name: 'maxFontSize',
    cssName: 'max-font-size',
    valueConverter: (v) => parseFloat(v)
});
maxFontSizeProperty.register(Style);

function parseDIPs(value: string): CoreTypes.dip {
    if (value.indexOf('px') !== -1) {
        return Utils.layout.toDeviceIndependentPixels(parseFloat(value.replace('px', '').trim()));
    } else {
        return parseFloat(value.replace('dip', '').trim());
    }
}

export const textShadowProperty = new CssProperty<Style, string | TextShadow>({
    name: 'textShadow',
    cssName: 'text-shadow',
    affectsLayout: global.isIOS,
    valueConverter: (value) => {
        const params = value.split(' ');
        return {
            offsetX: parseDIPs(params[0]),
            offsetY: parseDIPs(params[1]),
            blurRadius: parseDIPs(params[2]),
            color: new Color(params.slice(3).join(''))
        };
    }
});
textShadowProperty.register(Style);
