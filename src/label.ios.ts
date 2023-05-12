import { VerticalTextAlignment, createNativeAttributedString, verticalTextAlignmentProperty } from '@nativescript-community/text';
import { Color, CoreTypes, Font, FormattedString, Span, Utils, View, profile } from '@nativescript/core';
import {
    borderBottomWidthProperty,
    borderLeftWidthProperty,
    borderRightWidthProperty,
    borderTopWidthProperty,
    fontInternalProperty,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty
} from '@nativescript/core/ui/styling/style-properties';
import {
    formattedTextProperty,
    letterSpacingProperty,
    lineHeightProperty,
    textProperty,
    whiteSpaceProperty
} from '@nativescript/core/ui/text-base';
import { maxLinesProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { isNullOrUndefined, isString } from '@nativescript/core/utils/types';
import { TextShadow } from './label';
import {
    LabelBase,
    autoFontSizeProperty,
    htmlProperty,
    lineBreakProperty,
    linkColorProperty,
    linkUnderlineProperty,
    maxFontSizeProperty,
    minFontSizeProperty,
    needSetText,
    selectableProperty,
    textShadowProperty
} from './label-common';

export { createNativeAttributedString } from '@nativescript-community/text';
export * from './label-common';

@NativeClass
class UILabelLinkHandlerTapDelegateImpl extends NSObject implements UILabelLinkHandlerTapDelegate {
    public static ObjCProtocols = [UILabelLinkHandlerTapDelegate];
    private mOwner: WeakRef<Label>;
    public static initWithOwner(owner: WeakRef<Label>): UILabelLinkHandlerTapDelegateImpl {
        const handler = UILabelLinkHandlerTapDelegateImpl.new() as UILabelLinkHandlerTapDelegateImpl;
        handler.mOwner = owner;
        return handler;
    }
    onLinkTapped(value: any): void {
        const owner = this.mOwner?.deref();
        if (owner) {
            const formattedText = owner.formattedText;
            if (formattedText && typeof value === 'number' && value < formattedText.spans.length) {
                formattedText.spans.getItem(value)._emit(Span.linkTapEvent);
            } else {
                owner.notify({ eventName: 'linkTap', link: value });
            }
        }
    }
}

const AttributeOriginalFontSize = 'OriginalFontSize';

enum FixedSize {
    NONE = 0,
    WIDTH = 1,
    HEIGHT = 2,
    BOTH = 3
}

declare module '@nativescript/core/ui/text-base' {
    interface TextBase {
        _requestLayoutOnTextChanged();
        _setNativeText();
    }
}

function NSStringFromNSAttributedString(source: NSAttributedString | string): NSString {
    return NSString.stringWithString((source instanceof NSAttributedString && source.string) || (source as string));
}
export function getTransformedText(text: string, textTransform: CoreTypes.TextTransformType): string {
    if (!text || !isString(text)) {
        return '';
    }

    switch (textTransform) {
        case 'uppercase':
            return NSStringFromNSAttributedString(text).uppercaseString;
        case 'lowercase':
            return NSStringFromNSAttributedString(text).lowercaseString;
        case 'capitalize':
            return NSStringFromNSAttributedString(text).capitalizedString;
        default:
            return text;
    }
}

function lineBreakToLineBreakMode(value: string) {
    switch (value) {
        case 'end':
            return NSLineBreakMode.ByTruncatingTail;
        case 'start':
            return NSLineBreakMode.ByTruncatingHead;
        case 'middle':
            return NSLineBreakMode.ByTruncatingMiddle;
        default:
        case 'none':
            return NSLineBreakMode.ByWordWrapping;
    }
}
function whiteSpaceToLineBreakMode(value: CoreTypes.WhiteSpaceType) {
    switch (value) {
        case 'initial':
        case 'normal':
            return NSLineBreakMode.ByWordWrapping;
        default:
        case 'nowrap':
            return NSLineBreakMode.ByTruncatingTail;
    }
}

export const needUpdateVerticalAlignment = function (target: any, propertyKey: string | Symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        this.updateVerticalAlignment();
        return result;
    };
};

