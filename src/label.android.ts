import * as application from '@nativescript/core/application';
import * as fs from '@nativescript/core/file-system';
import { profile } from '@nativescript/core/profiling';
import { Font, FontStyle } from '@nativescript/core/ui/styling/font';
import { FontWeight } from '@nativescript/core/ui/styling/font-common';
import { FormattedString } from '@nativescript/core/ui/text-base/formatted-string';
import { Span } from '@nativescript/core/ui/text-base/span';
import {
    backgroundColorProperty,
    booleanConverter,
    Color,
    colorProperty,
    CSSType,
    fontInternalProperty,
    fontSizeProperty,
    Length,
    letterSpacingProperty,
    lineHeightProperty,
    Observable,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty,
    Property,
    PropertyChangeData,
    TextAlignment,
    textAlignmentProperty,
    TextDecoration,
    textDecorationProperty,
    TextTransform,
    textTransformProperty,
    View,
    WhiteSpace,
    whiteSpaceProperty,
    ViewBase,
    fontFamilyProperty
} from '@nativescript/core/ui/text-base/text-base';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, TextShadow, LineBreak } from './label';
import { cssProperty, needFormattedStringComputation, lineBreakProperty, maxLinesProperty, textShadowProperty, VerticalTextAlignment, verticalTextAlignmentProperty, textAlignmentConverter } from './label-common';

export function enableIOSDTCoreText() {} //unused

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
    let result = `${this.fontFamily || 0}${delimiter}${this.fontSize !== undefined ? this.fontSize: -1}${delimiter}${this.fontWeight || ''}${delimiter}${
        this.fontStyle === 'italic' ? 1 : 0
    }${delimiter}${textDecoration || 0}${delimiter}${this.color ? this.color.android : -1}${delimiter}${backgroundColor ? backgroundColor.android : -1}${delimiter}${this.text}`;
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



export function buildHTMLString(data: {
    text: string;
    color: Color | string | number;
    familyName: string;
    fontSize: number;
    letterSpacing?: number;
    lineHeight?: number;
    textAlignment: NSTextAlignment | TextAlignment;
}) {
    if (data.textAlignment && typeof data.textAlignment === 'string') {
        data.textAlignment = textAlignmentConverter(data.textAlignment);
    }
    if (data.color && !(data.color instanceof Color)) {
        data.color = new Color(data.color as any);
    }
    const result = (com as any).nativescript.label.Font.stringBuilderFromHtmlString(context, fontPath, data.text);
    return result;
}

@CSSType('HTMLLabel')
abstract class LabelBase extends View implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    public html: string;

    public _isSingleLine: boolean;
    public text: string;
    public formattedText: FormattedString;
    public spannableStringBuilder: globalAndroid.text.SpannableStringBuilder;

    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @cssProperty fontFamily: string;
    @cssProperty fontSize: number;
    @cssProperty fontStyle: FontStyle;
    @cssProperty fontWeight: FontWeight;
    @cssProperty letterSpacing: number;
    @cssProperty lineHeight: number;
    @cssProperty lineBreak: LineBreak;
    @cssProperty textAlignment: TextAlignment;
    @cssProperty textDecoration: TextDecoration;
    @cssProperty textTransform: TextTransform;
    @cssProperty whiteSpace: WhiteSpace;

    @cssProperty padding: string | Length;
    @cssProperty paddingTop: Length;
    @cssProperty paddingRight: Length;
    @cssProperty paddingBottom: Length;
    @cssProperty paddingLeft: Length;

    // for now code is duplicated as Android version is a full rewrite
    _canChangeText = true;
    _needFormattedStringComputation = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this._canChangeText = false;
        super.onResumeNativeUpdates();
        this._canChangeText = true;
        if (this._needFormattedStringComputation) {
            this._needFormattedStringComputation = false;
            this._setNativeText();
        }
    }

    get textWrap(): boolean {
        return this.style.whiteSpace === 'normal';
    }
    set textWrap(value: boolean) {
        if (typeof value === 'string') {
            value = booleanConverter(value);
        }
        const newValue = value ? 'normal' : 'nowrap'
        if (this.style.whiteSpace !== newValue) {
            this.style.whiteSpace = newValue;
        }
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

    // without this spans class wont work :s
    eachChild(callback: (child: ViewBase) => boolean): void {
        let text = this.formattedText;
        if (text) {
            callback(text);
        }
    }

    abstract _setNativeText(reset?: boolean):void;

    protected _paintFlags: number;
}

export class Label extends LabelBase {
    nativeViewProtected: android.widget.TextView;
    handleFontSize = true;
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @profile
    public createNativeView() {
        if (!TextView) {
            TextView = (com as any).nativescript.label.EllipsizingTextView;
            // TextView = android.widget.TextView;
        }
        return new TextView(this._context);
    }


    [htmlProperty.getDefault](): string {
        return '';
    }


    @needFormattedStringComputation
    [htmlProperty.setNative](value: string) {
        this._setNativeText();
    }

