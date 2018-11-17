import { Label as HtmlViewDefinition } from './label';
import { Label as TNLabel } from 'tns-core-modules/ui/label/label';
import { Style } from 'tns-core-modules/ui/styling/style';
import { CssProperty, Property } from 'tns-core-modules/ui/core/properties';
export declare const cssProperty: (target: Object, key: string | symbol) => void;
export declare class LabelBase extends TNLabel implements HtmlViewDefinition {
    maxLines: string | number;
    autoFontSize: boolean;
    html: string;
}
export declare const htmlProperty: Property<LabelBase, string>;
export declare const maxLinesProperty: CssProperty<Style, number>;
export declare const autoFontSizeProperty: CssProperty<Style, boolean>;
