import { VerticalTextAlignment, createNativeAttributedString, getTransformedText, verticalTextAlignmentProperty } from '@nativescript-community/text';
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
import { formattedTextProperty, letterSpacingProperty, lineHeightProperty, textProperty, whiteSpaceProperty } from '@nativescript/core/ui/text-base';
import { maxLinesProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { isNullOrUndefined } from '@nativescript/core/utils/types';
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
    selectableProperty
} from './index-common';

export { createNativeAttributedString } from '@nativescript-community/text';
export * from './index-common';

@NativeClass
class NSLabelLinkHandlerTapDelegateImpl extends NSObject implements UILabelLinkHandlerTapDelegate {
    public static ObjCProtocols = [UILabelLinkHandlerTapDelegate];
    private mOwner: WeakRef<Label>;
    public static initWithOwner(owner: WeakRef<Label>): NSLabelLinkHandlerTapDelegateImpl {
        const handler = NSLabelLinkHandlerTapDelegateImpl.new() as NSLabelLinkHandlerTapDelegateImpl;
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
class LabelNSTextViewDelegateImpl extends NSObject implements UITextViewDelegate {
    public static ObjCProtocols = [UITextViewDelegate];

    private _owner: WeakRef<Label>;

    public static initWithOwner(owner: WeakRef<Label>): LabelNSTextViewDelegateImpl {
        const impl = LabelNSTextViewDelegateImpl.new() as LabelNSTextViewDelegateImpl;
        impl._owner = owner;

        return impl;
    }

    textViewShouldInteractWithURLInRangeInteraction?(textView: NSTextView, URL: NSURL, characterRange: NSRange, interaction: UITextItemInteraction) {
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
    attributedString: NSAttributedString;
    private mDelegate: LabelNSTextViewDelegateImpl;
    private mFixedSize: FixedSize;
    static DTCORETEXT_INIT = false;

    fontSizeRatio = 1;
    mLastAutoSizeKey: string;

    isUsingNSTextView = false;

    //@ts-ignore
    public text: string | NSAttributedString;

    @profile
    public createNativeView() {
        if (this.selectable) {
            this.isUsingNSTextView = true;
            return NSTextView.new();
        }
        return NSLabel.new();
    }

    @profile
    public initNativeView() {
        super.initNativeView();
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            this.mObserver = LabelObserverClass.alloc().init() as LabelObserverClass;
            this.mObserver._owner = new WeakRef(this);
            this.mDelegate = LabelNSTextViewDelegateImpl.initWithOwner(new WeakRef(this));
            (nativeView as NSTextView).delegate = this.mDelegate;
            nativeView.addObserverForKeyPathOptionsContext(this.mObserver, 'contentSize', NSKeyValueObservingOptions.New, null);
        }
    }
    public disposeNativeView() {
        this.mDelegate = null;
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            (nativeView as NSTextView).delegate = null;
        }
        if (this.mTapGestureRecognizer) {
            this.nativeViewProtected.removeGestureRecognizer(this.mTapGestureRecognizer);
            this.mTapGestureRecognizer = null;
        }
        this.mTapDelegate = null;
        super.disposeNativeView();
        if (this.mObserver) {
            const nativeView = this.nativeTextViewProtected;
            if (this.isUsingNSTextView) {
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
    computeTextHeight(tv: NSTextView | NSLabel, size: CGSize) {
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
        if (!this.isUsingNSTextView && !this.isLayoutValid) {
            return;
        }
        const result = this.updateTextContainerInset(nativeView, applyVerticalTextAlignment);
        nativeView.textContainerInset = result;
        if (this.isUsingNSTextView) {
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
        if (!applyVerticalTextAlignment || !this.verticalTextAlignment || (tv.text?.length === 0 && tv.attributedText?.length === 0)) {
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
                if (this.isUsingNSTextView) {
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
                if (this.isUsingNSTextView) {
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

    _requestLayoutOnTextChanged() {
        if (this.mFixedSize === FixedSize.BOTH) {
            return false;
        }
        if (this.mFixedSize === FixedSize.WIDTH && !this.textWrap && this.getMeasuredHeight() > 0) {
            // Single line label with fixed width will skip request layout on text change.
            return false;
        }
        super._requestLayoutOnTextChanged();
        return true;
    }

    private _measureNativeView(width: number, widthMode: number, height: number, heightMode: number): { width: number; height: number } {
        const view = this.nativeTextViewProtected as NSLabel;

        const nativeSize = view.textRectForBoundsLimitedToNumberOfLines(
            CGRectMake(
                0,
                0,
                widthMode === 0 /* layout.UNSPECIFIED */ ? Number.POSITIVE_INFINITY : Utils.layout.toDeviceIndependentPixels(width),
                heightMode === 0 /* layout.UNSPECIFIED */ ? Number.POSITIVE_INFINITY : Utils.layout.toDeviceIndependentPixels(height)
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

            this.mFixedSize = (widthMode === Utils.layout.EXACTLY ? FixedSize.WIDTH : FixedSize.NONE) | (heightMode === Utils.layout.EXACTLY ? FixedSize.HEIGHT : FixedSize.NONE);

            let resetFont;
            // reset insent or it will taken into account for measurement
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
            } else {
                this.updateVerticalAlignment(false);
            }
            const desiredSize = Utils.layout.measureNativeView(nativeView, width, widthMode, height, heightMode);
            // if (this.isUsingNSTextView) {
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
    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        // we do on every layout pass or we might be out of sync
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected });
        } else {
            this.updateVerticalAlignment();
        }
    }
    // _onSizeChanged() {
    //     super._onSizeChanged();
    //     this.updateVerticalAlignment();
    //     if (this.autoFontSize) {
    //         this.updateAutoFontSize({ textView: this.nativeTextViewProtected });
    //     }
    // }
    // _htmlTappable = false;
    // _htmlTapGestureRecognizer;
    // updateInteractionState(hasLink: boolean = false) {
    //     this.nativeTextViewProtected.userInteractionEnabled = this._tappable || this.selectable || hasLink;
    // }
    _tappable;
    mTapGestureRecognizer: LabelLinkGestureRecognizer;
    mTapDelegate: NSLabelLinkHandlerTapDelegateImpl;
    _setTappableState(tappable) {
        if (this._tappable !== tappable) {
            this._tappable = tappable;
            if (this.isUsingNSTextView) {
                // we dont want the label gesture recognizer for linkTap
                // so we override
            } else {
                if (this._tappable && !this.mTapGestureRecognizer) {
                    this.mTapDelegate = NSLabelLinkHandlerTapDelegateImpl.initWithOwner(new WeakRef(this));
                    // associate handler with menuItem or it will get collected by JSC.
                    this.mTapGestureRecognizer = LabelLinkGestureRecognizer.alloc().initWithDelegate(this.mTapDelegate);
                    this.nativeViewProtected.addGestureRecognizer(this.mTapGestureRecognizer);
                } else if (this.mTapGestureRecognizer) {
                    this.nativeViewProtected.removeGestureRecognizer(this.mTapGestureRecognizer);
                }
            }
        }
        // this.updateInteractionState();
    }

    textViewShouldInteractWithURLInRangeInteraction?(textView: NSTextView, url: NSURL, characterRange: NSRange, interaction: UITextItemInteraction) {
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
            if (this.isUsingNSTextView) {
                (nativeView as NSTextView).selectable = this.selectable === true;
            }
            this.attributedString = null;
        } else if (this.html instanceof NSAttributedString) {
            this.attributedString = this.html;
        } else {
            const font = nativeView.font;
            const style = this.style;
            if (!fontSize) {
                fontSize = this.fontSize || font?.pointSize || 17;
            }
            const fontWeight = style.fontWeight;
            const familyName = style.fontFamily || (style.fontInternal && style.fontInternal.fontFamily) || undefined;

            // we need to pass color because initWithDataOptionsDocumentAttributesError
            // will set a default color preventing the NSTextView from applying its color

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
            if (!this.isUsingNSTextView) {
                const linkColor = this.linkColor ? (this.linkColor instanceof Color ? this.linkColor : new Color(this.linkColor)) : undefined;
                Object.assign(params, {
                    useCustomLinkTag: true,
                    lineBreak: (nativeView as NSLabel).lineBreakMode,
                    linkDecoration: this.linkUnderline ? 'underline' : undefined,
                    linkColor
                });
            }
            const result = createNativeAttributedString(params, undefined, this, this.autoFontSize, this.fontSizeRatio) as NSMutableAttributedString;
            let hasLink = false;
            if (result) {
                hasLink = result.hasAttribute('CustomLinkAttribute');
            }
            this._setTappableState(hasLink);
            // this.updateInteractionState(hasLink);
            if (this.isUsingNSTextView) {
                (nativeView as NSTextView).selectable = this.selectable === true || hasLink;
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
        if (this.formattedText || this.html) {
            this._setNativeText();
        } else {
            this.nativeTextViewProtected.textColor = color;
        }
    }
    defaultLinkTextAttributes: NSDictionary<any, any>;
    updateLinkTextAttributes() {
        if (this.isUsingNSTextView) {
            const color = !this.linkColor || this.linkColor instanceof Color ? this.linkColor : new Color(this.linkColor);
            const nativeView = this.nativeTextViewProtected;
            let attributes = this.isUsingNSTextView ? (nativeView as NSTextView).linkTextAttributes : null;
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
                attributes.setValueForKey(this.defaultLinkTextAttributes.objectForKey(NSForegroundColorAttributeName), NSForegroundColorAttributeName);
                if (this.linkUnderline !== false) {
                    attributes.setValueForKey(this.defaultLinkTextAttributes.objectForKey(NSUnderlineColorAttributeName), NSUnderlineColorAttributeName);
                } else {
                    attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
                }
            } else {
                if (this.linkUnderline === false) {
                    attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
                }
            }
            (nativeView as NSTextView).linkTextAttributes = attributes;
            // } else {
            // this._setNativeText();
        }
    }
    @needSetText
    [linkColorProperty.setNative](value: Color | string) {
        this.updateLinkTextAttributes();
    }
    [selectableProperty.setNative](value: boolean) {
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            (nativeView as NSTextView).selectable = value;
        }
        // this.updateInteractionState();
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

    @needAutoFontSizeComputation
    [fontInternalProperty.setNative](value: any) {
        const nativeView = this.nativeTextViewProtected;
        const newFont: UIFont = value instanceof Font ? value.getUIFont(nativeView.font) : value;
        nativeView.font = newFont;
        if (this.formattedText || this.html) {
            this._setNativeText();
        }
    }

    @needAutoFontSizeComputation
    [maxFontSizeProperty.setNative]() {}

    @needAutoFontSizeComputation
    [minFontSizeProperty.setNative]() {}

    _setNativeText() {
        if (!this.mCanChangeText) {
            this.mNeedSetText = true;
            return;
        }

        // reset the fontSizeRatio or it could break attributedString sizes in collectionview
        this.fontSizeRatio = 1;
        if (this.html) {
            this.updateHTMLString();
        } else if (this.text instanceof NSAttributedString) {
            this.nativeViewProtected.attributedText = this.text;
        } else {
            super._setNativeText();
        }
        // no need to update veticalAlignment or autoSize as we ask for a layout
        // will be done in onMeasure and onLayout

        if (!this._requestLayoutOnTextChanged() && this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected, force: true });
        }
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
        NSTextUtils.setTextDecorationAndTransformOnViewTextTextDecorationLetterSpacingLineHeightColor(
            this.nativeTextViewProtected,
            text,
            this.style.textDecoration || '',
            letterSpacing,
            lineHeight,
            uiColor
        );
    }
    createFormattedTextNative(value: FormattedString) {
        return createNativeAttributedString(value, undefined, this, this.autoFontSize, this.fontSizeRatio);
    }
    setFormattedTextDecorationAndTransform() {
        const nativeView = this.nativeTextViewProtected;
        const attrText = this.createFormattedTextNative(this.formattedText);
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
        if (!this.isUsingNSTextView) {
            super[paddingTopProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingRightProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[paddingRightProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingBottomProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[paddingBottomProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [paddingLeftProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[paddingLeftProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderTopWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[borderTopWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderRightWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[borderRightWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderBottomWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[borderBottomWidthProperty.setNative](value);
        }
    }
    @needAutoFontSizeComputation
    @needUpdateVerticalAlignment
    [borderLeftWidthProperty.setNative](value: CoreTypes.LengthType) {
        if (!this.isUsingNSTextView) {
            super[borderLeftWidthProperty.setNative](value);
        }
    }

    @needAutoFontSizeComputation
    [maxLinesProperty.setNative](value: number | string) {
        const numberLines = !value || value === 'none' ? 0 : typeof value === 'string' ? parseInt(value, 10) : value;
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            (nativeView as NSTextView).textContainer.maximumNumberOfLines = numberLines;
        } else {
            (nativeView as NSLabel).numberOfLines = numberLines;
        }
    }

    @needAutoFontSizeComputation
    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            (nativeView as NSTextView).textContainer.lineBreakMode = lineBreakToLineBreakMode(value);
        } else {
            (nativeView as NSLabel).lineBreakMode = lineBreakToLineBreakMode(value);
        }
    }

    // [textShadowProperty.setNative](value: ShadowCSSValues) {
    //     const layer = this.nativeTextViewProtected.layer;
    //     layer.shadowOpacity = 1;
    //     layer.shadowRadius = value.blurRadius;
    //     layer.shadowColor = value.color.ios.CGColor;
    //     layer.shadowOffset = CGSizeMake(value.offsetX, value.offsetY);
    //     layer.shouldRasterize = true;
    //     layer.masksToBounds = false;
    // }

    @needAutoFontSizeComputation
    [whiteSpaceProperty.setNative](value: CoreTypes.WhiteSpaceType) {
        const nativeView = this.nativeTextViewProtected;
        if (this.isUsingNSTextView) {
            (nativeView as NSTextView).textContainer.lineBreakMode = whiteSpaceToLineBreakMode(value);
            if (!this.maxLines) {
                if (value === 'normal') {
                    (nativeView as NSTextView).textContainer.maximumNumberOfLines = 0;
                } else {
                    (nativeView as NSTextView).textContainer.maximumNumberOfLines = 1;
                }
            }
        } else {
            (nativeView as NSLabel).lineBreakMode = whiteSpaceToLineBreakMode(value);
            if (!this.maxLines) {
                if (value === 'normal') {
                    (nativeView as NSLabel).numberOfLines = 0;
                } else {
                    (nativeView as NSLabel).numberOfLines = 1;
                }
            }
        }
    }

    updateAutoFontSize({ textView, width, height, force = false, onlyMeasure = false }: { textView: NSTextView | NSLabel; width?; height?; force?: boolean; onlyMeasure?: boolean }) {
        if (!this.mCanUpdateAutoFontSize) {
            this.mNeedAutoFontSizeComputation = true;
        }
        let currentFont;
        if (textView && this.autoFontSize) {
            if ((!textView.attributedText && !textView.text) || (width === undefined && height === undefined && CGSizeEqualToSize(textView.bounds.size, CGSizeZero))) {
                return currentFont;
            }
            const textViewSize = NSLabelUtils.insetWithRectUIEdgeInsets(textView.bounds, textView.padding).size;
            const fixedWidth = Math.ceil(width !== undefined ? width : textViewSize.width);
            const fixedHeight = Math.ceil(height !== undefined ? height : textViewSize.height);
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
            const nbLines = textView instanceof NSTextView ? textView.textContainer?.maximumNumberOfLines : textView.numberOfLines;
            // we need to reset verticalTextAlignment or computation will be wrong
            this.updateVerticalAlignment(false);

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
            if (!onlyMeasure) {
                this.updateVerticalAlignment();
            }
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

    @needUpdateVerticalAlignment
    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {}
}
