import { Label as HtmlViewDefinition } from './label';
import { booleanConverter, CSSType } from 'tns-core-modules/ui/core/view';
import { Label as TNLabel } from 'tns-core-modules/ui/label/label';
import { Style } from 'tns-core-modules/ui/styling/style';
import { CssProperty, Property } from 'tns-core-modules/ui/core/properties';

export const cssProperty = (target: Object, key: string | symbol) => {
    // property getter
    const getter = function() {
        return this.style.key;
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
export class LabelBase extends TNLabel implements HtmlViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
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
