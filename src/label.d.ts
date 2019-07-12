/**
 * Contains the Label class, which represents a custom label widget which correctly supports html.
 */ /** */

 import { View, Property } from "tns-core-modules/ui/core/view";
import { Label as TNLabel } from "tns-core-modules/ui/label/label";

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
 }
 
 export declare const htmlProperty: Property<Label, string>;
 