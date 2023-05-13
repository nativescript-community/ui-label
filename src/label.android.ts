import {
    LightFormattedString,
    VerticalTextAlignment,
    createNativeAttributedString,
    cssProperty,
    getTransformedText,
    useLightFormattedString,
    verticalTextAlignmentProperty
} from '@nativescript-community/text';
import {
    CSSType,
    CoreTypes,
    Device,
    FormattedString,
    Observable,
    Property,
    PropertyChangeData,
    Span,
    Utils,
    View,
    booleanConverter,
    profile
} from '@nativescript/core';
import { Color } from '@nativescript/core/color';
import { CSSShadow } from '@nativescript/core/ui/styling/css-shadow';
import { Font, FontStyleType, FontWeightType } from '@nativescript/core/ui/styling/font';
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
    letterSpacingProperty,
    lineHeightProperty,
    textAlignmentProperty,
    textDecorationProperty,
    textTransformProperty,
    whiteSpaceProperty
} from '@nativescript/core/ui/text-base';
import { maxLinesProperty } from '@nativescript/core/ui/text-base/text-base-common';
import lazy from '@nativescript/core/utils/lazy';
import { Label as LabelViewDefinition, LineBreak } from './label';
import {
    autoFontSizeProperty,
    lineBreakProperty,
    maxFontSizeProperty,
    minFontSizeProperty,
    needSetText,
    selectableProperty,
    textShadowProperty
} from './label-common';

export { createNativeAttributedString } from '@nativescript-community/text';
export * from './label-common';
const sdkVersion = lazy(() => parseInt(Device.sdkVersion, 10));

let TextView: typeof com.nativescript.text.TextView;

const CHILD_FORMATTED_TEXT = 'formattedText';

const resetSymbol = Symbol('textPropertyDefault');
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

