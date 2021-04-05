import {
    LightFormattedString,
    VerticalTextAlignment,
    createNativeAttributedString,
    cssProperty,
    overrideSpanAndFormattedStringEnabled,
    verticalTextAlignmentProperty
} from '@nativescript-community/text';
import {
    CSSType,
    FormattedString,
    Observable,
    Property,
    PropertyChangeData,
    Span,
    View,
    ViewBase,
    booleanConverter,
    profile
} from '@nativescript/core';
import { Color } from '@nativescript/core/color';
import { Font, FontStyle, FontWeight } from '@nativescript/core/ui/styling/font';
import {
    Length,
    colorProperty,
    fontInternalProperty,
    fontSizeProperty,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty
} from '@nativescript/core/ui/styling/style-properties';
import {
    TextAlignment,
    TextDecoration,
    TextTransform,
    WhiteSpace,
    letterSpacingProperty,
    textAlignmentProperty,
    textDecorationProperty,
    textTransformProperty,
    whiteSpaceProperty
} from '@nativescript/core/ui/text-base';
import { lineHeightProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { layout } from '@nativescript/core/utils/utils';
import { Label as LabelViewDefinition, LineBreak, TextShadow } from './label';
import {
    autoFontSizeProperty,
    lineBreakProperty,
    maxLinesProperty,
    needFormattedStringComputation,
    selectableProperty,
    textShadowProperty
} from './label-common';

export { enableIOSDTCoreText, createNativeAttributedString } from '@nativescript-community/text';

export * from './label-common';

let TextView: typeof com.nativescript.label.EllipsizingTextView;

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
declare module '@nativescript/core/ui/text-base' {
    interface TextBase {
        _setTappableState(tappable: boolean);
    }
}

const textProperty = new Property<Label, string>({ name: 'text', defaultValue: '', affectsLayout: true });
const formattedTextProperty = new Property<Label, FormattedString>({
    name: 'formattedText',
    affectsLayout: true,
    valueChanged: onFormattedTextPropertyChanged
});
export const htmlProperty = new Property<Label, string>({ name: 'html', defaultValue: null, affectsLayout: true });

type ClickableSpan = new (owner: Span) => android.text.style.ClickableSpan;

function getHorizontalGravity(textAlignment: TextAlignment) {
    switch (textAlignment) {
        case 'initial':
        case 'left':
            return 8388611; //Gravity.START
        case 'center':
            return 1; //Gravity.CENTER_HORIZONTAL
        case 'right':
            return 8388613; //Gravity.END
    }
}
function getVerticalGravity(textAlignment: VerticalTextAlignment) {
    switch (textAlignment) {
        case 'initial':
        case 'top':
            return 48; //Gravity.TOP
        case 'middle':
        case 'center':
            return 16; //Gravity.CENTER_VERTICAL

        case 'bottom':
            return 80; //Gravity.BOTTOM
    }
}

// eslint-disable-next-line no-redeclare
let ClickableSpan: ClickableSpan;

function initializeClickableSpan(): void {
    if (ClickableSpan) {
        return;
    }

    @NativeClass
    class ClickableSpanImpl extends android.text.style.ClickableSpan {
        owner: WeakRef<Span>;

        constructor(owner: Span) {
            super();
            this.owner = new WeakRef(owner);
            return global.__native(this);
        }
        onClick(view: android.view.View): void {
            const owner = this.owner.get();
            if (owner) {
                owner._emit(Span.linkTapEvent);
            }

            view.clearFocus();
            view.invalidate();
        }
        updateDrawState(tp: android.text.TextPaint): void {
            // don't style as link
        }
    }

    ClickableSpan = ClickableSpanImpl;
}

type URLClickableSpan = new (url: string, owner: Label) => android.text.style.URLSpan;

// eslint-disable-next-line no-redeclare
let URLClickableSpan: URLClickableSpan;

function initializeURLClickableSpan(): void {
    if (URLClickableSpan) {
        return;
    }

    @NativeClass
    class URLClickableSpanImpl extends android.text.style.URLSpan {
        owner: WeakRef<Label>;
        constructor(url: string, owner: Label) {
            super(url);
            this.owner = new WeakRef(owner);

            return global.__native(this);
        }
        onClick(view: android.view.View): void {
            const owner = this.owner.get();
            if (owner) {
                owner.notify({ eventName: Span.linkTapEvent, object: owner, link: this.getURL() });
            }

            view.clearFocus();
            view.invalidate();
        }
        updateDrawState(tp: android.text.TextPaint): void {
            const owner = this.owner.get();
            if (!owner || owner.linkUnderline !== false) {
                super.updateDrawState(tp);
            }
            if (owner && owner.linkColor) {
                tp.setColor(owner.linkColor.android);
            }
        }
    }

    URLClickableSpan = URLClickableSpanImpl;
}

@CSSType('HTMLLabel')
abstract class LabelBase extends View implements LabelViewDefinition {
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty minFontSize: number;
    @cssProperty maxFontSize: number;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    @cssProperty linkColor: Color;
    @cssProperty linkUnderline: boolean;
    public html: string;
    @cssProperty selectable: boolean;

    public _isSingleLine: boolean;
    public text: string;
    public spannableStringBuilder: globalAndroid.text.SpannableStringBuilder;
    //@ts-ignore
    formattedText: FormattedString;

    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    _setTappableState(value: boolean) {}

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
        const newValue = value ? 'normal' : 'nowrap';
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
                let formattedText: FormattedString;
                if (overrideSpanAndFormattedStringEnabled) {
                    formattedText = new LightFormattedString() as any;
                } else {
                    formattedText = new FormattedString();
                }
                formattedText.spans.push(value);
                this.formattedText = formattedText;
                (formattedText as any).parent = this;
            } else {
                this.formattedText.spans.push(value);
            }
        } else if (name === CHILD_FORMATTED_TEXT || name === CHILD_FORMATTED_STRING) {
            this.formattedText = value;
            value.parent = this;
        }
    }

    _requestLayoutOnTextChanged(): void {
        this.requestLayout();
    }

    // // without this spans class wont work :s
    // eachChild(callback: (child: ViewBase) => boolean): void {
    //     const text = this.formattedText;
    //     if (text) {
    //         callback(text);
    //     }
    // }

    abstract _setNativeText(reset?: boolean): void;

    protected _paintFlags: number;
}

