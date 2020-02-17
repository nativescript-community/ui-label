import * as application from '@nativescript/core/application';
import * as fs from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling';
import { Font, FontStyle } from '@nativescript/core/ui/styling/font';
import { FontWeight } from '@nativescript/core/ui/styling/font-common';
import { FormattedString } from '@nativescript/core/ui/text-base/formatted-string';
import { Span } from '@nativescript/core/ui/text-base/span';
import { backgroundColorProperty, booleanConverter, Color, colorProperty, CSSType, fontInternalProperty, fontSizeProperty, Length, letterSpacingProperty, lineHeightProperty, Observable, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, Property, PropertyChangeData, TextAlignment, textAlignmentProperty, TextDecoration, textDecorationProperty, TextTransform, textTransformProperty, View, WhiteSpace, whiteSpaceProperty } from '@nativescript/core/ui/text-base/text-base';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, TextShadow } from './label';
import { cssProperty, lineBreakProperty, maxLinesProperty, textShadowProperty, VerticalTextAlignment, verticalTextAlignmentProperty } from './label-common';

let context;
const fontPath = fs.path.join(fs.knownFolders.currentApp().path, 'fonts');

Font.prototype.getAndroidTypeface = function() {
    if (!this._typeface) {
        if (!context) {
            context = application.android.context;
        }
        this._typeface = (com as any).nativescript.label.Font.createTypeface(context, fontPath, this.fontFamily, this.fontWeight, this.isBold, this.isItalic);
    }
    return this._typeface;
};

declare module '@nativescript/core/ui/text-base/formatted-string' {
    interface FormattedString {
        toNativeString(): string;
    }
}
declare module '@nativescript/core/ui/text-base/span' {
    interface Span {
        toNativeString(): string;
    }
}

FormattedString.prototype.toNativeString = function() {
    let result = '';
    const length = this._spans.length;
    for (let i = 0; i < length; i++) {
        result += this._spans.getItem(i).toNativeString() + (i < length - 1 ? String.fromCharCode(0x1f) : '');
    }

    return result;
};

function isBold(fontWeight: FontWeight): boolean {
    return fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900';
}

Span.prototype.toNativeString = function() {
    const textTransform = this.parent.parent.textTransform;
    const spanStyle = this.style;
    let backgroundColor: Color;
    if (backgroundColorProperty.isSet(spanStyle)) {
        backgroundColor = spanStyle.backgroundColor;
    // } else if (backgroundColorProperty.isSet(this.parent.style)) {
        // parent is FormattedString
        // backgroundColor = this.parent.style.backgroundColor;
    // } else if (backgroundColorProperty.isSet(this.parent.parent.style)) {
        // parent.parent is TextBase
        // backgroundColor = this.parent.parent.style.backgroundColor;
    }

    let textDecoration;
    if (textDecorationProperty.isSet(spanStyle)) {
        textDecoration = spanStyle.textDecorations;
    } else if (textDecorationProperty.isSet(this.parent.style)) {
        // span.parent is FormattedString
        textDecoration = this.parent.style.textDecorations;
    } else if (textDecorationProperty.isSet(this.parent.parent.style)) {
        // span.parent.parent is TextBase
        textDecoration = this.parent.parent.style.textDecorations;
    }

    let text = this.text;
    if (text && textTransform != null && textTransform != 'none') {
        text = getTransformedText(text, textTransform);
    }
    const delimiter = String.fromCharCode(0x1e);
    let result = `${this.fontFamily}${delimiter}${this.fontSize}${delimiter}${isBold(this.fontWeight) ? 1 : 0}${delimiter}${
        this.fontStyle === 'italic' ? 1 : 0
    }${delimiter}${textDecoration}${delimiter}${this.color ? this.color.android : undefined}${delimiter}${backgroundColor ? backgroundColor.android : undefined}${delimiter}${this.text}`;

    return result;
};

export * from './label-common';

let TextView: typeof android.widget.TextView;

const CHILD_SPAN = 'Span';
const CHILD_FORMATTED_TEXT = 'formattedText';
const CHILD_FORMATTED_STRING = 'FormattedString';

