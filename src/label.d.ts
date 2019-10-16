/**
 * Contains the Label class, which represents a custom label widget which correctly supports html.
 */ /** */

import { Property, View } from 'tns-core-modules/ui/core/view';
import { Label as TNLabel } from 'tns-core-modules/ui/label/label';
import { dip } from 'tns-core-modules/ui/core/view';
import { Color } from 'tns-core-modules/color/color';
/**
 * Represents a label with html content. Use this component instead WebView when you want to show just static HTML content.
 * [iOS support](https://developer.apple.com/library/ios/documentation/UIKit/Reference/NSAttributedString_UIKit_Additions/#//apple_ref/occ/instm/NSAttributedString/initWithData:options:documentAttributes:error:)
 * [android support](http://developer.android.com/reference/android/text/Html.html)
 */
export declare class Label extends TNLabel {
    /**
     * Gets the native [android widget](http://developer.android.com/reference/android/widget/TextView.html) that represents the user interface for this component. Valid only when running on Android OS.
     */
    android?: any /* android.widget.TextView */;

    /**
     * Gets the native [UITextView](https://developer.apple.com/documentation/uikit/uitextview) that represents the user interface for this component. Valid only when running on iOS.
     */
    ios?: any /* UITextView */;

    /**
     * Gets or sets html string for the HtmlView.
     */
    html: string;

    verticalTextAlignment: VerticalTextAlignment;
}
export type VerticalTextAlignment = 'initial' | 'top' | 'middle' | 'bottom' | 'center';

export declare const htmlProperty: Property<Label, string>;
export declare const verticalTextAlignmentProperty: Property<Label, VerticalTextAlignment>;

export interface TextShadow {
    offsetX: dip;
    offsetY: dip;
    blurRadius: dip;
    color: Color;
}