function getHorizontalGravity(textAlignment: CoreTypes.TextAlignmentType) {
    switch (textAlignment) {
        case 'center':
            return 1; //Gravity.CENTER_HORIZONTAL
        case 'right':
            return 8388613; //Gravity.END
        default:
        case 'initial':
        case 'left':
            return 8388611; //Gravity.START
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

@CSSType('HTMLLabel')
abstract class LabelBase extends View implements LabelViewDefinition {
    //@ts-ignore
    @cssProperty maxLines: string | number;
    @cssProperty autoFontSize: boolean;
    @cssProperty autoFontSizeStep: number;
    @cssProperty minFontSize: number;
    @cssProperty maxFontSize: number;
    @cssProperty verticalTextAlignment: VerticalTextAlignment;
    @cssProperty linkColor: Color | string;
    @cssProperty textShadow: CSSShadow;
    @cssProperty linkUnderline: boolean;
    public html: string;
    @cssProperty selectable: boolean;

    _isSingleLine: boolean;

    public mIsSingleLine: boolean;

    public text: string;
    //@ts-ignore
    formattedText: FormattedString;

    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    _setTappableState(value: boolean) {}

    @cssProperty fontFamily: string;
    @cssProperty fontSize: number;
    @cssProperty fontStyle: FontStyleType;
    @cssProperty fontWeight: FontWeightType;
    @cssProperty letterSpacing: number;
    @cssProperty lineHeight: number;
    @cssProperty lineBreak: LineBreak;
    @cssProperty textAlignment: CoreTypes.TextAlignmentType;
    @cssProperty textDecoration: CoreTypes.TextDecorationType;

    //@ts-ignore
    @cssProperty textTransform: CoreTypes.TextTransformType;
    @cssProperty whiteSpace: CoreTypes.WhiteSpaceType;

    @cssProperty padding: string | CoreTypes.LengthType;
    @cssProperty paddingTop: CoreTypes.LengthType;
    @cssProperty paddingRight: CoreTypes.LengthType;
    @cssProperty paddingBottom: CoreTypes.LengthType;
    @cssProperty paddingLeft: CoreTypes.LengthType;

    // for now code is duplicated as Android version is a full rewrite
    mCanChangeText = true;
    mNeedSetText = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this.mCanChangeText = false;
        super.onResumeNativeUpdates();
        this.mCanChangeText = true;
        if (this.mNeedSetText) {
            this.mNeedSetText = false;
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
        if (name === Span.name || value.constructor.isSpan) {
            if (!this.formattedText) {
                let formattedText: FormattedString;
                if (useLightFormattedString) {
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
        } else if (name === CHILD_FORMATTED_TEXT || name === FormattedString.name) {
            this.formattedText = value;
            value.parent = this;
        }
    }

    _requestLayoutOnTextChanged(): void {
        this.requestLayout();
    }

    abstract _setNativeText(reset?: boolean): void;

    protected _paintFlags: number;
}

export class Label extends LabelBase {
    nativeViewProtected: com.nativescript.text.TextView;
    mHandleFontSize = true;
    mTappable = false;
    private mAutoFontSize = false;

    private mDefaultMovementMethod: android.text.method.MovementMethod;
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @profile
    public createNativeView() {
        if (!TextView) {
            TextView = com.nativescript.text.TextView;
        }
        return new TextView(this._context);
    }
    urlSpanClickListener: com.nativescript.text.URLSpanClickListener;
    public disposeNativeView() {
        super.disposeNativeView();
        this.nativeTextViewProtected.urlSpanClickListener = null;
        if (this.urlSpanClickListener) {
            this.urlSpanClickListener = null;
        }
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

    [whiteSpaceProperty.setNative](value: CoreTypes.WhiteSpaceType) {
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
    [textShadowProperty.getDefault](value: number) {
        return {
            radius: this.nativeTextViewProtected.getShadowRadius(),
            offsetX: this.nativeTextViewProtected.getShadowDx(),
            offsetY: this.nativeTextViewProtected.getShadowDy(),
            color: this.nativeTextViewProtected.getShadowColor()
        };
    }

    [textShadowProperty.setNative](value: CSSShadow) {
        // prettier-ignore
        this.nativeViewProtected.setShadowLayer(
            Length.toDevicePixels(value.blurRadius, java.lang.Float.MIN_VALUE),
            Length.toDevicePixels(value.offsetX, 0),
            Length.toDevicePixels(value.offsetY, 0),
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
    @needSetText
    [textProperty.setNative](value: string | number | symbol) {}

    @needSetText
    [formattedTextProperty.setNative](value: FormattedString) {}

    @needSetText
    [htmlProperty.setNative](value: string) {}

    @needSetText
    [textTransformProperty.setNative](value: CoreTypes.TextTransformType) {}

    [textAlignmentProperty.setNative](value: CoreTypes.TextAlignmentType) {
        const view = this.nativeTextViewProtected;
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            if ((value as any) === 'justify') {
                view.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_INTER_WORD);
            } else {
                view.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_NONE);
                view.setGravity(getHorizontalGravity(value) | getVerticalGravity(this.verticalTextAlignment));
            }
        } else {
            view.setGravity(getHorizontalGravity(value) | getVerticalGravity(this.verticalTextAlignment));
        }
    }

    [colorProperty.setNative](value: Color | string) {
        const color = !value || value instanceof Color ? (value as Color) : new Color(value);
        if (color) {
            this.nativeTextViewProtected.setTextColor(color.android);
        } else {
            this.nativeTextViewProtected.setTextColor(null);
        }
    }
    [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        // setTextSize is ignored if autoFontSize is enabled
        // so we need to disable autoFontSize just to set textSize
        if (this.mAutoFontSize) {
            this.disableAutoSize();
        }
        if (typeof value === 'number') {
            this.nativeTextViewProtected.setTextSize(value);
        } else {
            this.nativeTextViewProtected.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, value.nativeSize);
        }
        if (this.mAutoFontSize) {
            this.enableAutoSize();
        }
    }

    [lineHeightProperty.setNative](value: number) {
        if (sdkVersion() >= 28) {
            this.nativeTextViewProtected.setLineHeight(value * Utils.layout.getDisplayDensity());
        } else {
            const fontHeight = this.nativeTextViewProtected.getPaint().getFontMetrics(null);
            this.nativeTextViewProtected.setLineSpacing(value * Utils.layout.getDisplayDensity() - fontHeight, 1);
        }
    }

    [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        const androidFont: android.graphics.Typeface = value instanceof Font ? value.getAndroidTypeface() : value;
        this.nativeTextViewProtected.setTypeface(androidFont);
        if (this.lineHeight && sdkVersion() < 28) {
            const fontHeight = this.nativeTextViewProtected.getPaint().getFontMetrics(null);
            this.nativeTextViewProtected.setLineSpacing(this.lineHeight * Utils.layout.getDisplayDensity() - fontHeight, 1);
        }
    }

    [textDecorationProperty.setNative](value: number | CoreTypes.TextDecorationType) {
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

    [paddingTopProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingTop, unit: 'px' };
    }
    [paddingTopProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingTop(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0)
        );
    }

    [paddingRightProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingRight, unit: 'px' };
    }
    [paddingRightProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingRight(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0)
        );
    }

    [paddingBottomProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingBottom, unit: 'px' };
    }
    [paddingBottomProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingBottom(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0)
        );
    }

    [paddingLeftProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingLeft, unit: 'px' };
    }
    [paddingLeftProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingLeft(
            this.nativeTextViewProtected,
            Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0)
        );
    }
    private enableAutoSize() {
        androidx.core.widget.TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration(
            this.nativeView,
            this.minFontSize || 10,
            this.maxFontSize || 200,
            this.autoFontSizeStep || 1,
            android.util.TypedValue.COMPLEX_UNIT_DIP
        );
    }
    [maxFontSizeProperty.setNative](value) {
        if (this.mAutoFontSize) {
            this.enableAutoSize();
        }
    }
    [minFontSizeProperty.setNative](value) {
        if (this.mAutoFontSize) {
            this.enableAutoSize();
        }
    }
    private disableAutoSize() {
        androidx.core.widget.TextViewCompat.setAutoSizeTextTypeWithDefaults(
            this.nativeView,
            androidx.core.widget.TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE
        );
    }
    [autoFontSizeProperty.setNative](value: boolean) {
        this.mAutoFontSize = value;
        if (value) {
            this.enableAutoSize();
        } else {
            this.disableAutoSize();
        }
    }

    [selectableProperty.setNative](value: boolean) {
        this.nativeTextViewProtected.setTextIsSelectable(value);
    }
    createFormattedTextNative(value: any) {
        const result = createNativeAttributedString(value, undefined, this, this.autoFontSize);
        this._setTappableState(value.spans.some((s) => s.tappable));
        return result;
    }
    @profile
    createHTMLString() {
        const result = createNativeAttributedString(
            { text: this.html },
            undefined,
            this,
            this.autoFontSize,
            1
        ) as android.text.SpannableStringBuilder;
        this._setTappableState(TextView.attributedStringHasSpan(result, android.text.style.URLSpan.class));
        return result;
    }
    _setTappableState(tappable: boolean) {
        if (this.mTappable !== tappable) {
            this.mTappable = tappable;
            const nativeView = this.nativeTextViewProtected;
            if (this.mTappable) {
                nativeView.setMovementMethod(android.text.method.LinkMovementMethod.getInstance());
                nativeView.setHighlightColor(null);
                if (!this.urlSpanClickListener) {
                    this.urlSpanClickListener = new com.nativescript.text.URLSpanClickListener({
                        onClick: this.onURLClick.bind(this)
                    });
                }
                nativeView.urlSpanClickListener = this.urlSpanClickListener;
            } else {
                nativeView.setMovementMethod(this.mDefaultMovementMethod);
                nativeView.urlSpanClickListener = null;
            }
        }
    }
    onURLClick(span: android.text.style.URLSpan) {
        const link = span.getURL();
        if (this.formattedText) {
            const spanIndex = parseInt(link, 10);
            if (!isNaN(spanIndex) && spanIndex >= 0 && spanIndex < this.formattedText?.spans.length) {
                this.formattedText?.spans.getItem(spanIndex).notify({ eventName: Span.linkTapEvent });
            }
        }
        this.notify({ eventName: Span.linkTapEvent, link });
        // const nativeView = this.nativeTextViewProtected;

        // nativeView.clearFocus();
        // nativeView.invalidate();
    }

    @profile
    _setNativeText(reset: boolean = false): void {
        if (!this.mCanChangeText) {
            this.mNeedSetText = true;
            return;
        }
        if (reset) {
            this.nativeTextViewProtected.setText(null);
            return;
        }

        let transformedText: any = null;
        if (this.html) {
            transformedText = this.createHTMLString();
            textProperty.nativeValueChange(this, this.html === null || this.html === undefined ? '' : this.html);
        } else if (this.formattedText) {
            transformedText = this.createFormattedTextNative(this.formattedText);
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