const resetSymbol = Symbol('textPropertyDefault');
enum SuspendType {
    Incremental = 0,
    Loaded = 1 << 20,
    NativeView = 1 << 21,
    UISetup = 1 << 22,
    IncrementalCountMask = ~((1 << 20) + (1 << 21) + (1 << 22))
}
declare module '@nativescript/core/ui/core/view-base' {
    interface ViewBase {
        _resumeNativeUpdates(type: SuspendType);
        _defaultPaddingTop: number;
        _defaultPaddingRight: number;
        _defaultPaddingBottom: number;
        _defaultPaddingLeft: number;
        _isPaddingRelative: boolean;
        _androidView: any;
    }
}

const textProperty = new Property<Label, string>({ name: 'text', defaultValue: '', affectsLayout: true });
const formattedTextProperty = new Property<Label, FormattedString>({ name: 'formattedText', affectsLayout: true, valueChanged: onFormattedTextPropertyChanged });
export const htmlProperty = new Property<Label, string>({ name: 'html', defaultValue: null, affectsLayout: true });

@CSSType('HTMLLabel')
class LabelBase extends View implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    public html: string;

    public _isSingleLine: boolean;
    public text: string;
    public formattedText: FormattedString;

    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @cssProperty fontFamily: string;
    @cssProperty fontSize: number;
    @cssProperty fontStyle: FontStyle;
    @cssProperty fontWeight: FontWeight;
    @cssProperty letterSpacing: number;
    @cssProperty lineHeight: number;
    @cssProperty textAlignment: TextAlignment;
    @cssProperty textDecoration: TextDecoration;
    @cssProperty textTransform: TextTransform;
    @cssProperty whiteSpace: WhiteSpace;

    @cssProperty padding: string | Length;
    @cssProperty paddingTop: Length;
    @cssProperty paddingRight: Length;
    @cssProperty paddingBottom: Length;
    @cssProperty paddingLeft: Length;

    get textWrap(): boolean {
        return this.style.whiteSpace === 'normal';
    }
    set textWrap(value: boolean) {
        if (typeof value === 'string') {
            value = booleanConverter(value);
        }

        this.style.whiteSpace = value ? 'normal' : 'nowrap';
    }

    public _onFormattedTextContentsChanged(data: PropertyChangeData) {
        if (this.nativeViewProtected) {
            // Notifications from the FormattedString start arriving before the Android view is even created.
            this[formattedTextProperty.setNative](data.value);
        }
    }

    public _addChildFromBuilder(name: string, value: any): void {
        if (name === CHILD_SPAN) {
            if (!this.formattedText) {
                const formattedText = new FormattedString();
                formattedText.spans.push(value);
                this.formattedText = formattedText;
            } else {
                this.formattedText.spans.push(value);
            }
        } else if (name === CHILD_FORMATTED_TEXT || name === CHILD_FORMATTED_STRING) {
            this.formattedText = value;
        }
    }

    _requestLayoutOnTextChanged(): void {
        this.requestLayout();
    }

    // eachChild(callback: (child: ViewBase) => boolean): void {
    //     let text = this.formattedText;
    //     if (text) {
    //         callback(text);
    //     }
    // }

    _setNativeText(reset: boolean = false): void {
        //
    }

    protected _paintFlags: number;
}

export class Label extends LabelBase {
    nativeViewProtected: android.widget.TextView;
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @profile
    public createNativeView() {
        if (!TextView) {
            TextView = (com as any).nativescript.label.Label;
            // TextView = android.widget.TextView;
        }
        return new TextView(this._context);
    }

    public initNativeView(): void {
        super.initNativeView();
        const nativeView = this.nativeViewProtected;

        // This makes the html <a href...> work
        // nativeView.setLinksClickable(false);
        // nativeView.setMovementMethod(null);
        // nativeView.setMovementMethod(android.text.method.LinkMovementMethod.getInstance());
    }

    public resetNativeView(): void {
        super.resetNativeView();
        // this.nativeViewProtected.setAutoLinkMask(0);
    }

    [htmlProperty.getDefault](): string {
        return '';
    }

