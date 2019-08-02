import { htmlProperty, LabelBase, lineBreakProperty, maxLinesProperty, textShadowProperty, VerticalTextAlignment, verticalTextAlignmentProperty } from './label-common';
// import { backgroundColorProperty } from 'tns-core-modules/ui/page/page';
import { TextTransform, VerticalAlignment, verticalAlignmentProperty, WhiteSpace, whiteSpaceProperty } from 'tns-core-modules/ui/text-base/text-base';
import { Font } from 'tns-core-modules/ui/styling/font';
import { layout } from 'tns-core-modules/utils/utils';

Font.prototype.getAndroidTypeface = function() {
    if (!this._typeface) {
        this._typeface = createTypeface(this);
    }
    return this._typeface;
};
// import { Span } from 'tns-core-modules/text/span';

export * from './label-common';

let _useAndroidX;
function useAndroidX() {
    if (_useAndroidX === undefined) {
        _useAndroidX = !!(global as any).androidx && !!(global as any).androidx.appcompat;
    }
    return _useAndroidX;
}
let _HtmlCompat: typeof androidx.core.text.HtmlCompat;
function HtmlCompat() {
    if (_HtmlCompat === undefined) {
        _HtmlCompat = useAndroidX() ? (global as any).androidx.core.text.HtmlCompat : android.text.Html;
    }
    return _HtmlCompat;
}
let _ContentPackageName: typeof androidx.core.content;
function ContentPackageName() {
    if (_ContentPackageName === undefined) {
        _ContentPackageName = useAndroidX() ? (global as any).androidx.core.content : (android as any).support.v4.content;
    }
    return _ContentPackageName;
}
import * as application from 'tns-core-modules/application';
import * as fs from 'tns-core-modules/file-system';
import { categories as traceCategories, isEnabled as traceEnabled, messageType as traceMessageType, write as traceWrite } from 'tns-core-modules/trace';
import { Font as FontBase, FontWeight, genericFontFamilies, parseFontFamily } from 'tns-core-modules/ui/styling/font-common';
import { TextShadow } from './label';
let appAssets: android.content.res.AssetManager;
const typefaceCache = new Map<string, android.graphics.Typeface>();
const FONTS_BASE_PATH = '/fonts/';
function loadFontFromFile(fontFamily: string): android.graphics.Typeface {
    if (fontFamily.startsWith('res/')) {
        let result = typefaceCache.get(fontFamily);
        if (!result) {
            const context = application.android.context;
            const fontID = context.getResources().getIdentifier(fontFamily.slice(4), 'font', context.getPackageName());
            result = ContentPackageName().res.ResourcesCompat.getFont(context, fontID);
            if (result) {
                typefaceCache.set(fontFamily, result);
            }
            return result;
        }
    }
    appAssets = appAssets || application.android.context.getAssets();
    if (!appAssets) {
        return null;
    }

    let result = typefaceCache.get(fontFamily);
    // Check for undefined explicitly as null mean we tried to load the font, but failed.
    if (result === undefined) {
        result = null;

        let fontAssetPath: string;
        const basePath = fs.path.join(fs.knownFolders.currentApp().path, 'fonts', fontFamily);
        if (fs.File.exists(basePath + '.ttf')) {
            fontAssetPath = FONTS_BASE_PATH + fontFamily + '.ttf';
        } else if (fs.File.exists(basePath + '.otf')) {
            fontAssetPath = FONTS_BASE_PATH + fontFamily + '.otf';
        } else {
            if (traceEnabled()) {
                traceWrite('Could not find font file for ' + fontFamily, traceCategories.Error, traceMessageType.error);
            }
        }

        if (fontAssetPath) {
            try {
                fontAssetPath = fs.path.join(fs.knownFolders.currentApp().path, fontAssetPath);
                result = android.graphics.Typeface.createFromFile(fontAssetPath);
            } catch (e) {
                if (traceEnabled()) {
                    traceWrite('Error loading font asset: ' + fontAssetPath, traceCategories.Error, traceMessageType.error);
                }
            }
        }
        typefaceCache.set(fontFamily, result);
    }

    return result;
}