    [maxLinesProperty.getDefault](): number | string {
        return 'none';
    }
    [maxLinesProperty.setNative](value: number | string) {
        // this.nativeViewProtected.setMinLines(1);
        if (value === 'none') {
            this.nativeViewProtected.setMaxLines(-1);
        } else {
            this.nativeViewProtected.setMaxLines(typeof value === 'string' ? parseInt(value, 10) : value);
        }
    }
    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        switch (value) {
            case 'end':
                // nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
                break;
            case 'start':
                // nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.START);
                break;
            case 'marquee':
                // nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.MARQUEE);
                break;
            case 'middle':
                // nativeView.setSingleLine(true);
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
                break;
            case 'none':
                // nativeView.setSingleLine(false);
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
                // nativeView.setEllipsize(null);
                break;
            case 'nowrap':
                nativeView.setSingleLine(true);
                // nativeView.setEllipsize(android.text.TextUtils.TruncateAt.END);
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
            case 'center':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.CENTER_VERTICAL | horizontalGravity);
                break;

            case 'bottom':
                this.nativeTextViewProtected.setGravity(android.view.Gravity.BOTTOM | horizontalGravity);
                break;
        }
    }

    [textProperty.getDefault](): symbol | number {
        return resetSymbol;
    }

    @needFormattedStringComputation
    [textProperty.setNative](value: string | number | symbol) {
        this._setNativeText();
    }

    @needFormattedStringComputation
    [formattedTextProperty.setNative](value: FormattedString) {
        this._setNativeText();
       
    }

    @needFormattedStringComputation
    [textTransformProperty.setNative](value: TextTransform) {
        // Don't change the transformation method if this is secure TextField or we'll lose the hiding characters.
        if ((<any>this).secure) {
            return;
        }
        this._setNativeText();
    }

    [textAlignmentProperty.getDefault](): TextAlignment {
        return 'initial';
    }
    [textAlignmentProperty.setNative](value: TextAlignment) {
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
    }

    [colorProperty.setNative](value: Color | android.content.res.ColorStateList) {
        if (value instanceof Color) {
            this.nativeTextViewProtected.setTextColor(value.android);
        } else {
            this.nativeTextViewProtected.setTextColor(value);
        }
    }
    [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        if (typeof value === 'number') {
            this.nativeTextViewProtected.setTextSize(value);
        } else {
            this.nativeTextViewProtected.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, value.nativeSize);
        }
    }

    [lineHeightProperty.setNative](value: number) {
        this.nativeTextViewProtected.setLineSpacing(value * layout.getDisplayDensity(), 1);
    }

    [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        this.nativeTextViewProtected.setTypeface(value instanceof Font ? value.getAndroidTypeface() : value);
    }

    [textDecorationProperty.setNative](value: number | TextDecoration) {
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
    }

    [letterSpacingProperty.setNative](value: number) {
        org.nativescript.widgets.ViewHelper.setLetterspacing(this.nativeTextViewProtected, value);
    }

    [paddingTopProperty.getDefault](): Length {
        return { value: this._defaultPaddingTop, unit: 'px' };
    }
    [paddingTopProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingTop(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0));
    }

    [paddingRightProperty.getDefault](): Length {
        return { value: this._defaultPaddingRight, unit: 'px' };
    }
    [paddingRightProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingRight(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0));
    }

    [paddingBottomProperty.getDefault](): Length {
        return { value: this._defaultPaddingBottom, unit: 'px' };
    }
    [paddingBottomProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingBottom(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0));
    }

    [paddingLeftProperty.getDefault](): Length {
        return { value: this._defaultPaddingLeft, unit: 'px' };
    }
    [paddingLeftProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingLeft(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0));
    }


    @profile
    createHTMLString() {
        return (com as any).nativescript.label.Font.stringBuilderFromHtmlString(context, fontPath, this.html);
    }
    @profile
    createSpannableStringBuilder() {
        return createSpannableStringBuilder(this.formattedText);
    }

    @profile
    _setNativeText(reset: boolean = false): void {
        if (reset) {
            this.nativeTextViewProtected.setText(null);
            return;
        }

        let transformedText: any = null;
        if (this.spannableStringBuilder) {
            transformedText = this.spannableStringBuilder;
            // textProperty.nativeValueChange(this, this.html === null || this.html === undefined ? '' : this.html);
        } else if (this.html) {
            transformedText = this.createHTMLString();
            textProperty.nativeValueChange(this, this.html === null || this.html === undefined ? '' : this.html);
        } else if (this.formattedText) {
            transformedText = this.createSpannableStringBuilder();
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

        if (!nativeView) {
            nativeView = this.createNativeView();
        }

        this._androidView = nativeView;
        // if (nativeView) {
            // if (this._isPaddingRelative === undefined) {
            //     this._isPaddingRelative = false;
            // }

            // this._defaultPaddingTop = 0;
            // this._defaultPaddingRight = 0;
            // this._defaultPaddingBottom = 0;
            // this._defaultPaddingLeft = 0;

        // }

        this.setNativeView(nativeView);
        if (this.parent) {
            this._isAddedToNativeVisualTree = this.parent._addViewToNativeVisualTree(this, undefined);
        }
        this._resumeNativeUpdates(SuspendType.UISetup);
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