    [formattedTextProperty.setNative](value: FormattedString) {
        // profile('formattedTextProperty', () => {
        this._setNativeText();
        // textProperty.nativeValueChange(this, !value ? '' : value.toString());
        // this._requestLayoutOnTextChanged();
        // })();
    }

    // @profile
    // setHtml(value: string) {
    //     const nativeView = this.nativeViewProtected;
    //     if (value) {
    //         nativeView.setText((com as any).nativescript.label.Font.stringBuilderFromHtmlString(context, fontPath, value));
    //     } else {
    //         nativeView.setText(null);
    //     }
    // }
    [htmlProperty.setNative](value: string) {
        // this.setHtml(value);
        this._setNativeText();
        // textProperty.nativeValueChange(this, value === null || value === undefined ? '' : value.toString());
    }

    [maxLinesProperty.getDefault](): number | string {
        return 'none';
    }
    [maxLinesProperty.setNative](value: number | string) {
        // profile('maxLinesProperty', () => {
        if (value === 'none') {
            this.nativeViewProtected.setMaxLines(-1);
        } else {
            this.nativeViewProtected.setMaxLines(value as number);
        }
        // })();
    }
    [lineBreakProperty.setNative](value: string) {
        // profile('lineBreakProperty', () => {
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
        // })();
    }

    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        // profile('whiteSpaceProperty', () => {
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
        // })();
    }
    [textShadowProperty.setNative](value: TextShadow) {
        // profile('textShadowProperty', () => {
        this.nativeViewProtected.setShadowLayer(layout.toDevicePixels(value.blurRadius), layout.toDevicePixels(value.offsetX), layout.toDevicePixels(value.offsetY), value.color.android);
        // })();
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        // profile('verticalTextAlignmentProperty', () => {
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
        // })();
    }

    [textProperty.getDefault](): symbol | number {
        return resetSymbol;
    }

    [textProperty.setNative](value: string | number | symbol) {
        const reset = value === resetSymbol;
        if (!reset && this.formattedText) {
            return;
        }
        // profile('textProperty', () => {
        this._setNativeText(reset);
        // })();
    }

    [formattedTextProperty.setNative](value: FormattedString) {
        // profile('formattedTextProperty', () => {
        // const nativeView = this.nativeTextViewProtected;
        this._setNativeText();
        // if (!value) {
        //     if (nativeView instanceof android.widget.Button && nativeView.getTransformationMethod() instanceof TextTransformation) {
        //         nativeView.setTransformationMethod(this._defaultTransformationMethod);
        //     }
        // }

        // Don't change the transformation method if this is secure TextField or we'll lose the hiding characters.
        // if ((<any>this).secure) {
        //     return;
        // }

        // const spannableStringBuilder = createSpannableStringBuilder(value);
        // nativeView.setText(<any>spannableStringBuilder);

        // textProperty.nativeValueChange(this, value === null || value === undefined ? '' : value.toString());

        // if (spannableStringBuilder && nativeView instanceof android.widget.Button && !(nativeView.getTransformationMethod() instanceof TextTransformation)) {
        //     // Replace Android Button's default transformation (in case the developer has not already specified a text-transform) method
        //     // with our transformation method which can handle formatted text.
        //     // Otherwise, the default tranformation method of the Android Button will overwrite and ignore our spannableStringBuilder.
        //     nativeView.setTransformationMethod(new TextTransformation(this));
        // }
        // })();
    }

    [textTransformProperty.setNative](value: TextTransform) {
        // if (value === 'initial') {
        //     this.nativeTextViewProtected.setTransformationMethod(this._defaultTransformationMethod);

        //     return;
        // }

        // Don't change the transformation method if this is secure TextField or we'll lose the hiding characters.
        if ((<any>this).secure) {
            return;
        }
        // profile('textTransformProperty', () => {
        this._setNativeText();
        // })();
        // this.nativeTextViewProtected.setTransformationMethod(new TextTransformation(this));
    }

    [textAlignmentProperty.getDefault](): TextAlignment {
        return 'initial';
    }
    [textAlignmentProperty.setNative](value: TextAlignment) {
        // profile('textAlignmentProperty', () => {
        let verticalGravity = this.nativeTextViewProtected.getGravity() & android.view.Gravity.VERTICAL_GRAVITY_MASK;
        switch (value) {
            case 'initial':
            case 'left':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.START | verticalGravity);
                break;

            case 'center':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.CENTER_HORIZONTAL | verticalGravity);
                break;

            case 'right':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.END | verticalGravity);
                break;
        }
        // })();
    }

    // Overridden in TextField because setSingleLine(false) will remove methodTransformation.
    // and we don't want to allow TextField to be multiline
    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        // profile('whiteSpaceProperty', () => {
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
        // })();
    }

    // [colorProperty.getDefault](): android.content.res.ColorStateList {
    //     console.log('get colorProperty');
    //     return this.nativeTextViewProtected.getTextColors();
    // }
    [colorProperty.setNative](value: Color | android.content.res.ColorStateList) {
        // profile('colorProperty', () => {
            if (value instanceof Color) {
                this.nativeTextViewProtected.setTextColor(value.android);
            } else {
                this.nativeTextViewProtected.setTextColor(value);
            }
        // })();
    }

    // [fontSizeProperty.getDefault](): { nativeSize: number } {
    //     console.log('get fontSizeProperty');
    //     return { nativeSize: this.nativeTextViewProtected.getTextSize() };
    // }
    [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        // profile('fontSizeProperty', () => {
            if (typeof value === 'number') {
                this.nativeTextViewProtected.setTextSize(value);
            } else {
                this.nativeTextViewProtected.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, value.nativeSize);
            }
        // })();
    }

    // [lineHeightProperty.getDefault](): number {
    //     console.log('get lineHeightProperty');
    //     return this.nativeTextViewProtected.getLineSpacingExtra() / layout.getDisplayDensity();
    // }
    [lineHeightProperty.setNative](value: number) {
        // profile('lineHeightProperty', () => {
        this.nativeTextViewProtected.setLineSpacing(value * layout.getDisplayDensity(), 1);
        // })();
    }

    // [fontInternalProperty.getDefault](): android.graphics.Typeface {
    //     console.log('get fontInternalProperty');
    //     return this.nativeTextViewProtected.getTypeface();
    // }
    [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        // profile('fontInternalProperty', () => {
        // if (!(value instanceof Font)) {
            this.nativeTextViewProtected.setTypeface(value instanceof Font ? value.getAndroidTypeface() : value);
        // }
        // })();
    }

    // [textDecorationProperty.getDefault](value: number) {
    //     console.log('get textDecorationProperty');
    //     return (this._paintFlags = this.nativeTextViewProtected.getPaintFlags());
    // }

    [textDecorationProperty.setNative](value: number | TextDecoration) {
        // profile('textDecorationProperty', () => {
        switch (value) {
            case 'none':
                this.nativeTextViewProtected.setPaintFlags(0);
                break;
            case 'underline':
                this.nativeTextViewProtected.setPaintFlags(android.graphics.Paint.UNDERLINE_TEXT_FLAG);
                break;
            case 'line-through':
                this.nativeTextViewProtected.setPaintFlags(android.graphics.Paint.STRIKE_THRU_TEXT_FLAG);
                break;
            case 'underline line-through':
                this.nativeTextViewProtected.setPaintFlags(android.graphics.Paint.UNDERLINE_TEXT_FLAG | android.graphics.Paint.STRIKE_THRU_TEXT_FLAG);
                break;
            default:
                this.nativeTextViewProtected.setPaintFlags(value);
                break;
        }
        // })();
    }

    // [letterSpacingProperty.getDefault](): number {
    //     console.log('get letterSpacingProperty');
    //     return org.nativescript.widgets.ViewHelper.getLetterspacing(this.nativeTextViewProtected);
    // }
    [letterSpacingProperty.setNative](value: number) {
        // profile('letterSpacingProperty',() =>{
        org.nativescript.widgets.ViewHelper.setLetterspacing(this.nativeTextViewProtected, value);
        // })();
    }

    [paddingTopProperty.getDefault](): Length {
        return { value: this._defaultPaddingTop, unit: 'px' };
    }
    [paddingTopProperty.setNative](value: Length) {
        // profile('paddingTopProperty',() =>{
        org.nativescript.widgets.ViewHelper.setPaddingTop(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0));
        // })();
    }

    [paddingRightProperty.getDefault](): Length {
        return { value: this._defaultPaddingRight, unit: 'px' };
    }
    [paddingRightProperty.setNative](value: Length) {
        // profile('paddingRightProperty',() =>{
        org.nativescript.widgets.ViewHelper.setPaddingRight(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0));
        // })();
    }

    [paddingBottomProperty.getDefault](): Length {
        return { value: this._defaultPaddingBottom, unit: 'px' };
    }
    [paddingBottomProperty.setNative](value: Length) {
        // profile('paddingBottomProperty',() =>{
        org.nativescript.widgets.ViewHelper.setPaddingBottom(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0));
        // })();
    }

    [paddingLeftProperty.getDefault](): Length {
        return { value: this._defaultPaddingLeft, unit: 'px' };
    }
    [paddingLeftProperty.setNative](value: Length) {
        // profile('paddingLeftProperty',() =>{
        org.nativescript.widgets.ViewHelper.setPaddingLeft(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0));
        // })();
    }

    @profile
    _setNativeText(reset: boolean = false): void {
        if (reset) {
            this.nativeTextViewProtected.setText(null);

            return;
        }

        let transformedText: any;
        if (this.html) {
            transformedText = (com as any).nativescript.label.Font.stringBuilderFromHtmlString(context, fontPath, this.html);
            textProperty.nativeValueChange(this, this.html === null || this.html === undefined ? '' : this.html);
        } else if (this.formattedText) {
            transformedText = createSpannableStringBuilder(this.formattedText);
            textProperty.nativeValueChange(this, this.formattedText === null || this.formattedText === undefined ? '' : this.formattedText.toString());
        } else {
            const text = this.text;
            const stringValue = text === null || text === undefined ? '' : text.toString();
            transformedText = getTransformedText(stringValue, this.textTransform);
        }
        this.nativeTextViewProtected.setText(transformedText);
    }

    @profile
    public _setupUI(context: android.content.Context, atIndex?: number, parentIsLoaded?: boolean): void {
        if (this._context === context) {
            return;
        } else if (this._context) {
            this._tearDownUI(true);
        }

        this._context = context;

        // This will account for nativeView that is created in createNativeView, recycled
        // or for backward compatability - set before _setupUI in iOS contructor.
        let nativeView = this.nativeViewProtected;

        // if (isAndroid) {
        //     const recycle = this.recycleNativeView;
        //     if (recycle === "always" || (recycle === "auto" && !this._disableNativeViewRecycling)) {
        //         nativeView = <android.view.View>getNativeView(context, this.typeName);
        //     }
        // }
        if (!nativeView) {
            nativeView = this.createNativeView();
        }

        // if (isAndroid) {
        this._androidView = nativeView;
        if (nativeView) {
            // profile('label padding setup', ()=> {
            if (this._isPaddingRelative === undefined) {
                this._isPaddingRelative = false;
                // this._isPaddingRelative = nativeView.isPaddingRelative();
            }

            // let result: any /* android.graphics.Rect */ = (<any>nativeView).defaultPaddings;
            // if (result === undefined) {
            //     result = org.nativescript.widgets.ViewHelper.getPadding(nativeView);
            //     (<any>nativeView).defaultPaddings = result;
            // }

            // this._defaultPaddingTop = result.top;
            // this._defaultPaddingRight = result.right;
            // this._defaultPaddingBottom = result.bottom;
            // this._defaultPaddingLeft = result.left;
            this._defaultPaddingTop = 0;
            this._defaultPaddingRight = 0;
            this._defaultPaddingBottom = 0;
            this._defaultPaddingLeft = 0;

            // const style = this.style;
            // if (!paddingTopProperty.isSet(style)) {
            //     this.effectivePaddingTop = this._defaultPaddingTop;
            // }
            // if (!paddingRightProperty.isSet(style)) {
            //     this.effectivePaddingRight = this._defaultPaddingRight;
            // }
            // if (!paddingBottomProperty.isSet(style)) {
            //     this.effectivePaddingBottom = this._defaultPaddingBottom;
            // }
            // if (!paddingLeftProperty.isSet(style)) {
            //     this.effectivePaddingLeft = this._defaultPaddingLeft;
            // }
            // })();
        }
        // } else {
        // this._iosView = nativeView;
        // }

        this.setNativeView(nativeView);

        // profile('label _addViewToNativeVisualTreep',() =>{
        if (this.parent) {
            // const nativeIndex = this.parent._childIndexToNativeChildIndex(atIndex);
            this._isAddedToNativeVisualTree = this.parent._addViewToNativeVisualTree(this, undefined);
        }
        // })();
        // profile('label _resumeNativeUpdates', () => {
        this._resumeNativeUpdates(SuspendType.UISetup);
        // })();

        // this.eachChild(child => {
        //     child._setupUI(context);

        //     return true;
        // });
    }
}

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

