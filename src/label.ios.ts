import {
    LightFormattedString,
    VerticalTextAlignment,
    computeBaseLineOffset,
    createNativeAttributedString,
    usingIOSDTCoreText,
    verticalTextAlignmentProperty
} from '@nativescript-community/text';
import { Color, CoreTypes, Font, FormattedString, Span, View } from '@nativescript/core';
import {
    borderBottomWidthProperty,
    borderLeftWidthProperty,
    borderRightWidthProperty,
    borderTopWidthProperty,
    colorProperty,
    fontInternalProperty,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty
} from '@nativescript/core/ui/styling/style-properties';
import {
    formattedTextProperty,
    letterSpacingProperty,
    textDecorationProperty,
    whiteSpaceProperty
} from '@nativescript/core/ui/text-base';
import { getClosestPropertyValue, lineHeightProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { isNullOrUndefined, isString } from '@nativescript/core/utils/types';
import { iOSNativeHelper, layout } from '@nativescript/core/utils/utils';
import { TextShadow } from './label';
import {
    LabelBase,
    autoFontSizeProperty,
    htmlProperty,
    lineBreakProperty,
    linkColorProperty,
    linkUnderlineProperty,
    maxLinesProperty,
    needFontComputation,
    needFormattedStringComputation,
    selectableProperty,
    textShadowProperty
} from './label-common';

export { createNativeAttributedString, enableIOSDTCoreText } from '@nativescript-community/text';
export * from './label-common';

const majorVersion = iOSNativeHelper.MajorVersion;

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
        // createMutableStringForSpan?(span, text): NSMutableAttributedString;
        // createNSMutableAttributedString?(formattedString: FormattedString): NSMutableAttributedString;
        // createNSMutableAttributedString(formattedString: FormattedString);
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
        textView: UITextView,
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
    textViewDidChange?(textView: UITextView) {
        const owner = this._owner.get();
        if (owner) {
            owner.textViewDidChange(textView);
        }
    }
}

@NativeClass
class ObserverClass extends NSObject {
    _owner: WeakRef<Label>;
    // NOTE: Refactor this - use Typescript property instead of strings....
    observeValueForKeyPathOfObjectChangeContext(path: string, tv: UITextView) {
        if (path === 'contentSize') {
            const owner = this._owner && this._owner.get();
            if (owner) {
                owner.updateTextContainerInset();
            }
        }
    }
}

export class Label extends LabelBase {
    private _observer: NSObject;
    nativeViewProtected: UITextView;
    nativeTextViewProtected: UITextView;
    attributedString: NSMutableAttributedString;
    private _delegate: LabelUITextViewDelegateImpl;
    static DTCORETEXT_INIT = false;
    // constructor() {
    // super();
    // if (iOSUseDTCoreText && !Label.DTCORETEXT_INIT) {
    //     Label.DTCORETEXT_INIT = true;
    //     DTCoreTextFontDescriptor.asyncPreloadFontLookupTable();
    // }
    // }
    public createNativeView() {
        const view = UITextView.new();
        if (!view.font) {
            view.font = UIFont.systemFontOfSize(12);
        }
        view.linkTextAttributes = NSDictionary.new();
        view.scrollEnabled = false;
        view.editable = false;
        view.selectable = false;
        view.backgroundColor = UIColor.clearColor;
        view.userInteractionEnabled = true;
        view.dataDetectorTypes = UIDataDetectorTypes.All;
        view.textContainerInset = UIEdgeInsetsZero;
        view.textContainer.lineFragmentPadding = 0;
        // ignore font leading just like UILabel does
        view.layoutManager.usesFontLeading = false;
        // view.textContainer.lineBreakMode = NSLineBreakMode.ByCharWrapping;
        return view;
    }

    public initNativeView() {
        super.initNativeView();
        this._delegate = LabelUITextViewDelegateImpl.initWithOwner(new WeakRef(this));
        this._observer = ObserverClass.alloc().init();
        this._observer['_owner'] = new WeakRef(this);
        this.nativeViewProtected.addObserverForKeyPathOptionsContext(
            this._observer,
            'contentSize',
            NSKeyValueObservingOptions.New,
            null
        );
        this.nativeViewProtected.attributedText = this.attributedString;
    }
    public disposeNativeView() {
        this._delegate = null;
        super.disposeNativeView();
        // if (this._htmlTapGestureRecognizer) {
        //     this.nativeViewProtected.removeGestureRecognizer(this._htmlTapGestureRecognizer);
        //     this._htmlTapGestureRecognizer = null;
        // }
        if (this._observer) {
            this.nativeViewProtected.removeObserverForKeyPath(this._observer, 'contentSize');
            this._observer = null;
        }
    }
    public onLoaded() {
        super.onLoaded();
        this.nativeTextViewProtected.delegate = this._delegate;
    }