export const needAutoFontSizeComputation = function (target: any, propertyKey: string | Symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        if (!this.mCanUpdateAutoFontSize) {
            this.mNeedAutoFontSizeComputation = true;
            return originalMethod.apply(this, args);
        } else {
            const result = originalMethod.apply(this, args);
            if (this.autoFontSize) {
                this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
            }
            return result;
        }
    };
};

@NativeClass
class LabelUITextViewDelegateImpl extends NSObject implements UITextViewDelegate {
    public static ObjCProtocols = [UITextViewDelegate];

    private _owner: WeakRef<Label>;

    public static initWithOwner(owner: WeakRef<Label>): LabelUITextViewDelegateImpl {
        const impl = LabelUITextViewDelegateImpl.new() as LabelUITextViewDelegateImpl;
        impl._owner = owner;

        return impl;
    }

    textViewShouldInteractWithURLInRangeInteraction?(
        textView: NSTextView,
        URL: NSURL,
        characterRange: NSRange,
        interaction: UITextItemInteraction
    ) {
        const owner = this._owner.get();
        if (owner) {
            return owner.textViewShouldInteractWithURLInRangeInteraction(textView, URL, characterRange, interaction);
        }
        return false;
    }
    textViewDidChange?(textView: NSTextView) {
        const owner = this._owner.get();
        if (owner) {
            owner.textViewDidChange(textView);
        }
    }
}

@NativeClass
class LabelObserverClass extends NSObject {
    _owner: WeakRef<Label>;
    observeValueForKeyPathOfObjectChangeContext(path: string, tv: NSTextView | NSLabel) {
        const owner = this._owner?.get();
        if (owner) {
            owner.updateVerticalAlignment();
        }
    }
}

export class Label extends LabelBase {
    private mObserver: LabelObserverClass;
    nativeViewProtected: NSLabel | NSTextView;
    nativeTextViewProtected: NSLabel | NSTextView;
    attributedString: NSMutableAttributedString;
    private mDelegate: LabelUITextViewDelegateImpl;
    private mFixedSize: FixedSize;
    static DTCORETEXT_INIT = false;

    fontSizeRatio = 1;
    mLastAutoSizeKey: string;

    isUsingUITextView = false;

    @profile
    public createNativeView() {
        if (this.selectable) {
            this.isUsingUITextView = true;
            return NSTextView.new();
        }
        return NSLabel.new();
    }