function createSpannableStringBuilder(formattedString: FormattedString): android.text.SpannableStringBuilder {
    const nativeString = formattedString.toNativeString();
    return (com as any).nativescript.label.Font.stringBuilderFromFormattedString(context, fontPath, nativeString);
}

// const createSpannableStringBuilder = profile('createSpannableStringBuilder', function createSpannableStringBuilder(spannedString: android.text.Spanned): android.text.SpannableStringBuilder {
//     if (!spannedString) {
//         return null;
//     }
//     const builder = new android.text.SpannableStringBuilder(spannedString as any);
//     const spans: native.Array<android.text.style.TypefaceSpan> = builder.getSpans(0, builder.length(), android.text.style.TypefaceSpan.class);
//     for (let index = 0; index < spans.length; index++) {
//         const span = spans[index];
//         const start = builder.getSpanStart(span);
//         const end = builder.getSpanEnd(span);
//         const fontFamily = span.getFamily();
//         const style = fontFamily.split('-')[1] || builder.removeSpan(span);
//         const font = new Font(fontFamily, 0, style === 'italic' ? 'italic' : 'normal', style === 'bold' ? 'bold' : 'normal');
//         const typeface = font.getAndroidTypeface() || android.graphics.Typeface.create(fontFamily, 0);
//         const typefaceSpan: android.text.style.TypefaceSpan = new org.nativescript.widgets.CustomTypefaceSpan(fontFamily, typeface);
//         builder.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
//     }