    public onUnloaded() {
        this.nativeTextViewProtected.delegate = null;
        super.onUnloaded();
    }
    computeTextHeight(size: CGSize) {
        const tv = this.nativeTextViewProtected;
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

    updateTextContainerInset(applyVerticalTextAlignment = true) {
        const tv = this.nativeTextViewProtected;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        const right = layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        const bottom = layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        if (
            !applyVerticalTextAlignment ||
            !this.verticalTextAlignment ||
            (tv.text?.length === 0 && tv.attributedText?.length === 0)
        ) {
            tv.textContainerInset = {
                top,
                left,
                bottom,
                right
            };
            return;
        }
        switch (this.verticalTextAlignment) {
            case 'initial': // not supported
            case 'top':
                tv.textContainerInset = {
                    top,
                    left,
                    bottom,
                    right
                };
                break;

            case 'middle':
            case 'center': {
                const height = this.computeTextHeight(CGSizeMake(tv.bounds.size.width, 10000));
                let topCorrect = (tv.bounds.size.height - top - bottom - height * tv.zoomScale) / 2.0;
                topCorrect = topCorrect < 0.0 ? 0.0 : topCorrect;
                tv.textContainerInset = {
                    top: top + topCorrect,
                    left,
                    bottom,
                    right
                };
                break;
            }

            case 'bottom': {
                const height = this.computeTextHeight(CGSizeMake(tv.bounds.size.width, 10000));
                let bottomCorrect = tv.bounds.size.height - top - bottom - height * tv.zoomScale;
                bottomCorrect = bottomCorrect < 0.0 ? 0.0 : bottomCorrect;
                tv.textContainerInset = {
                    top: top + bottomCorrect,
                    left,
                    bottom,
                    right
                };
                break;
            }
        }
    }

    // @ts-ignore
    get ios(): UITextView {
        return this.nativeViewProtected;
    }
    private _fixedSize: FixedSize;

    _requestLayoutOnTextChanged(): void {
        if (this._fixedSize === FixedSize.BOTH) {
            return;
        }
        if (this._fixedSize === FixedSize.WIDTH && !this.textWrap && this.getMeasuredHeight() > 0) {
            // Single line label with fixed width will skip request layout on text change.
            return;
        }
        super._requestLayoutOnTextChanged();
    }
    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        const nativeView = this.nativeTextViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
            let resetFont;
            if (this.autoFontSize) {
                const finiteWidth = widthMode === layout.EXACTLY;
                const finiteHeight = heightMode === layout.EXACTLY;
                if (!finiteWidth || !finiteHeight) {
                    resetFont = this.updateAutoFontSize({
                        textView: nativeView,
                        width: layout.toDeviceIndependentPixels(width),
                        height: layout.toDeviceIndependentPixels(height),
                        onlyMeasure: true
                    });
                }
            }

            const desiredSize = layout.measureNativeView(nativeView, width, widthMode, height, heightMode);
            if (resetFont) {
                nativeView.font = resetFont;
            }

            const labelWidth = widthMode === layout.AT_MOST ? Math.min(desiredSize.width, width) : desiredSize.width;
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
        if (this.autoFontSize) {
            this.updateAutoFontSize({ textView: this.nativeTextViewProtected });
        }
    }
    // _htmlTappable = false;
    // _htmlTapGestureRecognizer;

    textViewShouldInteractWithURLInRangeInteraction?(
        textView: UITextView,
        URL: NSURL,
        characterRange: NSRange,
        interaction: UITextItemInteraction
    ) {
        this.notify({ eventName: 'linkTap', object: this, link: URL.toString() });
        return false;
    }

