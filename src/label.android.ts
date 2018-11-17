import {
    htmlProperty,
    LabelBase,
    lineBreakProperty,
    maxLinesProperty
} from './label-common';
// import { backgroundColorProperty } from 'tns-core-modules/ui/page/page';
import {
    TextTransform,
    WhiteSpace,
    whiteSpaceProperty
} from 'tns-core-modules/ui/text-base/text-base';
import { Font } from 'tns-core-modules/ui/styling/font';
// import { Span } from 'tns-core-modules/text/span';

export * from './label-common';

export class Label extends LabelBase {
    nativeViewProtected: android.widget.TextView;

    public createNativeView() {
        return new android.widget.TextView(this._context);
    }

    public initNativeView(): void {
        super.initNativeView();
        const nativeView = this.nativeViewProtected;

        // This makes the html <a href...> work
        nativeView.setLinksClickable(false);
        nativeView.setMovementMethod(
            android.text.method.LinkMovementMethod.getInstance()
        );
    }

    public resetNativeView(): void {
        super.resetNativeView();
        this.nativeViewProtected.setAutoLinkMask(0);
    }

    [htmlProperty.getDefault](): string {
        return '';
    }
    [htmlProperty.setNative](value: string) {
        // If the data.newValue actually has a <a...> in it; we need to disable autolink mask
        // it internally disables the coloring, but then the <a> links won't work..  So to support both
        // styles of links (html and just text based) we have to manually enable/disable the autolink mask
        let mask = 15;
        if (value.search(/<a\s/i) >= 0) {
            mask = 0;
        }
        const nativeView = this.nativeViewProtected;
        nativeView.setAutoLinkMask(mask);
        const spannableStringBuilder = createSpannableStringBuilder(
            android.text.Html.fromHtml(value)
        );
        nativeView.setText(spannableStringBuilder as any);

        // textProperty.nativeValueChange(this, value === null || value === undefined ? '' : value.toString());
    }

    [maxLinesProperty.getDefault](): number | string {
        return 'none';
    }
    [maxLinesProperty.setNative](value: number | string) {
        if (value === 'none') {
            this.nativeViewProtected.setMaxLines(-1);
        } else {
            this.nativeViewProtected.setMaxLines(value as number);
        }
    }
    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        switch (value) {
            case 'end':
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
                break;
            case 'start':
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.START);
                break;
            case 'middle':
                nativeView.setEllipsize(
                    android.text.TextUtils.TruncateAt.MIDDLE
                );
                break;
            case 'none':
                nativeView.setEllipsize(null);
                break;
        }
    }
    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        const nativeView = this.nativeTextViewProtected;
        switch (value) {
            case 'initial':
            case 'normal':
                nativeView.setEllipsize(null);
                break;
            case 'nowrap':
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
                break;
        }
    }
}

// function isBold(fontWeight: FontWeight): boolean {
//     return fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900';
// }

function getCapitalizedString(str: string): string {
    const words = str.split(' ');
    const newWords = [];
    for (let i = 0, length = words.length; i < length; i++) {
        const word = words[i].toLowerCase();
        newWords.push(word.substr(0, 1).toUpperCase() + word.substring(1));
    }

    return newWords.join(' ');
}

export function getTransformedText(
    text: string,
    textTransform: TextTransform
): string {
    switch (textTransform) {
        case 'uppercase':
            return text.toUpperCase();
        case 'lowercase':
            return text.toLowerCase();
        case 'capitalize':
            return getCapitalizedString(text);
        case 'none':
        default:
            return text;
    }
}