    @profile
    public initNativeView() {
        super.initNativeView();
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingUITextView) {
            this.mObserver = LabelObserverClass.alloc().init() as LabelObserverClass;
            this.mObserver._owner = new WeakRef(this);
            this.mDelegate = LabelUITextViewDelegateImpl.initWithOwner(new WeakRef(this));
            (nativeView as UITextView).delegate = this.mDelegate;
            nativeView.addObserverForKeyPathOptionsContext(this.mObserver, 'contentSize', NSKeyValueObservingOptions.New, null);
        }
    }
    public disposeNativeView() {
        this.mDelegate = null;
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingUITextView) {
            (nativeView as UITextView).delegate = null;
        }
        if (this.mTapGestureRecognizer) {
            this.nativeViewProtected.removeGestureRecognizer(this.mTapGestureRecognizer);
            this.mTapGestureRecognizer = null;
        }
        this.mTapDelegate = null;
        super.disposeNativeView();
        if (this.mObserver) {
            const nativeView = this.nativeTextViewProtected;
            if (this.isUsingUITextView) {
                nativeView.removeObserverForKeyPath(this.mObserver, 'contentSize');
            }
            this.mObserver = null;
        }
    }
    mCanUpdateAutoFontSize = true;
    mCanUpdateVerticalAlignment = true;
    mNeedAutoFontSizeComputation = false;
    mNeedUpdateVerticalAlignment = false;
    public onResumeNativeUpdates(): void {
        // {N} suspends properties update on `_suspendNativeUpdates`. So we only need to do this in onResumeNativeUpdates
        this.mCanUpdateVerticalAlignment = false;
        this.mCanUpdateAutoFontSize = false;
        super.onResumeNativeUpdates();
        this.mCanUpdateAutoFontSize = true;
        if (this.mNeedAutoFontSizeComputation) {
            this.mNeedAutoFontSizeComputation = false;
            if (this.autoFontSize) {
                this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
            }
        }
        this.mCanUpdateVerticalAlignment = true;
        if (this.mNeedUpdateVerticalAlignment) {
            this.mNeedUpdateVerticalAlignment = false;
            this.updateVerticalAlignment();
        }
    }
    computeTextHeight(tv: UITextView | NSLabel, size: CGSize) {
        const oldtextContainerInset = tv.textContainerInset;
        tv.textContainerInset = UIEdgeInsetsZero;
        // if (tv.attributedText) {
        //     const result = tv.attributedText.boundingRectWithSizeOptionsContext(
        //         size,
        //         NSStringDrawingOptions.UsesLineFragmentOrigin | NSStringDrawingOptions.UsesFontLeading,
        //         null
        //     );
        //     return Math.round(CGRectGetHeight(result));
        // }
        const result = tv.sizeThatFits(size);
        tv.textContainerInset = oldtextContainerInset;
        return result.height;
    }

    updateVerticalAlignment(applyVerticalTextAlignment = true) {
        const nativeView = this.nativeTextViewProtected;
        if (!this.mCanUpdateVerticalAlignment) {
            this.mNeedUpdateVerticalAlignment = true;
            return;
        }
        if (!this.isUsingUITextView && !this.isLayoutValid) {
            return;
        }
        const result = this.updateTextContainerInset(nativeView, applyVerticalTextAlignment);
        nativeView.textContainerInset = result;
        if (this.isUsingUITextView) {
            (nativeView as NSTextView).contentInset = UIEdgeInsetsZero;
        }
        // this.requestLayout();
    }

    updateTextContainerInset(tv: NSTextView | NSLabel, applyVerticalTextAlignment = true) {
        let inset;
        const top = Utils.layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        const right = Utils.layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        const bottom = Utils.layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        const left = Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        if (
            !applyVerticalTextAlignment ||
            !this.verticalTextAlignment ||
            (tv.text?.length === 0 && tv.attributedText?.length === 0)
        ) {
            inset = {
                top,
                left,
                bottom,
                right
            };
            return inset;
        }
        switch (this.verticalTextAlignment) {
            case 'initial': // not supported
            case 'top':
                if (this.isUsingUITextView) {
                    inset = {
                        top,
                        left,
                        bottom,
                        right
                    };
                } else {
                    const height = this.computeTextHeight(tv, CGSizeMake(tv.bounds.size.width, Number.MAX_SAFE_INTEGER));
                    let topCorrect = tv.bounds.size.height - top - bottom - height * tv.zoomScale;
                    topCorrect = topCorrect < 0.0 ? 0.0 : topCorrect;
                    inset = {
                        top,
                        left,
                        bottom: bottom + topCorrect,
                        right
                    };
                }
                break;

            case 'middle':
            case 'center': {
                if (this.isUsingUITextView) {
                    const height = this.computeTextHeight(tv, CGSizeMake(tv.bounds.size.width, Number.MAX_SAFE_INTEGER));
                    let topCorrect = (tv.bounds.size.height - top - bottom - height * tv.zoomScale) / 2.0;
                    topCorrect = topCorrect < 0.0 ? 0.0 : topCorrect;
                    inset = {
                        top: top + topCorrect,
                        left,
                        bottom,
                        right
                    };
                } else {
                    inset = {
                        top,
                        left,
                        bottom,
                        right
                    };
                }
                break;
            }

            case 'bottom': {
                const height = this.computeTextHeight(tv, CGSizeMake(tv.bounds.size.width, Number.MAX_SAFE_INTEGER));
                let bottomCorrect = tv.bounds.size.height - top - bottom - height * tv.zoomScale;
                bottomCorrect = bottomCorrect < 0.0 ? 0.0 : bottomCorrect;
                inset = {
                    top: top + bottomCorrect,
                    left,
                    bottom,
                    right
                };
                break;
            }
        }
        return inset;
    }

    _requestLayoutOnTextChanged(): void {
        if (this.mFixedSize === FixedSize.BOTH) {
            return;
        }
        if (this.mFixedSize === FixedSize.WIDTH && !this.textWrap && this.getMeasuredHeight() > 0) {
            // Single line label with fixed width will skip request layout on text change.
            return;
        }
        super._requestLayoutOnTextChanged();
    }

    private _measureNativeView(
        width: number,
        widthMode: number,
        height: number,
        heightMode: number
    ): { width: number; height: number } {
        const view = this.nativeTextViewProtected as NSLabel;

        const nativeSize = view.textRectForBoundsLimitedToNumberOfLines(
            CGRectMake(
                0,
                0,
                widthMode === 0 /* layout.UNSPECIFIED */
                    ? Number.POSITIVE_INFINITY
                    : Utils.layout.toDeviceIndependentPixels(width),
                heightMode === 0 /* layout.UNSPECIFIED */
                    ? Number.POSITIVE_INFINITY
                    : Utils.layout.toDeviceIndependentPixels(height)
            ),
            view.numberOfLines
        ).size;

        nativeSize.width = Utils.layout.round(Utils.layout.toDevicePixels(nativeSize.width));
        nativeSize.height = Utils.layout.round(Utils.layout.toDevicePixels(nativeSize.height));

        return nativeSize;
    }
    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        const nativeView = this.nativeTextViewProtected;
        if (nativeView) {
            const width = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);

            const height = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);
            let resetFont;
            if (this.autoFontSize) {
                const finiteWidth = widthMode === Utils.layout.EXACTLY;
                const finiteHeight = heightMode === Utils.layout.EXACTLY;
                if (!finiteWidth || !finiteHeight) {
                    resetFont = this.updateAutoFontSize({
                        textView: nativeView,
                        width: Utils.layout.toDeviceIndependentPixels(width),
                        height: Utils.layout.toDeviceIndependentPixels(height),
                        onlyMeasure: true
                    });
                }
            }
            const desiredSize = Utils.layout.measureNativeView(nativeView, width, widthMode, height, heightMode);
            // if (this.isUsingUITextView) {
            // desiredSize.height += nativeView.textContainerInset.top + nativeView.textContainerInset.bottom;
            // }
            if (resetFont && !this.formattedText && !this.html) {
                nativeView.font = resetFont;
            }

            const labelWidth = widthMode === Utils.layout.AT_MOST ? Math.min(desiredSize.width, width) : desiredSize.width;
            // const labelHeight = heightMode === layout.AT_MOST ? Math.min(desiredSize.height, height) : desiredSize.height;
            const measureWidth = Math.max(labelWidth, this.effectiveMinWidth);
            const measureHeight = Math.max(desiredSize.height, this.effectiveMinHeight);

            const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);

            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }
    _onSizeChanged() {
        super._onSizeChanged();
        this.updateVerticalAlignment();
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected });
        }
    }
    // _htmlTappable = false;
    // _htmlTapGestureRecognizer;
    updateInteractionState(hasLink: boolean = false) {
        this.nativeTextViewProtected.userInteractionEnabled = this._tappable || this.selectable || hasLink;
    }
    _tappable;
    mTapGestureRecognizer: LabelLinkGestureRecognizer;
    mTapDelegate: UILabelLinkHandlerTapDelegateImpl;
    _setTappableState(tappable) {
        if (this._tappable !== tappable) {
            this._tappable = tappable;
            if (this.isUsingUITextView) {
                // we dont want the label gesture recognizer for linkTap
                // so we override
            } else {
                if (this._tappable && !this.mTapGestureRecognizer) {
                    this.mTapDelegate = UILabelLinkHandlerTapDelegateImpl.initWithOwner(new WeakRef(this));
                    // associate handler with menuItem or it will get collected by JSC.
                    this.mTapGestureRecognizer = LabelLinkGestureRecognizer.alloc().initWithDelegate(this.mTapDelegate);
                    this.nativeViewProtected.addGestureRecognizer(this.mTapGestureRecognizer);
                } else if (this.mTapGestureRecognizer) {
                    this.nativeViewProtected.removeGestureRecognizer(this.mTapGestureRecognizer);
                }
            }
        }
        this.updateInteractionState();
    }

    textViewShouldInteractWithURLInRangeInteraction?(
        textView: UITextView,
        url: NSURL,
        characterRange: NSRange,
        interaction: UITextItemInteraction
    ) {
        if (!this.formattedText?.spans) {
            if (url) {
                this.notify({ eventName: Span.linkTapEvent, link: url?.toString() });
            }
            return false;
        }
        for (let i = 0, spanStart = 0, length = this.formattedText.spans.length; i < length; i++) {
            const span = this.formattedText.spans.getItem(i);
            const text = span.text;
            const textTransform = (this.formattedText.parent as View).textTransform;
            let spanText = isNullOrUndefined(text) ? '' : `${text}`;
            if (textTransform !== 'none' && textTransform !== 'initial') {
                spanText = getTransformedText(spanText, textTransform);
            }

            if (characterRange.location - 1 <= spanStart && characterRange.location - 1 + characterRange.length > spanStart) {
                const span: Span = this.formattedText.spans.getItem(i);
                if (span && span.tappable) {
                    // if the span is found and tappable emit the linkTap event
                    span.notify({ eventName: Span.linkTapEvent, link: url?.toString() });
                }
                break;
            }
            spanStart += spanText.length;
        }
        return false;
    }

    _updateHTMLString(fontSize?: number) {
        const nativeView = this.nativeTextViewProtected;
        if (!this.html) {
            if (this.isUsingUITextView) {
                (nativeView as UITextView).selectable = this.selectable === true;
            }
            this.attributedString = null;
        } else {
            const font = nativeView.font;
            const style = this.style;
            if (!fontSize) {
                fontSize = this.fontSize || font?.pointSize || 17;
            }
            const fontWeight = style.fontWeight;
            const familyName = style.fontFamily || (style.fontInternal && style.fontInternal.fontFamily) || undefined;

            // we need to pass color because initWithDataOptionsDocumentAttributesError
            // will set a default color preventing the UITextView from applying its color

            const color = this.color ? (this.color instanceof Color ? this.color : new Color(this.color)) : undefined;
            const params = {
                text: this.html,
                fontSize,
                familyName,
                fontWeight: fontWeight as any,
                color,
                letterSpacing: this.letterSpacing,
                lineHeight: this.lineHeight,
                textAlignment: nativeView.textAlignment
            };
            if (!this.isUsingUITextView) {
                const linkColor = this.linkColor
                    ? this.linkColor instanceof Color
                        ? this.linkColor
                        : new Color(this.linkColor)
                    : undefined;
                Object.assign(params, {
                    useCustomLinkTag: true,
                    lineBreak: (nativeView as UILabel).lineBreakMode,
                    linkDecoration: this.linkUnderline ? 'underline' : undefined,
                    linkColor
                });
            }
            const result = createNativeAttributedString(
                params,
                this,
                this.autoFontSize,
                this.fontSizeRatio
            ) as NSMutableAttributedString;
            let hasLink = false;
            if (result) {
                hasLink = result.hasAttribute('CustomLinkAttribute');
            }
            this._setTappableState(hasLink);
            this.updateInteractionState(hasLink);
            if (this.isUsingUITextView) {
                (nativeView as UITextView).selectable = this.selectable === true || hasLink;
            }
            this.attributedString = result;
        }
        if (nativeView) {
            nativeView.attributedText = this.attributedString;
            this._requestLayoutOnTextChanged();
        }
    }
    updateHTMLString(fontSize?: number) {
        // when in collectionView or pager
        // if this is done sync (without DTCoreText) while init the cell
        // it breaks the UICollectionView :s
        // if (usingIOSDTCoreText()) {
        //     this._updateHTMLString();
        // } else {
        // setTimeout(() => {
        this._updateHTMLString();
        // }, 0);
        // }
    }
    _setColor(color) {
        if (this.nativeTextViewProtected instanceof UIButton) {
            this.nativeTextViewProtected.setTitleColorForState(color, 0 /* Normal */);
            this.nativeTextViewProtected.titleLabel.textColor = color;
        } else {
            if (this.formattedText || this.html) {
                this._setNativeText();
            } else {
                this.nativeTextViewProtected.textColor = color;
            }
        }
    }
    defaultLinkTextAttributes: NSDictionary<any, any>;
    updateLinkTextAttributes() {
        if (this.isUsingUITextView) {
            const color = !this.linkColor || this.linkColor instanceof Color ? this.linkColor : new Color(this.linkColor);
            const nativeView = this.nativeTextViewProtected;
            let attributes = this.isUsingUITextView ? (nativeView as UITextView).linkTextAttributes : null;
            if (!(attributes instanceof NSMutableDictionary)) {
                this.defaultLinkTextAttributes = attributes;
                attributes = NSMutableDictionary.new();
            }
            if (color) {
                attributes.setValueForKey(color.ios, NSForegroundColorAttributeName);
                if (this.linkUnderline !== false) {
                    attributes.setValueForKey(color.ios, NSUnderlineColorAttributeName);
                } else {
                    attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
                }
            } else if (this.defaultLinkTextAttributes) {
                attributes.setValueForKey(
                    this.defaultLinkTextAttributes.objectForKey(NSForegroundColorAttributeName),
                    NSForegroundColorAttributeName
                );
                if (this.linkUnderline !== false) {
                    attributes.setValueForKey(
                        this.defaultLinkTextAttributes.objectForKey(NSUnderlineColorAttributeName),
                        NSUnderlineColorAttributeName
                    );
                } else {
                    attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
                }
            } else {
                if (this.linkUnderline === false) {
                    attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
                }
            }
            (nativeView as UITextView).linkTextAttributes = attributes;
        } else {
            this._setNativeText();
        }
    }
    @needSetText
    [linkColorProperty.setNative](value: Color | string) {
        this.updateLinkTextAttributes();
    }
    [selectableProperty.setNative](value: boolean) {
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingUITextView) {
            (nativeView as UITextView).selectable = value;
        }
        this.updateInteractionState();
    }
    @needSetText
    [linkUnderlineProperty.setNative](value: boolean) {
        this.updateLinkTextAttributes();
    }
    @needSetText
    @needAutoFontSizeComputation
    [htmlProperty.setNative](value: string) {}
    @needSetText
    @needAutoFontSizeComputation
    [formattedTextProperty.setNative](value: string) {
        super[formattedTextProperty.setNative](value);
    }
    @needSetText
    [textProperty.setNative](value: string) {
        super[textProperty.setNative](value);
    }
    @needSetText
    @needAutoFontSizeComputation
    [letterSpacingProperty.setNative](value: number) {
        super[letterSpacingProperty.setNative](value);
    }
    @needSetText
    @needAutoFontSizeComputation
    [lineHeightProperty.setNative](value: number) {
        super[lineHeightProperty.setNative](value);
    }
    // @needSetText
    // [colorProperty.setNative](value: number) {
    //     super[colorProperty.setNative](value);
    // }
    @needAutoFontSizeComputation
    [fontInternalProperty.setNative](value: any) {
        const nativeView = this.nativeTextViewProtected;
        const newFont: UIFont = value instanceof Font ? value.getUIFont(nativeView.font) : value;
        if (!this.formattedText && !this.html) {
            nativeView.font = newFont;
        } else if (newFont) {
            if (!this.mCanChangeText) {
                this.mNeedSetText = true;
                return;
            }
            this._setNativeText();
        }
    }

    [maxFontSizeProperty.setNative]() {
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
        }
    }
    [minFontSizeProperty.setNative]() {
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
        }
    }

    @profile
    _setNativeText() {
        if (!this.mCanChangeText) {
            this.mNeedSetText = true;
            return;
        }

        // reset the fontSizeRatio or it could break attributedString sizes in collectionview
        this.fontSizeRatio = 1;
        if (this.html) {
            this.updateHTMLString();
        } else {
            super._setNativeText();
        }
        this.updateVerticalAlignment();
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
        }
        this._requestLayoutOnTextChanged();
    }
    setTextDecorationAndTransform() {
        const style = this.style;
        const letterSpacing = style.letterSpacing ?? 0;
        const lineHeight = style.lineHeight ?? -1;
        let uiColor;
        if (style.color) {
            const color = !style.color || style.color instanceof Color ? style.color : new Color(style.color);
            if (color) {
                uiColor = color.ios;
            }
        }
        const text = getTransformedText(isNullOrUndefined(this.text) ? '' : `${this.text}`, this.textTransform);
        NSLabelUtils.setTextDecorationAndTransformOnViewTextTextDecorationLetterSpacingLineHeightColor(
            this.nativeTextViewProtected,
            text,
            this.style.textDecoration || '',
            letterSpacing,
            lineHeight,
            uiColor
        );
    }
    createFormattedTextNative(value: FormattedString) {
        return createNativeAttributedString(value, this, this.autoFontSize, this.fontSizeRatio);
    }
    setFormattedTextDecorationAndTransform() {
        const nativeView = this.nativeTextViewProtected;
        const attrText = this.createFormattedTextNative(this.formattedText);
        // we override parent class behavior because we apply letterSpacing and lineHeight on a per Span basis
        // if (majorVersion >= 13 && UIColor.labelColor) {
        //     this.nativeTextViewProtected.textColor = UIColor.labelColor;
        // }

        nativeView.attributedText = attrText;
    }
    updateTextViewContentInset(data: Partial<UIEdgeInsets>) {
        // const nativeView = this.nativeTextViewProtected as NSTextView;
        // const contentInset = nativeView.contentInset;
        // nativeView.contentInset = Object.assign(
        //     {
        //         top: contentInset.top,
        //         right: contentInset.right,
        //         bottom: contentInset.bottom,
        //         left: contentInset.left
        //     },
        //     data
        // );
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingTopProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ top: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingTop) });
        } else {
            super[paddingTopProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingRightProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ right: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingRight) });
        } else {
            super[paddingRightProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingBottomProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ bottom: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingBottom) });
        } else {
            super[paddingBottomProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingLeftProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ left: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
        } else {
            super[paddingLeftProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderTopWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ left: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
        } else {
            super[borderTopWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderRightWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ left: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
        } else {
            super[borderRightWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderBottomWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ left: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
        } else {
            super[borderBottomWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderLeftWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (this.isUsingUITextView) {
            // this.updateTextViewContentInset({ left: Utils.layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
        } else {
            super[borderLeftWidthProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    [maxLinesProperty.setNative](value: number | string) {
        const numberLines = !value || value === 'none' ? 0 : typeof value === 'string' ? parseInt(value, 10) : value;
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingUITextView) {
            (nativeView as UITextView).textContainer.maximumNumberOfLines = numberLines;
        } else {
            (nativeView as UILabel).numberOfLines = numberLines;
        }
    }

    @needAutoFontSizeComputation
    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingUITextView) {
            (nativeView as UITextView).textContainer.lineBreakMode = lineBreakToLineBreakMode(value);
        } else {
            (nativeView as UILabel).lineBreakMode = lineBreakToLineBreakMode(value);
        }
    }
    [textShadowProperty.setNative](value: TextShadow) {
        this.nativeTextViewProtected.layer.shadowOpacity = 1;
        this.nativeTextViewProtected.layer.shadowRadius = value.blurRadius;
        this.nativeTextViewProtected.layer.shadowColor = value.color.ios.CGColor;
        this.nativeTextViewProtected.layer.shadowOffset = CGSizeMake(value.offsetX, value.offsetY);
        this.nativeTextViewProtected.layer.shouldRasterize = true;
        this.nativeTextViewProtected.layer.masksToBounds = false;
    }

    @needAutoFontSizeComputation
    [whiteSpaceProperty.setNative](value: CoreTypes.WhiteSpaceType) {
        const nativeView = this.nativeTextViewProtected;
        // only if no lineBreak
        // if (!this.lineBreak) {
        if (this.isUsingUITextView) {
            (nativeView as UITextView).textContainer.lineBreakMode = whiteSpaceToLineBreakMode(value);
            if (!this.maxLines) {
                if (value === 'normal') {
                    (nativeView as UITextView).textContainer.maximumNumberOfLines = 0;
                } else {
                    (nativeView as UITextView).textContainer.maximumNumberOfLines = 1;
                }
            }
        } else {
            (nativeView as UILabel).lineBreakMode = whiteSpaceToLineBreakMode(value);
            if (!this.maxLines) {
                if (value === 'normal') {
                    (nativeView as UILabel).numberOfLines = 0;
                } else {
                    (nativeView as UILabel).numberOfLines = 1;
                }
            }
        }
        // }
    }
    updateAutoFontSize({
        textView,
        width,
        height,
        force = false,
        onlyMeasure = false
    }: {
        textView: NSTextView | NSLabel;
        width?;
        height?;
        force?: boolean;
        onlyMeasure?: boolean;
    }) {
        if (!this.mCanUpdateAutoFontSize) {
            this.mNeedAutoFontSizeComputation = true;
        }
        let currentFont;
        if (textView && this.autoFontSize) {
            if (
                (!textView.attributedText && !textView.text) ||
                (width === undefined && height === undefined && CGSizeEqualToSize(textView.bounds.size, CGSizeZero))
            ) {
                return currentFont;
            }
            const textViewSize = NSLabelUtils.insetWithRectUIEdgeInsets(textView.bounds, textView.padding).size;
            const fixedWidth = Math.floor(width !== undefined ? width : textViewSize.width);
            const fixedHeight = Math.floor(height !== undefined ? height : textViewSize.height);
            if (fixedWidth === 0 || fixedHeight === 0) {
                return currentFont;
            }
            const autoSizeKey = fixedWidth + '_' + fixedHeight;
            const fontSize = this.style.fontSize || 17;
            let expectFont = (this.style.fontInternal || Font.default).getUIFont(UIFont.systemFontOfSize(fontSize));
            //if we are not on the "default" font size we need to measure again or we could break
            //the layout behavior like for flexbox where there are multiple measure passes
            if (!force && autoSizeKey === this.mLastAutoSizeKey && expectFont.pointSize === textView.font.pointSize) {
                return null;
            }
            currentFont = textView.font;
            this.mLastAutoSizeKey = autoSizeKey;
            const nbLines =
                textView instanceof UITextView ? textView.textContainer?.maximumNumberOfLines : textView.numberOfLines;
            // we need to reset verticalTextAlignment or computation will be wrong
            // this.updateVerticalAlignment(false);

            let expectSize;

            const stepSize = this.autoFontSizeStep || 2;

            const updateFontSize = (font) => {
                if (this.formattedText || this.html) {
                    NSLabelUtils.updateFontRatioRatio(textView, font.pointSize / fontSize);
                } else {
                    textView.font = font;
                }
            };
            //first reset the font size
            updateFontSize(expectFont);
            const size = () => {
                if (nbLines === 1) {
                    expectSize = textView.sizeThatFits(CGSizeMake(Number.MAX_SAFE_INTEGER, fixedHeight));
                } else {
                    expectSize = textView.sizeThatFits(CGSizeMake(fixedWidth, Number.MAX_SAFE_INTEGER));
                }
            };
            size();
            if (expectSize.height > fixedHeight || expectSize.width > fixedWidth) {
                const minFontSize = this.minFontSize || 12;
                while ((expectSize.height > fixedHeight || expectSize.width > fixedWidth) && expectFont.pointSize > minFontSize) {
                    const newFont = expectFont.fontWithSize(expectFont.pointSize - stepSize);
                    updateFontSize(newFont);
                    size();
                    if (expectSize.height >= fixedHeight || expectSize.width >= fixedWidth) {
                        expectFont = newFont;
                    } else {
                        expectFont = newFont;
                        if (!this.formattedText && !this.html) {
                            textView.font = newFont;
                        }
                        break;
                    }
                }
            } else {
                const maxFontSize = this.maxFontSize || 200;
                while ((expectSize.height < fixedHeight || expectSize.width < fixedWidth) && expectFont.pointSize < maxFontSize) {
                    const newFont = expectFont.fontWithSize(expectFont.pointSize + stepSize);
                    updateFontSize(newFont);
                    size();
                    if (expectSize.height <= fixedHeight && expectSize.width <= fixedWidth) {
                        expectFont = newFont;
                    } else {
                        // we need to restore old font
                        updateFontSize(expectFont);
                        break;
                    }
                }
            }
            if (!onlyMeasure) {
                this.fontSizeRatio = expectFont.pointSize / fontSize;
            }

            this.updateVerticalAlignment();
        }
        return currentFont;
    }
    textViewDidChange(textView: NSTextView) {
        //only called when user triggers the text change, not programmatically
        this.updateAutoFontSize({ textView, force: true });
    }
    [autoFontSizeProperty.setNative](value: boolean) {
        if (value) {
            if (this.isLayoutValid && (this.text || this.html || this.formattedText)) {
                this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
            }
        } else {
            this[fontInternalProperty.setNative](this.style.fontInternal);
        }
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        // this.nativeTextViewProtected.verticalTextAlignment = value;
        this.updateVerticalAlignment();
    }
}