    _updateHTMLString(fontSize?: number) {
        if (!this.html) {
            this.nativeTextViewProtected.selectable = this.selectable === true;
            this.attributedString = null;
        } else {
            const font = this.nativeViewProtected.font;
            if (!fontSize) {
                fontSize = this.fontSize || font?.pointSize || 17;
            }
            const fontWeight = this.style.fontWeight;
            const familyName =
                this.style.fontFamily || (this.style.fontInternal && this.style.fontInternal.fontFamily) || font?.familyName;
            const result = createNativeAttributedString(
                {
                    text: this.html,
                    fontSize,
                    familyName,
                    fontWeight,
                    // color: this.color,
                    letterSpacing: this.letterSpacing,
                    lineHeight: this.lineHeight,
                    textAlignment: this.nativeTextViewProtected.textAlignment
                },
                this,
                this.autoFontSize,
                this.fontSizeRatio
            ) as NSMutableAttributedString;
            let hasLink = false;
            result &&
                result.enumerateAttributeInRangeOptionsUsingBlock(
                    NSLinkAttributeName,
                    { location: 0, length: result.length },
                    0,
                    (value, range: NSRange, stop) => {
                        hasLink = hasLink || (!!value && range.length > 0);
                        if (hasLink) {
                            stop[0] = true;
                        }
                    }
                );
            this.nativeTextViewProtected.selectable = this.selectable === true || hasLink;

            this.attributedString = result;
        }
        if (this.nativeViewProtected) {
            this.nativeViewProtected.attributedText = this.attributedString;
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
            // if (this.formattedText || this.html) {
            //     this._setNativeText();
            // } else {
            this.nativeTextViewProtected.textColor = color;
            // }
        }
    }
    [linkColorProperty.setNative](value: Color | string) {
        const color = !value || value instanceof Color ? (value as Color) : new Color(value);
        const nativeView = this.nativeTextViewProtected;
        let attributes = nativeView.linkTextAttributes;
        if (!(attributes instanceof NSMutableDictionary)) {
            attributes = NSMutableDictionary.new();
        }
        if (this.linkUnderline !== false && color) {
            attributes.setValueForKey(color.ios, NSForegroundColorAttributeName);
            attributes.setValueForKey(color.ios, NSUnderlineColorAttributeName);
        } else {
            attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
        }
        nativeView.linkTextAttributes = attributes;
    }
    [selectableProperty.setNative](value: boolean) {
        this.nativeTextViewProtected.selectable = value;
    }
    [linkUnderlineProperty.setNative](value: boolean) {
        const nativeView = this.nativeTextViewProtected;
        let attributes = nativeView.linkTextAttributes as NSMutableDictionary<any, any>;
        if (!(attributes instanceof NSMutableDictionary)) {
            attributes = NSMutableDictionary.new();
        }
        if (value) {
            const color = !this.linkColor || this.linkColor instanceof Color ? this.linkColor : new Color(this.linkColor);
            if (color) {
                attributes.setValueForKey(color.ios, NSUnderlineColorAttributeName);
            } else {
                attributes.removeObjectForKey(NSUnderlineColorAttributeName);
            }
        } else {
            attributes.setValueForKey(UIColor.clearColor, NSUnderlineColorAttributeName);
        }
        nativeView.linkTextAttributes = attributes;
    }
    @needFormattedStringComputation
    [htmlProperty.setNative](value: string) {
        this.updateHTMLString();
    }
    @needFormattedStringComputation
    [formattedTextProperty.setNative](value: string) {
        super[formattedTextProperty.setNative](value);
    }
    @needFormattedStringComputation
    [letterSpacingProperty.setNative](value: number) {
        super[letterSpacingProperty.setNative](value);
    }
    @needFormattedStringComputation
    [lineHeightProperty.setNative](value: number) {
        super[lineHeightProperty.setNative](value);
    }
    // @needFormattedStringComputation
    // [colorProperty.setNative](value: number) {
    //     super[colorProperty.setNative](value);
    // }
    [fontInternalProperty.setNative](value: any) {
        const nativeView = this.nativeTextViewProtected;
        const newFont: UIFont = value instanceof Font ? value.getUIFont(nativeView.font) : value;
        if (!this.formattedText && !this.html) {
            nativeView.font = newFont;
        } else if (newFont) {
            if (!this._canChangeText) {
                this._needFormattedStringComputation = true;
                return;
            }
            this._setNativeText();
        }
    }
    _setSpannablesFontSizeWithRatio(ratio) {
        const nativeView = this.nativeTextViewProtected;
        const toChange: NSMutableAttributedString =
            nativeView.attributedText instanceof NSMutableAttributedString
                ? nativeView.attributedText
                : NSMutableAttributedString.alloc().initWithAttributedString(nativeView.attributedText);
        let found = false;
        toChange.enumerateAttributeInRangeOptionsUsingBlock(
            AttributeOriginalFontSize,
            { location: 0, length: nativeView.attributedText.length },
            0,
            (value, range: NSRange, stop) => {
                if (!value) {
                    return;
                }
                toChange.enumerateAttributeInRangeOptionsUsingBlock(
                    NSFontAttributeName,
                    range,
                    0,
                    (value2: UIFont, range: NSRange, stop) => {
                        if (value2 && value * ratio !== value2.pointSize) {
                            const newFont = value2.fontWithSize(Math.round(value * ratio));
                            if (newFont) {
                                found = true;
                                toChange.removeAttributeRange(NSFontAttributeName, range);
                                toChange.addAttributeValueRange(NSFontAttributeName, newFont, range);
                            }
                        }
                    }
                );
            }
        );
        if (found) {
            nativeView.attributedText = toChange;
        }
    }
    _setNativeText() {
        if (this.html) {
            this.updateHTMLString();
        } else {
            super._setNativeText();
        }
        if (this.color) {
            const color = this.color instanceof Color ? this.color.ios : this.color;
            this._setColor(color);
        }
        this.updateTextContainerInset();
        this._requestLayoutOnTextChanged();
    }
    setTextDecorationAndTransform() {
        const style = this.style;
        const dict = new Map();
        switch (style.textDecoration) {
            case 'none':
                break;
            case 'underline':
                dict.set(NSUnderlineStyleAttributeName, 1 /* Single */);
                break;
            case 'line-through':
                dict.set(NSStrikethroughStyleAttributeName, 1 /* Single */);
                break;
            case 'underline line-through':
                dict.set(NSUnderlineStyleAttributeName, 1 /* Single */);
                dict.set(NSStrikethroughStyleAttributeName, 1 /* Single */);
                break;
            default:
                throw new Error(
                    `Invalid text decoration value: ${style.textDecoration}. Valid values are: 'none', 'underline', 'line-through', 'underline line-through'.`
                );
        }
        if (style.letterSpacing !== 0 && this.nativeTextViewProtected.font) {
            const kern = style.letterSpacing * this.nativeTextViewProtected.font.pointSize;
            dict.set(NSKernAttributeName, kern);
        }
        const isTextView = false;
        if (style.lineHeight !== undefined) {
            let lineHeight = style.lineHeight;
            if (lineHeight === 0) {
                lineHeight = 0.00001;
            }
            const paragraphStyle = NSMutableParagraphStyle.alloc().init();
            paragraphStyle.minimumLineHeight = lineHeight;
            paragraphStyle.maximumLineHeight = lineHeight;
            // make sure a possible previously set text alignment setting is not lost when line height is specified
            paragraphStyle.alignment = this.nativeTextViewProtected.textAlignment;
            dict.set(NSParagraphStyleAttributeName, paragraphStyle);
        } else if (isTextView) {
            const paragraphStyle = NSMutableParagraphStyle.alloc().init();
            paragraphStyle.alignment = this.nativeTextViewProtected.textAlignment;
            dict.set(NSParagraphStyleAttributeName, paragraphStyle);
        }
        const source = getTransformedText(isNullOrUndefined(this.text) ? '' : `${this.text}`, this.textTransform);
        if (dict.size > 0) {
            if (this.nativeTextViewProtected.font) {
                dict.set(NSFontAttributeName, this.nativeTextViewProtected.font);
            }
            if (style.color) {
                const color = !style.color || style.color instanceof Color ? style.color : new Color(style.color);
                if (color) {
                    dict.set(NSForegroundColorAttributeName, color.ios);
                }
            }
            const result = NSMutableAttributedString.alloc().initWithString(source);
            result.setAttributesRange(dict as any, {
                location: 0,
                length: source.length
            });
            this.nativeTextViewProtected.attributedText = result;
        } else {
            // Clear attributedText or text won't be affected.
            this.nativeTextViewProtected.attributedText = undefined;
            this.nativeTextViewProtected.text = source;
        }
        if (!style.color && majorVersion >= 13 && UIColor.labelColor) {
            (this as any)._setColor(UIColor.labelColor);
        }
    }
    createFormattedTextNative(value: FormattedString) {
        return createNativeAttributedString(value, this, this.autoFontSize, this.fontSizeRatio);
    }
    setFormattedTextDecorationAndTransform() {
        const attrText = this.createFormattedTextNative(this.formattedText);
        // we override parent class behavior because we apply letterSpacing and lineHeight on a per Span basis
        if (majorVersion >= 13 && UIColor.labelColor) {
            this.nativeTextViewProtected.textColor = UIColor.labelColor;
        }

        this.nativeTextViewProtected.attributedText = attrText;
    }