//     // const ssb = new android.text.SpannableStringBuilder();
//     // for (let i = 0, spanStart = 0, spanLength = 0, length = formattedString.spans.length; i < length; i++) {
//     //     const span = formattedString.spans.getItem(i);
//     //     const text = span.text;
//     //     const textTransform = (<TextBase>formattedString.parent).textTransform;
//     //     let spanText = (text === null || text === undefined) ? "" : text.toString();
//     //     if (textTransform && textTransform !== "none") {
//     //         spanText = getTransformedText(spanText, textTransform);
//     //     }

//     //     spanLength = spanText.length;
//     //     if (spanLength > 0) {
//     //         ssb.insert(spanStart, spanText);
//     //         setSpanModifiers(ssb, span, spanStart, spanStart + spanLength);
//     //         spanStart += spanLength;
//     //     }
//     // }

//     return builder;
// });

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

textProperty.register(Label);
htmlProperty.register(Label);
formattedTextProperty.register(Label);

function onFormattedTextPropertyChanged(textBase: Label, oldValue: FormattedString, newValue: FormattedString) {
    if (oldValue) {
        oldValue.off(Observable.propertyChangeEvent, textBase._onFormattedTextContentsChanged, textBase);
        textBase._removeView(oldValue);
    }

    if (newValue) {
        const oldParent = newValue.parent;
        // In case formattedString is attached to new TextBase
        if (oldParent) {
            oldParent._removeView(newValue);
        }
        textBase._addView(newValue);
        newValue.on(Observable.propertyChangeEvent, textBase._onFormattedTextContentsChanged, textBase);
    }
}
