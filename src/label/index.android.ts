import {
    LightFormattedString,
    VerticalTextAlignment,
    createNativeAttributedString,
    cssProperty,
    getTransformedText,
    useLightFormattedString,
    verticalTextAlignmentProperty
} from '@nativescript-community/text';
import { CSSType, Color, CoreTypes, FormattedString, Observable, Property, PropertyChangeData, Screen, Span, Utils, View, booleanConverter, profile } from '@nativescript/core';
import { ShadowCSSValues } from '@nativescript/core/ui/styling/css-shadow';
import { Font, FontStyleType, FontVariationSettingsType, FontWeightType } from '@nativescript/core/ui/styling/font';
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
    textShadowProperty,
    textTransformProperty,
    whiteSpaceProperty
} from '@nativescript/core/ui/text-base';
import { maxLinesProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { Label as LabelViewDefinition, LineBreak } from '.';
import { autoFontSizeProperty, lineBreakProperty, maxFontSizeProperty, minFontSizeProperty, needSetText, selectableProperty } from './index-common';

export { createNativeAttributedString } from '@nativescript-community/text';
export * from './index-common';

let NSLabel: typeof com.nativescript.label.NSLabel;

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
    @cssProperty textShadow: ShadowCSSValues;
    @cssProperty linkUnderline: boolean;
    public html: string;
    @cssProperty selectable: boolean;

    public mIsSingleLine: boolean;

    //@ts-ignore
    public text: string | java.lang.CharSequence | android.text.Spannable;
    //@ts-ignore
    formattedText: FormattedString;

    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    _setTappableState(value: boolean) {}

    @cssProperty fontFamily: string;
    @cssProperty fontVariationSettings: FontVariationSettingsType[];
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
    mInResumeNativeUpdates = false;
    mNeedSetText = false;
    mNeedSetAutoSize = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this.mInResumeNativeUpdates = true;
        super.onResumeNativeUpdates();
        this.mInResumeNativeUpdates = false;
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
    nativeViewProtected: com.nativescript.label.NSLabel;
    handleFontSize = true;
    mTappable = false;
    private mAutoFontSize = false;

    private mDefaultMovementMethod: android.text.method.MovementMethod;
    get nativeTextViewProtected() {
        return this.nativeViewProtected;
    }

    @profile
    public createNativeView() {
        if (!NSLabel) {
            NSLabel = com.nativescript.label.NSLabel;
        }
        return NSLabel.inflateLayout(this._context);
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
        this.nativeTextViewProtected.setLineBreak(value);
    }

    [whiteSpaceProperty.setNative](value: CoreTypes.WhiteSpaceType) {
        if (!this.lineBreak) {
            this.nativeTextViewProtected.setWhiteSpace(value);
        }
    }
    [textShadowProperty.getDefault](value: number) {
        let defaultValue = Label[textShadowProperty.defaultValueKey];
        if (!defaultValue) {
            defaultValue = Label[textShadowProperty.defaultValueKey] = {
                radius: this.nativeTextViewProtected.getShadowRadius(),
                offsetX: this.nativeTextViewProtected.getShadowDx(),
                offsetY: this.nativeTextViewProtected.getShadowDy(),
                color: this.nativeTextViewProtected.getShadowColor()
            };
        }
        return defaultValue;
    }

    [textShadowProperty.setNative](value: ShadowCSSValues) {
        this.nativeViewProtected.setShadowLayer(
            Length.toDevicePixels(value.blurRadius, java.lang.Float.MIN_VALUE),
            Length.toDevicePixels(value.offsetX, 0),
            Length.toDevicePixels(value.offsetY, 0),
            value.color.android
        );
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        this.nativeTextViewProtected.setVerticalTextAlignment(value, this.textAlignment);
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
        this.nativeTextViewProtected.setLabelTextAlignment(value, this.verticalTextAlignment);
    }

    [colorProperty.setNative](value: Color | string) {
        const color = !value || value instanceof Color ? (value as Color) : new Color(value);
        if (color) {
            this.nativeTextViewProtected.setTextColor(color.android);
        } else {
            // what to call in this case ? transparent color?
            // we cant call with null as we will get a null pointer exception
            // this.nativeTextViewProtected.setTextColor(null);
        }
    }
    [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        this.nativeTextViewProtected.setLabelTextSize(2, typeof value === 'number' ? value : value.nativeSize, this.minFontSize || 10, this.maxFontSize || 200, this.autoFontSizeStep || 1);
    }

    [lineHeightProperty.setNative](value: number) {
        this.nativeTextViewProtected.setLineHeight(value * Utils.layout.getDisplayDensity());
    }

    [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        const androidFont: android.graphics.Typeface = value instanceof Font ? value.getAndroidTypeface() : value;
        this.nativeTextViewProtected.setTypeface(androidFont);
    }

    [textDecorationProperty.setNative](value: number | CoreTypes.TextDecorationType) {
        this.nativeTextViewProtected.setTextDecoration(value);
    }

    [letterSpacingProperty.setNative](value: number) {
        org.nativescript.widgets.ViewHelper.setLetterspacing(this.nativeTextViewProtected, value);
    }

    [paddingTopProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingTop, unit: 'px' };
    }
    [paddingTopProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingTop(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderTopWidth, 0));
    }

    [paddingRightProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingRight, unit: 'px' };
    }
    [paddingRightProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingRight(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderRightWidth, 0));
    }

    [paddingBottomProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingBottom, unit: 'px' };
    }
    [paddingBottomProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingBottom(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderBottomWidth, 0));
    }

    [paddingLeftProperty.getDefault](): CoreTypes.LengthType {
        return { value: this._defaultPaddingLeft, unit: 'px' };
    }
    [paddingLeftProperty.setNative](value: CoreTypes.LengthType) {
        org.nativescript.widgets.ViewHelper.setPaddingLeft(this.nativeTextViewProtected, Length.toDevicePixels(value, 0) + Length.toDevicePixels(this.style.borderLeftWidth, 0));
    }

    // for now code is duplicated as Android version is a full rewrite
    mNeedSetAutoSize = false;
    public onResumeNativeUpdates(): void {
        super.onResumeNativeUpdates();
        if (this.mNeedSetAutoSize) {
            this.mNeedSetAutoSize = false;
            if (this.autoFontSize) {
                this.enableAutoSize();
            } else {
                this.disableAutoSize();
            }
        }
    }
    [maxFontSizeProperty.setNative](value) {
        if (this.autoFontSize) {
            this.enableAutoSize();
        }
    }
    [minFontSizeProperty.setNative](value) {
        if (this.autoFontSize) {
            this.enableAutoSize();
        }
    }

    protected enableAutoSize() {
        if (this.mInResumeNativeUpdates) {
            this.mNeedSetAutoSize = true;
            return;
        }
        this.nativeViewProtected.enableAutoSize(this.minFontSize || 10, this.maxFontSize || 200, this.autoFontSizeStep || 1);
    }
    protected disableAutoSize() {
        if (this.mInResumeNativeUpdates) {
            this.mNeedSetAutoSize = true;
            return;
        }
        this.nativeViewProtected.disableAutoSize();
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
        const result = createNativeAttributedString(value, undefined, this, this.autoFontSize, this['fontSizeRatio'], Screen.mainScreen.scale);
        this._setTappableState(value.spans.some((s) => s.tappable));
        return result;
    }
    @profile
    createHTMLString() {
        const result = createNativeAttributedString(
            { text: this.html, linkColor: this.linkColor, linkDecoration: this.linkUnderline ? 'underline' : undefined },
            undefined,
            this,
            this.autoFontSize,
            1
        ) as android.text.SpannableStringBuilder;
        this._setTappableState(NSLabel.attributedStringHasURLSpan(result));
        return result;
    }
    _setTappableState(tappable: boolean) {
        if (this.mTappable !== tappable) {
            this.mTappable = tappable;
            const nativeView = this.nativeTextViewProtected;
            nativeView.setTappableState(tappable);
            if (this.mTappable) {
                if (!this.urlSpanClickListener) {
                    const that = new WeakRef(this);
                    this.urlSpanClickListener = new com.nativescript.text.URLSpanClickListener({
                        onClick: (event) => {
                            const owner = that?.get();
                            if (owner) {
                                owner.onURLClick.call(owner, event);
                            }
                        }
                    });
                }
                nativeView.urlSpanClickListener = this.urlSpanClickListener;
            } else {
                nativeView.urlSpanClickListener = null;
            }
        }
    }
    onURLClick(link: string) {
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
        if (this.mInResumeNativeUpdates) {
            this.mNeedSetText = true;
            return;
        }
        if (reset) {
            this.nativeTextViewProtected.setLabelText(null);
            return;
        }
        let transformedText: any = null;
        const constructorName = (this.html || this.text)?.constructor?.name;
        const nativeData = constructorName === 'java.lang.CharSequence' || constructorName === 'android.text.Spanned' || constructorName === 'android.text.SpannableStringBuilder';
        if (this.html) {
            transformedText = nativeData ? this.html : this.createHTMLString();
            textProperty.nativeValueChange(this, this.html === null || this.html === undefined ? '' : this.html);
        } else if (this.formattedText) {
            transformedText = this.createFormattedTextNative(this.formattedText);
            textProperty.nativeValueChange(this, this.formattedText === null || this.formattedText === undefined ? '' : this.formattedText.toString());
        } else if (nativeData) {
            transformedText = this.text;
        } else {
            const text = this.text;
            const stringValue = text === null || text === undefined ? '' : text.toString();
            transformedText = getTransformedText(stringValue, this.textTransform);
        }
        this.nativeTextViewProtected.setLabelText(transformedText);
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
LabelBase.prototype['_hasDefaultAccessibilityContentDescription'] = true;