    [paddingTopProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [paddingTopProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [paddingRightProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [paddingRightProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [paddingBottomProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [paddingBottomProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }
    [paddingLeftProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [paddingLeftProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [borderTopWidthProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [borderTopWidthProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [borderRightWidthProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [borderRightWidthProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [borderBottomWidthProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [borderBottomWidthProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [borderLeftWidthProperty.getDefault](): CoreTypes.LengthType {
        return {
            value: 0,
            unit: 'px'
        };
    }
    [borderLeftWidthProperty.setNative](value: CoreTypes.LengthType) {
        this.updateTextContainerInset();
    }

    [maxLinesProperty.setNative](value: number | string) {
        if (!value || value === 'none') {
            this.nativeViewProtected.textContainer.maximumNumberOfLines = 0;
        } else {
            this.nativeViewProtected.textContainer.maximumNumberOfLines = typeof value === 'string' ? parseInt(value, 10) : value;
        }
    }

    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        nativeView.textContainer.lineBreakMode = lineBreakToLineBreakMode(value);
    }
    [textShadowProperty.setNative](value: TextShadow) {
        this.nativeTextViewProtected.layer.shadowOpacity = 1;
        this.nativeTextViewProtected.layer.shadowRadius = value.blurRadius;
        this.nativeTextViewProtected.layer.shadowColor = value.color.ios.CGColor;
        this.nativeTextViewProtected.layer.shadowOffset = CGSizeMake(value.offsetX, value.offsetY);
        this.nativeTextViewProtected.layer.shouldRasterize = true;
        this.nativeTextViewProtected.layer.masksToBounds = false;
    }
    [whiteSpaceProperty.setNative](value: CoreTypes.WhiteSpaceType) {
        const nativeView = this.nativeTextViewProtected;
        // only if no lineBreak
        if (!this.lineBreak) {
            nativeView.textContainer.lineBreakMode = whiteSpaceToLineBreakMode(value);
            if (!this.maxLines) {
                if (value === 'normal') {
                    this.nativeViewProtected.textContainer.maximumNumberOfLines = 0;
                } else {
                    this.nativeViewProtected.textContainer.maximumNumberOfLines = 1;
                }
            }
        }
    }

    fontSizeRatio = 1;
    _lastAutoSizeKey: string;

    updateAutoFontSize({
        textView,
        width,
        height,
        force = false,
        onlyMeasure = false
    }: {
        textView: UITextView;
        width?;
        height?;
        force?: boolean;
        onlyMeasure?: boolean;
    }) {
        let currentFont;
        if (textView && this.autoFontSize) {
            if (
                (!textView.attributedText && !textView.text) ||
                (width === undefined && height === undefined && CGSizeEqualToSize(textView.bounds.size, CGSizeZero))
            ) {
                return currentFont;
            }
            const textViewSize = textView.frame.size;
            const fixedWidth = Math.floor(width !== undefined ? width : textViewSize.width);
            const fixedHeight = Math.floor(height !== undefined ? height : textViewSize.height);
            if (fixedWidth === 0 || fixedHeight === 0) {
                return currentFont;
            }
            const autoSizeKey = fixedWidth + '_' + fixedHeight;
            if (!force && autoSizeKey === this._lastAutoSizeKey) {
                return null;
            }
            currentFont = textView.font;
            this._lastAutoSizeKey = autoSizeKey;
            const nbLines = textView.textContainer.maximumNumberOfLines;
            // we need to reset verticalTextAlignment or computation will be wrong
            this.updateTextContainerInset(false);

            const fontSize = this.style.fontSize || 17;
            let expectFont: UIFont = (this.style.fontInternal || Font.default).getUIFont(UIFont.systemFontOfSize(fontSize));
            //first reset the font size
            let expectSize;

            const stepSize = this.autoFontSizeStep || 1;

            const updateFontSize = (font) => {
                if (this.formattedText || this.html) {
                    this._setSpannablesFontSizeWithRatio(font.pointSize / fontSize);
                } else {
                    textView.font = font;
                }
            };
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
                while (
                    (expectSize.height > fixedHeight || expectSize.width > fixedWidth) &&
                    expectFont.pointSize > (this.minFontSize || 12)
                ) {
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
                while (
                    (expectSize.height < fixedHeight || expectSize.width < fixedWidth) &&
                    expectFont.pointSize < (this.maxFontSize || 200)
                ) {
                    const newFont = expectFont.fontWithSize(expectFont.pointSize + stepSize);
                    updateFontSize(newFont);

                    size();

                    if (expectSize.height <= fixedHeight || expectSize.width <= fixedWidth) {
                        expectFont = newFont;
                    } else {
                        expectFont = newFont;
                        if (!this.formattedText && !this.html) {
                            textView.font = newFont;
                        }
                        break;
                    }
                }
            }
            if (!onlyMeasure) {
                this.fontSizeRatio = expectFont.pointSize / fontSize;
            }

            this.updateTextContainerInset();
        }
        return currentFont;
    }
    textViewDidChange(textView: UITextView) {
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
        this.updateTextContainerInset();
    }
}