function createTypeface(font: Font): android.graphics.Typeface {
    let fontStyle = 0;
    if (font.isBold) {
        fontStyle |= android.graphics.Typeface.BOLD;
    }
    if (font.isItalic) {
        fontStyle |= android.graphics.Typeface.ITALIC;
    }

    // http://stackoverflow.com/questions/19691530/valid-values-for-androidfontfamily-and-what-they-map-to
    const fonts = parseFontFamily(font.fontFamily);
    let result = null;
    for (let i = 0; i < fonts.length; i++) {
        switch (fonts[i].toLowerCase()) {
            case genericFontFamilies.serif:
                result = android.graphics.Typeface.create('serif' + getFontWeightSuffix(font.fontWeight), fontStyle);
                break;

            case genericFontFamilies.sansSerif:
            case genericFontFamilies.system:
                result = android.graphics.Typeface.create('sans-serif' + getFontWeightSuffix(font.fontWeight), fontStyle);
                break;

            case genericFontFamilies.monospace:
                result = android.graphics.Typeface.create('monospace' + getFontWeightSuffix(font.fontWeight), fontStyle);
                break;

            default:
                result = loadFontFromFile(fonts[i]);
                if (result && fontStyle) {
                    result = android.graphics.Typeface.create(result, fontStyle);
                }
                break;
        }

        if (result) {
            // Found the font!
            break;
        }
    }

    if (!result) {
        result = android.graphics.Typeface.create('sans-serif' + getFontWeightSuffix(font.fontWeight), fontStyle);
    }

    return result;
}

function getFontWeightSuffix(fontWeight: FontWeight): string {
    switch (fontWeight) {
        case FontWeight.THIN:
            return android.os.Build.VERSION.SDK_INT >= 16 ? '-thin' : '';
        case FontWeight.EXTRA_LIGHT:
        case FontWeight.LIGHT:
            return android.os.Build.VERSION.SDK_INT >= 16 ? '-light' : '';
        case FontWeight.NORMAL:
        case '400':
        case undefined:
        case null:
            return '';
        case FontWeight.MEDIUM:
        case FontWeight.SEMI_BOLD:
            return android.os.Build.VERSION.SDK_INT >= 21 ? '-medium' : '';
        case FontWeight.BOLD:
        case '700':
        case FontWeight.EXTRA_BOLD:
            return '';
        case FontWeight.BLACK:
            return android.os.Build.VERSION.SDK_INT >= 21 ? '-black' : '';
        default:
            throw new Error(`Invalid font weight: "${fontWeight}"`);
    }
}

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
        nativeView.setMovementMethod(null);
        // nativeView.setMovementMethod(android.text.method.LinkMovementMethod.getInstance());
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
        let spannableStringBuilder: android.text.SpannableStringBuilder;
        if (useAndroidX()) {
            spannableStringBuilder = createSpannableStringBuilder(HtmlCompat().fromHtml(value, HtmlCompat().FROM_HTML_MODE_COMPACT));
        } else {
            spannableStringBuilder = createSpannableStringBuilder(android.text.Html.fromHtml(value));
        }
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
                nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
                break;
            case 'start':
                nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.START);
                break;
            case 'middle':
                nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
                break;
            case 'none':
                nativeView.setSingleLine(false);
                nativeView.setEllipsize(null);
                break;
        }
    }

    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        const nativeView = this.nativeTextViewProtected;
        switch (value) {
            case 'initial':
            case 'normal':
                nativeView.setSingleLine(false);
                nativeView.setEllipsize(null);
                break;
            case 'nowrap':
                nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
                break;
        }
    }
    [textShadowProperty.setNative](value: TextShadow) {
        this.nativeViewProtected.setShadowLayer(layout.toDevicePixels(value.blurRadius), layout.toDevicePixels(value.offsetX), layout.toDevicePixels(value.offsetY), value.color.android);
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        const horizontalGravity = this.nativeTextViewProtected.getGravity() & android.view.Gravity.HORIZONTAL_GRAVITY_MASK;
        switch (value) {
            case 'initial':
            case 'top':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.TOP | horizontalGravity);
                break;
            case 'middle':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.CENTER_VERTICAL | horizontalGravity);
                break;

            case 'bottom':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.BOTTOM | horizontalGravity);
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

export function getTransformedText(text: string, textTransform: TextTransform): string {
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

function createSpannableStringBuilder(spannedString: android.text.Spanned): android.text.SpannableStringBuilder {
    if (!spannedString) {
        return null;
    }
    const builder = new android.text.SpannableStringBuilder(spannedString as any);
    const spans: native.Array<android.text.style.TypefaceSpan> = builder.getSpans(0, builder.length(), android.text.style.TypefaceSpan.class);
    for (let index = 0; index < spans.length; index++) {
        const span = spans[index];
        const start = builder.getSpanStart(span);
        const end = builder.getSpanEnd(span);
        const fontFamily = span.getFamily();
        const style = fontFamily.split('-')[1] || builder.removeSpan(span);
        const font = new Font(fontFamily, 0, style === 'italic' ? 'italic' : 'normal', style === 'bold' ? 'bold' : 'normal');
        const typeface = font.getAndroidTypeface() || android.graphics.Typeface.create(fontFamily, 0);
        const typefaceSpan: android.text.style.TypefaceSpan = new org.nativescript.widgets.CustomTypefaceSpan(fontFamily, typeface);
        builder.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
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
