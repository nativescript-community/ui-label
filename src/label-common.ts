import { isIOS } from '@nativescript/core/platform';
import { CssProperty, InheritedCssProperty, makeParser, makeValidator, Property } from '@nativescript/core/ui/core/properties';
import { booleanConverter, Color, CSSType, dip } from '@nativescript/core/ui/core/view';
import { Label as TNLabel } from '@nativescript/core/ui/label';
import { Style } from '@nativescript/core/ui/styling/style';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, TextShadow } from './label';
import { FormattedString } from '@nativescript/core/ui/text-base/formatted-string';
import { Span } from '@nativescript/core/ui/text-base/span';


declare module '@nativescript/core/ui/text-base/formatted-string' {
    interface FormattedString {
        addPropertyChangeHandler(): void;
        removePropertyChangeHandler(): void;
    }
}
declare module '@nativescript/core/ui/text-base/span' {
    interface Span {
        addPropertyChangeHandler(): void;
        removePropertyChangeHandler(): void;
    }
}

FormattedString.prototype.addPropertyChangeHandler = function() {}
FormattedString.prototype.removePropertyChangeHandler = function() {}
Span.prototype.addPropertyChangeHandler = function() {}
Span.prototype.removePropertyChangeHandler = function() {}


export const cssProperty = (target: Object, key: string | symbol) => {
    // property getter
    const getter = function() {
        return this.style[key];
    };

    // property setter
    const setter = function(newVal) {
        this.style[key] = newVal;
    };

    Object.defineProperty(target, key, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
    });
};

@CSSType('HTMLLabel')
export class LabelBase extends TNLabel implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    public html: string;
}

// TODO: Can we use Label.ios optimization for affectsLayout???
export const htmlProperty = new Property<LabelBase, string>({ name: 'html', defaultValue: null, affectsLayout: true });
htmlProperty.register(LabelBase);

export const maxLinesProperty = new CssProperty<Style, number>({
    name: 'maxLines',
    cssName: 'max-lines'
});
maxLinesProperty.register(Style);
export const lineBreakProperty = new CssProperty<Style, string>({
    name: 'lineBreak',
    cssName: 'line-break'
});
lineBreakProperty.register(Style);

export const autoFontSizeProperty = new CssProperty<Style, boolean>({
    name: 'autoFontSize',
    cssName: 'auto-font-size',
    valueConverter: booleanConverter
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
    affectsLayout: isIOS,
    valueConverter: value => {
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

export type VerticalTextAlignment = 'initial' | 'top' | 'middle' | 'bottom' | 'center';

const textAlignmentConverter = makeParser<VerticalTextAlignment>(makeValidator<VerticalTextAlignment>('initial', 'top', 'middle', 'bottom', 'center'));
export const verticalTextAlignmentProperty = new InheritedCssProperty<Style, VerticalTextAlignment>({
    name: 'verticalTextAlignment',
    cssName: 'vertical-text-align',
    defaultValue: 'initial',
    valueConverter: textAlignmentConverter
});
verticalTextAlignmentProperty.register(Style);
