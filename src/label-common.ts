import {
    CSSType,
    ChangedData,
    Color,
    CssProperty,
    FormattedString,
    InheritedCssProperty,
    Observable,
    ObservableArray,
    Property,
    PropertyChangeData,
    Span,
    Style,
    Label as TNLabel,
    booleanConverter,
    makeParser,
    makeValidator,
} from '@nativescript/core';
import { View, dip } from '@nativescript/core/ui/core/view';
import { TextAlignment, TextDecoration } from '@nativescript/core/ui/text-base';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, LineBreak, TextShadow } from './label';
import { LightFormattedString, VerticalTextAlignment, cssProperty } from '@nativescript-community/text';
import { FontStyle, FontWeight } from '@nativescript/core/ui/styling/font';

declare module '@nativescript/core/ui/text-base/formatted-string' {
    interface FormattedString {
        addPropertyChangeHandler(span: Span);
        removePropertyChangeHandler(span: Span);
    }
}

const CHILD_SPAN = 'Span';
const CHILD_FORMATTED_TEXT = 'formattedText';
const CHILD_FORMATTED_STRING = 'FormattedString';
// FormattedString.prototype.addPropertyChangeHandler = function (span: Span) {
//     span.on(Observable.propertyChangeEvent, this.onPropertyChange, this);
// };
// FormattedString.prototype.removePropertyChangeHandler = function (span: Span) {
//     span.off(Observable.propertyChangeEvent, this.onPropertyChange, this);
// };



export const needFormattedStringComputation = function (
    target: any,
    propertyKey: string | Symbol,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        if (!this._canChangeText) {
            this._needFormattedStringComputation = true;
            return;
        }
        return originalMethod.apply(this, args);
    };
};

@CSSType('HTMLLabel')
export abstract class LabelBase extends TNLabel implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    @cssProperty lineBreak: LineBreak;
    @cssProperty linkColor: Color;
    @cssProperty linkUnderline: boolean;
    html: string;
    //@ts-ignore
    formattedText: FormattedString;

    _canChangeText = true;
    _needFormattedStringComputation = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this._canChangeText = false;
        super.onResumeNativeUpdates();
        this._canChangeText = true;
        if (this._needFormattedStringComputation) {
            this._needFormattedStringComputation = false;
            this._setNativeText();
        }
    }
}

// TODO: Can we use Label.ios optimization for affectsLayout???
export const htmlProperty = new Property<LabelBase, string>({ name: 'html', defaultValue: null, affectsLayout: true });
htmlProperty.register(LabelBase);

export const maxLinesProperty = new CssProperty<Style, number>({
    name: 'maxLines',
    cssName: 'max-lines',
});
maxLinesProperty.register(Style);
export const lineBreakProperty = new CssProperty<Style, string>({
    name: 'lineBreak',
    cssName: 'line-break',
});
lineBreakProperty.register(Style);
export const linkColorProperty = new CssProperty<Style, Color>({
    name: 'linkColor',
    cssName: 'link-color',
    valueConverter: (v) => new Color(v),
});
linkColorProperty.register(Style);

export const linkUnderlineProperty = new CssProperty<Style, boolean>({
    name: 'linkUnderline',
    cssName: 'link-underline',
    valueConverter: booleanConverter,
});
linkUnderlineProperty.register(Style);

export const autoFontSizeProperty = new CssProperty<Style, boolean>({
    name: 'autoFontSize',
    cssName: 'auto-font-size',
    valueConverter: booleanConverter,
});
autoFontSizeProperty.register(Style);

function parseDIPs(value: string): dip {
    if (value.indexOf('px') !== -1) {
        return layout.toDeviceIndependentPixels(parseFloat(value.replace('px', '').trim()));
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
            color: new Color(params.slice(3).join('')),
        };
    },
});
textShadowProperty.register(Style);
