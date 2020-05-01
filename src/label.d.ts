/**
 * Contains the Label class, which represents a custom label widget which correctly supports html.
 */ /** */

import { Property, View } from '@nativescript/core/ui/core/view/view';
import { Label as TNLabel } from '@nativescript/core/ui/label/label';
import { dip } from '@nativescript/core/ui/core/view/view';
import { Color } from '@nativescript/core/color/color';
import { TextAlignment } from '@nativescript/core/ui/text-base';
/**
 * Represents a label with html content. Use this component instead WebView when you want to show just static HTML content.
 * [iOS support](https://developer.apple.com/library/ios/documentation/UIKit/Reference/NSAttributedString_UIKit_Additions/#//apple_ref/occ/instm/NSAttributedString/initWithData:options:documentAttributes:error:)
 * [android support](http://developer.android.com/reference/android/text/Html.html)
 */
export declare class Label extends TNLabel {
    /**
     * Gets the native [android widget](http://developer.android.com/reference/android/widget/TextView.html) that represents the user interface for this component. Valid only when running on Android OS.
     */
    android: any /* android.widget.TextView */;

    /**
     * Gets the native [UITextView](https://developer.apple.com/documentation/uikit/uitextview) that represents the user interface for this component. Valid only when running on iOS.
     */
    ios: any /* UITextView */;

    /**
     * Gets or sets html string for the HtmlView.
     */
    html: string;

    verticalTextAlignment: VerticalTextAlignment;
    lineBreak: LineBreak;
}
export type VerticalTextAlignment = 'initial' | 'top' | 'middle' | 'bottom' | 'center';
export type LineBreak = 'end' | 'start' | 'middle' | 'none';

export declare const htmlProperty: Property<Label, string>;
export declare const verticalTextAlignmentProperty: Property<Label, VerticalTextAlignment>;

export interface TextShadow {
    offsetX: dip;
    offsetY: dip;
    blurRadius: dip;
    color: Color;
}

export function buildHTMLString(data: {
    text: string;
    color?: Color | string | number;
    familyName?: string;
    fontSize?: number;
    letterSpacing?: number;
    lineHeight?: number;
    textAlignment?: TextAlignment;
}): any;
export function enableIOSDTCoreText();
