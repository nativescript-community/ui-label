import { Label as HtmlViewDefinition } from './label';
import { CSSType } from 'tns-core-modules/ui/core/view';
import { Label as TNLabel } from 'tns-core-modules/ui/label/label';
import { Style } from 'tns-core-modules/ui/styling/style';
import { CssProperty, Property } from 'tns-core-modules/ui/core/properties';

@CSSType('HTMLLabel')
export class LabelBase extends TNLabel implements HtmlViewDefinition {
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
