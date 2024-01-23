declare namespace com {
    export namespace nativescript {
        export namespace label {
            export class NSLabel extends text.TextView {
                static attributedStringHasURLSpan(attributeString: android.text.Spannable): boolean;
                static inflateLayout(context: android.content.Context): NSLabel;

                setTextDecoration(value: string | number);
                setLineBreak(value: string);
                setWhiteSpace(value: string);
                setVerticalTextAlignment(value: string, textAlignment: string);
                setLabelTextAlignment(value: string, verticalTextAlignment: string);

                setLabelTextSize(unit: number, size: number, minFontSize: number, maxFontSize: number, step: number);
                enableAutoSize(minFontSize: number, maxFontSize: number, step: number);
                disableAutoSize();
                setTappableState(value: boolean);
                setLabelText(value: string | java.lang.CharSequence);
            }
        }
    }
}