export class Label extends LabelBase {
    nativeViewProtected: com.nativescript.label.EllipsizingTextView;
    handleFontSize = true;
    private _defaultMovementMethod: android.text.method.MovementMethod;
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @profile
    public createNativeView() {
        if (!TextView) {
            TextView = androidx.appcompat.widget.AppCompatTextView;
        }
        return new TextView(this._context);
    }

    [maxLinesProperty.setNative](value: number | string) {
        // this.nativeViewProtected.setMinLines(1);
        if (!value || value === 'none') {
            this.nativeViewProtected.setMaxLines(Number.MAX_SAFE_INTEGER);
        } else {
            this.nativeViewProtected.setMaxLines(typeof value === 'string' ? parseInt(value, 10) : value);
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
            case 'marquee':
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.MARQUEE);
                break;
            case 'middle':
                nativeView.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
                break;
            case 'none':
                nativeView.setEllipsize(null);
                break;
        }
    }

    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        if (!this.lineBreak) {
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
    }
    [textShadowProperty.setNative](value: TextShadow) {
        this.nativeViewProtected.setShadowLayer(
            layout.toDevicePixels(value.blurRadius),
            layout.toDevicePixels(value.offsetX),
            layout.toDevicePixels(value.offsetY),
            value.color.android
        );
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        const view = this.nativeTextViewProtected;
        view.setGravity(getHorizontalGravity(this.textAlignment) | getVerticalGravity(value));
    }

    [textProperty.getDefault](): symbol | number {
        return resetSymbol;
    }

    [textProperty.setNative](value: string | number | symbol) {
        this._setNativeText();
    }

    [formattedTextProperty.setNative](value: FormattedString) {
        this._setNativeText();
    }

    [htmlProperty.setNative](value: string) {
        this._setNativeText();
    }

    [textTransformProperty.setNative](value: TextTransform) {
        this._setNativeText();
    }

    [textAlignmentProperty.setNative](value: TextAlignment) {
        const view = this.nativeTextViewProtected;
        view.setGravity(getHorizontalGravity(value) | getVerticalGravity(this.verticalTextAlignment));
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
                this.nativeTextViewProtected.setPaintFlags(
                    android.graphics.Paint.UNDERLINE_TEXT_FLAG | android.graphics.Paint.STRIKE_THRU_TEXT_FLAG
                );
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
        org.nativescript.widgets.ViewHelper.setPaddingTop(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0)
        );
    }

    [paddingRightProperty.getDefault](): Length {
        return { value: this._defaultPaddingRight, unit: 'px' };
    }
    [paddingRightProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingRight(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0)
        );
    }

    [paddingBottomProperty.getDefault](): Length {
        return { value: this._defaultPaddingBottom, unit: 'px' };
    }
    [paddingBottomProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingBottom(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0)
        );
    }

    [paddingLeftProperty.getDefault](): Length {
        return { value: this._defaultPaddingLeft, unit: 'px' };
    }
    [paddingLeftProperty.setNative](value: Length) {
        org.nativescript.widgets.ViewHelper.setPaddingLeft(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0)
        );
    }

    [autoFontSizeProperty.setNative](value: boolean) {
        if (value) {
            androidx.core.widget.TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration(
                this.nativeView,
                this.minFontSize || 10,
                this.maxFontSize || 200,
                1,
                android.util.TypedValue.COMPLEX_UNIT_DIP
            );
        } else {
            androidx.core.widget.TextViewCompat.setAutoSizeTextTypeWithDefaults(
                this.nativeView,
                androidx.core.widget.TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE
            );
        }
    }

    [selectableProperty.setNative](value: boolean) {
        this.nativeTextViewProtected.setTextIsSelectable(value);
    }

    @profile
    createHTMLString() {
        const result = createNativeAttributedString({ text: this.html }) as android.text.SpannableStringBuilder;
        const urlSpan = result.getSpans(0, result.length(), android.text.style.URLSpan.class);
        if (urlSpan.length > 0) {
            this._setTappableState(true);
            initializeURLClickableSpan();
            for (let index = 0; index < urlSpan.length; index++) {
                const span = urlSpan[index];
                const text = span.getURL();
                const start = result.getSpanStart(span);
                const end = result.getSpanEnd(span);
                result.removeSpan(span);
                result.setSpan(new URLClickableSpan(text, this), start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
        return result;
    }
    @profile
    createSpannableStringBuilder() {
        const formattedText = this.formattedText;
        const result = createNativeAttributedString(formattedText as any);
        let indexSearch = 0;
        let str: string;
        formattedText.spans.forEach((s) => {
            if (s.tappable) {
                if (!str) {
                    str = formattedText.toString();
                    this._setTappableState(true);
                }
                initializeClickableSpan();
                const text = s.text;
                const start = str.indexOf(text, indexSearch);
                if (start !== -1) {
                    indexSearch = start + text.length;
                    result.setSpan(new ClickableSpan(s), start, indexSearch, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
            }
        });
        return result;
    }
    _tappable = false;
    _setTappableState(tappable: boolean) {
        if (this._tappable !== tappable) {
            this._tappable = tappable;
            if (this._tappable) {
                this.nativeViewProtected.setMovementMethod(android.text.method.LinkMovementMethod.getInstance());
                this.nativeViewProtected.setHighlightColor(null);
            } else {
                this.nativeViewProtected.setMovementMethod(this._defaultMovementMethod);
            }
        }
    }

    @profile
    _setNativeText(reset: boolean = false): void {
        if (!this._canChangeText) {
            this._needFormattedStringComputation = true;
            return;
        }
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
            textProperty.nativeValueChange(
                this,
                this.formattedText === null || this.formattedText === undefined ? '' : this.formattedText.toString()
            );
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

textProperty.register(Label);
htmlProperty.register(Label);
formattedTextProperty.register(Label);

function onFormattedTextPropertyChanged(textBase: Label, oldValue: FormattedString, newValue: FormattedString) {
    if (oldValue) {
        oldValue.off(Observable.propertyChangeEvent, textBase._onFormattedTextContentsChanged, textBase);
        if (oldValue instanceof FormattedString) {
            textBase._removeView(oldValue);
        }
    }

    if (newValue) {
        // In case formattedString is attached to new TextBase
        if (newValue instanceof FormattedString) {
            const oldParent = newValue.parent;
            if (oldParent) {
                oldParent._removeView(newValue);
            }
            textBase._addView(newValue);
        }
        newValue.on(Observable.propertyChangeEvent, textBase._onFormattedTextContentsChanged, textBase);
    }
}