function createSpannableStringBuilder(
    spannedString: android.text.Spanned
): android.text.SpannableStringBuilder {
    if (!spannedString) {
        return null;
    }
    const builder = new android.text.SpannableStringBuilder(
        spannedString as any
    );
    const spans: native.Array<
        android.text.style.TypefaceSpan
    > = builder.getSpans(
        0,
        builder.length(),
        android.text.style.TypefaceSpan.class
    );
    for (let index = 0; index < spans.length; index++) {
        const span = spans[index];
        const start = builder.getSpanStart(span);
        const end = builder.getSpanEnd(span);
        const fontFamily = span.getFamily();
        const style = fontFamily.split('-')[1] || builder.removeSpan(span);
        const font = new Font(
            fontFamily,
            0,
            style === 'italic' ? 'italic' : 'normal',
            style === 'bold' ? 'bold' : 'normal'
        );
        const typeface =
            font.getAndroidTypeface() ||
            android.graphics.Typeface.create(fontFamily, 0);
        const typefaceSpan: android.text.style.TypefaceSpan = new org.nativescript.widgets.CustomTypefaceSpan(
            fontFamily,
            typeface
        );
        builder.setSpan(
            typefaceSpan,
            start,
            end,
            android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
        );
    }

    // const ssb = new android.text.SpannableStringBuilder();
    // for (let i = 0, spanStart = 0, spanLength = 0, length = formattedString.spans.length; i < length; i++) {
    //     const span = formattedString.spans.getItem(i);
    //     const text = span.text;
    //     const textTransform = (<TextBase>formattedString.parent).textTransform;
    //     let spanText = (text === null || text === undefined) ? "" : text.toString();
    //     if (textTransform && textTransform !== "none") {
    //         spanText = getTransformedText(spanText, textTransform);
    //     }

    //     spanLength = spanText.length;
    //     if (spanLength > 0) {
    //         ssb.insert(spanStart, spanText);
    //         setSpanModifiers(ssb, span, spanStart, spanStart + spanLength);
    //         spanStart += spanLength;
    //     }
    // }

    return builder;
}

// function setSpanModifiers(ssb: android.text.SpannableStringBuilder, span: Span, start: number, end: number): void {
//     const spanStyle = span.style;
//     const bold = isBold(spanStyle.fontWeight);
//     const italic = spanStyle.fontStyle === 'italic';

//     if (bold && italic) {
//         ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD_ITALIC), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     } else if (bold) {
//         ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     } else if (italic) {
//         ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.ITALIC), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     const fontFamily = span.fontFamily;
//     if (fontFamily) {
//         const font = new Font(fontFamily, 0, italic ? 'italic' : 'normal', bold ? 'bold' : 'normal');
//         const typeface = font.getAndroidTypeface() || android.graphics.Typeface.create(fontFamily, 0);
//         const typefaceSpan: android.text.style.TypefaceSpan = new org.nativescript.widgets.CustomTypefaceSpan(fontFamily, typeface);
//         ssb.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     const realFontSize = span.fontSize;
//     if (realFontSize) {
//         ssb.setSpan(new android.text.style.AbsoluteSizeSpan(realFontSize * layout.getDisplayDensity()), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     const color = span.color;
//     if (color) {
//         ssb.setSpan(new android.text.style.ForegroundColorSpan(color.android), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     let backgroundColor: Color;
//     if (backgroundColorProperty.isSet(spanStyle)) {
//         backgroundColor = spanStyle.backgroundColor;
//     } else if (backgroundColorProperty.isSet(span.parent.style)) {
//         // parent is FormattedString
//         backgroundColor = span.parent.style.backgroundColor;
//     } else if (backgroundColorProperty.isSet(span.parent.parent.style)) {
//         // parent.parent is TextBase
//         backgroundColor = span.parent.parent.style.backgroundColor;
//     }

//     if (backgroundColor) {
//         ssb.setSpan(new android.text.style.BackgroundColorSpan(backgroundColor.android), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     let valueSource: typeof spanStyle;
//     if (textDecorationProperty.isSet(spanStyle)) {
//         valueSource = spanStyle;
//     } else if (textDecorationProperty.isSet(span.parent.style)) {
//         // span.parent is FormattedString
//         valueSource = span.parent.style;
//     } else if (textDecorationProperty.isSet(span.parent.parent.style)) {
//         // span.parent.parent is TextBase
//         valueSource = span.parent.parent.style;
//     }

//     if (valueSource) {
//         const textDecorations = valueSource.textDecoration;
//         const underline = textDecorations.indexOf('underline') !== -1;
//         if (underline) {
//             ssb.setSpan(new android.text.style.UnderlineSpan(), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//         }

//         const strikethrough = textDecorations.indexOf('line-through') !== -1;
//         if (strikethrough) {
//             ssb.setSpan(new android.text.style.StrikethroughSpan(), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//         }
//     }

//     // TODO: Implement letterSpacing for Span here.
//     // const letterSpacing = formattedString.parent.style.letterSpacing;
//     // if (letterSpacing > 0) {
//     //     ssb.setSpan(new android.text.style.ScaleXSpan((letterSpacing + 1) / 10), start, end, android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
//     // }
// }
