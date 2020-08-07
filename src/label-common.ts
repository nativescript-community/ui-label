import {
    CSSType,
    Color,
    CssProperty,
    FormattedString,
    InheritedCssProperty,
    Observable,
    Property,
    Span,
    Style,
    Label as TNLabel,
    booleanConverter,
    makeParser,
    makeValidator,
} from '@nativescript/core';
import { dip } from '@nativescript/core/ui/core/view';
import { TextAlignment } from '@nativescript/core/ui/text-base';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, LineBreak, TextShadow } from './label';

declare module '@nativescript/core/ui/text-base/formatted-string' {
    interface FormattedString {
        addPropertyChangeHandler(span: Span);
        removePropertyChangeHandler(span: Span);
    }
}
// FormattedString.prototype.onPropertyChange = function(data: PropertyChangeData) {
//     this.notifyPropertyChange(data.propertyName, this);
// }
FormattedString.prototype.addPropertyChangeHandler = function (span: Span) {
    span.on(Observable.propertyChangeEvent, this.onPropertyChange, this);
    // const style = span.style;
    // style.on('fontFamilyChange', this.onPropertyChange, this);
    // style.on('fontSizeChange', this.onPropertyChange, this);
    // style.on('fontStyleChange', this.onPropertyChange, this);
    // style.on('fontWeightChange', this.onPropertyChange, this);
    // style.on('textDecorationChange', this.onPropertyChange, this);
    // style.on('colorChange', this.onPropertyChange, this);
};
FormattedString.prototype.removePropertyChangeHandler = function (span: Span) {
    span.off(Observable.propertyChangeEvent, this.onPropertyChange, this);
    // const style = span.style;
    // style.off('fontFamilyChange', this.onPropertyChange, this);
    // style.off('fontSizeChange', this.onPropertyChange, this);
    // style.off('fontStyleChange', this.onPropertyChange, this);
    // style.off('fontWeightChange', this.onPropertyChange, this);
    // style.off('textDecorationChange', this.onPropertyChange, this);
    // style.off('colorChange', this.onPropertyChange, this);
};
// FormattedString.prototype.eachChild = function(callback: (child: ViewBase) => boolean): void {
//     this.spans.forEach((v, i, arr) => callback(v));
// };

export const needFormattedStringComputation = function (target: any, propertyKey: string | Symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        if (!this._canChangeText) {
            this._needFormattedStringComputation = true;
            return;
        }
        return originalMethod.apply(this, args);
    };
};

export const cssProperty = (target: Object, key: string | symbol) => {
    // property getter
    const getter = function () {
        return this.style[key];
    };

    // property setter
    const setter = function (newVal) {
        this.style[key] = newVal;
    };

    Object.defineProperty(target, key, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true,
    });
};

@CSSType('HTMLLabel')
export abstract class LabelBase extends TNLabel implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    @cssProperty lineBreak: LineBreak;
    html: string;

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

export type VerticalTextAlignment = 'initial' | 'top' | 'middle' | 'bottom' | 'center';

export const verticalTextAlignmentConverter = makeParser<VerticalTextAlignment>(makeValidator<VerticalTextAlignment>('initial', 'top', 'middle', 'bottom', 'center'));
export const textAlignmentConverter = makeParser<TextAlignment>(makeValidator<TextAlignment>('initial', 'left', 'right', 'center'));

export const verticalTextAlignmentProperty = new InheritedCssProperty<Style, VerticalTextAlignment>({
    name: 'verticalTextAlignment',
    cssName: 'vertical-text-align',
    defaultValue: 'initial',
    valueConverter: verticalTextAlignmentConverter,
});
verticalTextAlignmentProperty.register(Style);
