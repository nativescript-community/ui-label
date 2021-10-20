import {
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
        createMutableStringForSpan?(span, text): NSMutableAttributedString;
        createNSMutableAttributedString?(formattedString: FormattedString): NSMutableAttributedString;
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
            owner.textViewDidChange(textView, undefined, undefined, true);
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
    constructor() {
        super();
        // if (iOSUseDTCoreText && !Label.DTCORETEXT_INIT) {
        //     Label.DTCORETEXT_INIT = true;
        //     DTCoreTextFontDescriptor.asyncPreloadFontLookupTable();
        // }
    }
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
        view.textContainerInset = {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        };
        view.textContainer.lineFragmentPadding = 0; // to remove left padding
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
        // this.htmlText = null;
        // this.needsHTMLUpdate = false;
        // this.updatingHTML = false;
        // if (this.htmlText && this.needsHTMLUpdate) {
        // this.updateHTMLString();
        // }
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
        const result = tv.sizeThatFits(size);
        return result.height;
    }

    updateTextContainerInset(applyVerticalTextAlignment = true) {
        // if (!this.text) {
        //     return;
        // }
        const tv = this.nativeTextViewProtected;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        const right = layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        const bottom = layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        if (!applyVerticalTextAlignment || !this.verticalTextAlignment) {
            this.nativeViewProtected.textContainerInset = {
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
                this.nativeViewProtected.textContainerInset = {
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
                this.nativeViewProtected.textContainerInset = {
                    top: top + topCorrect,
                    left,
                    bottom,
                    right
                };
                break;
            }

            case 'bottom': {
                const height = this.computeTextHeight(CGSizeMake(tv.bounds.size.width, 10000));
                let bottomCorrect = tv.bounds.size.height - bottom - height * tv.zoomScale;
                bottomCorrect = bottomCorrect < 0.0 ? 0.0 : bottomCorrect;
                this.nativeViewProtected.textContainerInset = {
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

    // setTextDecorationAndTransform() {
    //     const style = this.style;
    //     const dict = new Map<string, any>();
    //     switch (style.textDecoration) {
    //         case 'none':
    //             break;
    //         case 'underline':
    //             // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
    //             dict.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.Single);
    //             break;
    //         case 'line-through':
    //             // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
    //             dict.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.Single);
    //             break;
    //         case 'underline line-through':
    //             // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
    //             dict.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.Single);
    //             dict.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.Single);
    //             break;
    //         default:
    //             throw new Error(`Invalid text decoration value: ${style.textDecoration}. Valid values are: 'none', 'underline', 'line-through', 'underline line-through'.`);
    //     }

    //     if (style.letterSpacing !== 0) {
    //         dict.set(NSKernAttributeName, style.letterSpacing * this.nativeTextViewProtected.font.pointSize);
    //     }

    //     if (style.lineHeight || style.whiteSpace === 'nowrap' || (style['lineBreak'] && style['lineBreak'] !== 'none')) {
    //         const paragraphStyle = NSMutableParagraphStyle.alloc().init();
    //         paragraphStyle.minimumLineHeight = style.lineHeight;
    //         // make sure a possible previously set text alignment setting is not lost when line height is specified
    //         paragraphStyle.alignment = (this.nativeTextViewProtected as UITextField | UITextView | UILabel).textAlignment;

    //         // make sure a possible previously set line break mode is not lost when line height is specified

    //         if (style['lineBreak']) {
    //             paragraphStyle.lineBreakMode = lineBreakToLineBreakMode(style['lineBreak']);
    //         } else if (style.whiteSpace) {
    //             paragraphStyle.lineBreakMode = whiteSpaceToLineBreakMode(style.whiteSpace);
    //         }
    //         dict.set(NSParagraphStyleAttributeName, paragraphStyle);
    //     } else if (isTextView && this.style.textAlignment !== 'initial') {
    //         const paragraphStyle = NSMutableParagraphStyle.alloc().init();
    //         paragraphStyle.alignment = this.nativeTextViewProtected.textAlignment;
    //         dict.set(NSParagraphStyleAttributeName, paragraphStyle);
    //     }

    //     if (style.color && dict.size > 0) {
    //         // dict.set(NSForegroundColorAttributeName, style.color.ios);
    //     }

    //     const text = this.text;
    //     const str = text === undefined || text === null ? '' : text.toString();
    //     const source = getTransformedText(str, this.textTransform);
    //     if (dict.size > 0) {
    //         if (isTextView) {
    //             // UITextView's font seems to change inside.
    //             dict.set(NSFontAttributeName, this.nativeTextViewProtected.font);
    //         }

    //         const result = NSMutableAttributedString.alloc().initWithString(source);
    //         result.setAttributesRange(dict as any, { location: 0, length: source.length });
    //         if (this.nativeTextViewProtected instanceof UIButton) {
    //             this.nativeTextViewProtected.setAttributedTitleForState(result, UIControlState.Normal);
    //         } else {
    //             this.nativeTextViewProtected.attributedText = result;
    //         }
    //     } else {
    //         if (this.nativeTextViewProtected instanceof UIButton) {
    //             // Clear attributedText or title won't be affected.
    //             this.nativeTextViewProtected.setAttributedTitleForState(null, UIControlState.Normal);
    //             this.nativeTextViewProtected.setTitleForState(source, UIControlState.Normal);
    //         } else {
    //             // Clear attributedText or text won't be affected.
    //             this.nativeTextViewProtected.attributedText = undefined;
    //             this.nativeTextViewProtected.text = source;
    //         }
    //     }
    // }

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
            if (this.autoFontSize) {
                const finiteWidth = widthMode === layout.EXACTLY;
                const finiteHeight = heightMode === layout.EXACTLY;
                if (!finiteWidth || !finiteHeight) {
                    this.textViewDidChange(
                        nativeView,
                        layout.toDeviceIndependentPixels(width),
                        layout.toDeviceIndependentPixels(height)
                    );
                }
            }

            const desiredSize = layout.measureNativeView(nativeView, width, widthMode, height, heightMode);

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
            this.textViewDidChange(this.nativeTextViewProtected);
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
                    color: this.color,
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
        if (usingIOSDTCoreText()) {
            this._updateHTMLString();
        } else {
            // setTimeout(() => {
            this._updateHTMLString();
            // }, 0);
        }
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
            if (this.nativeTextViewProtected instanceof UITextField) {
                this.nativeTextViewProtected.defaultTextAttributes.setValueForKey(kern, NSKernAttributeName);
            }
        }
        const isTextView = false;
        if (style.lineHeight) {
            const paragraphStyle = NSMutableParagraphStyle.alloc().init();
            paragraphStyle.lineSpacing = style.lineHeight;
            // make sure a possible previously set text alignment setting is not lost when line height is specified
            if (this.nativeTextViewProtected instanceof UIButton) {
                paragraphStyle.alignment = this.nativeTextViewProtected.titleLabel.textAlignment;
            } else {
                paragraphStyle.alignment = this.nativeTextViewProtected.textAlignment;
            }
            if (this.nativeTextViewProtected instanceof UILabel) {
                // make sure a possible previously set line break mode is not lost when line height is specified
                paragraphStyle.lineBreakMode = this.nativeTextViewProtected.lineBreakMode;
            }
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
            if (this.nativeTextViewProtected instanceof UIButton) {
                this.nativeTextViewProtected.setAttributedTitleForState(result, 0 /* Normal */);
            } else {
                this.nativeTextViewProtected.attributedText = result;
            }
        } else {
            if (this.nativeTextViewProtected instanceof UIButton) {
                // Clear attributedText or title won't be affected.
                this.nativeTextViewProtected.setAttributedTitleForState(null, 0 /* Normal */);
                this.nativeTextViewProtected.setTitleForState(source, 0 /* Normal */);
            } else {
                // Clear attributedText or text won't be affected.
                this.nativeTextViewProtected.attributedText = undefined;
                this.nativeTextViewProtected.text = source;
            }
        }
        if (!style.color && majorVersion >= 13 && UIColor.labelColor) {
            (this as any)._setColor(UIColor.labelColor);
        }
    }
    currentMaxFontSize = 0;

    createNSMutableAttributedString(formattedString: FormattedString): NSMutableAttributedString {
        // we need to store the max Font size to pass it to createMutableStringForSpan
        const length = formattedString.spans.length;
        let maxFontSize = formattedString.style?.fontSize || this?.style.fontSize || 0;
        for (let i = 0; i < length; i++) {
            const s = formattedString.spans.getItem(i);
            if (s.style.fontSize) {
                maxFontSize = Math.max(maxFontSize, s.style.fontSize);
            }
        }
        this.currentMaxFontSize = maxFontSize;
        return super.createNSMutableAttributedString(formattedString);
    }
    createMutableStringForSpan(span: Span, text: string): NSMutableAttributedString {
        const viewFont = this.nativeTextViewProtected.font;
        const attrDict: { key: string; value: any } = {} as any;
        const style = span.style;

        let align = style.verticalAlignment || (span.parent as FormattedString).style.verticalAlignment;
        if (!align || align === 'stretch') {
            align = this.verticalTextAlignment as any;
        }
        const font = new Font(style.fontFamily, style.fontSize, style.fontStyle, style.fontWeight);
        const iosFont = font.getUIFont(viewFont);

        attrDict[NSFontAttributeName] = iosFont;
        if (span.color) {
            const color = span.color instanceof Color ? span.color : new Color(span.color as any);
            attrDict[NSForegroundColorAttributeName] = color.ios;
        }

        // We don't use isSet function here because defaultValue for backgroundColor is null.
        const backgroundColor: Color = style.backgroundColor || (span.parent as FormattedString).backgroundColor;
        if (backgroundColor) {
            const color = backgroundColor instanceof Color ? backgroundColor : new Color(backgroundColor);
            attrDict[NSBackgroundColorAttributeName] = color.ios;
        }

        const textDecoration: CoreTypes.TextDecorationType = getClosestPropertyValue(textDecorationProperty, span);

        if (textDecoration) {
            const underline = textDecoration.indexOf('underline') !== -1;
            if (underline) {
                attrDict[NSUnderlineStyleAttributeName] = underline;
            }

            const strikethrough = textDecoration.indexOf('line-through') !== -1;
            if (strikethrough) {
                attrDict[NSStrikethroughStyleAttributeName] = strikethrough;
            }
        }

        if (align && align !== 'stretch') {
            if (iosFont) {
                attrDict[NSBaselineOffsetAttributeName] = -computeBaseLineOffset(
                    align,
                    -iosFont.ascender,
                    -iosFont.descender,
                    -iosFont.ascender,
                    -iosFont.descender,
                    iosFont.pointSize,
                    this.currentMaxFontSize
                );
            }
        }

        return NSMutableAttributedString.alloc().initWithStringAttributes(text, attrDict as any);
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
    textViewDidChange(textView: UITextView, width?, height?, force = false) {
        if (textView && this.autoFontSize) {
            if (
                (!textView.attributedText && !textView.text) ||
                (width === undefined && height === undefined && CGSizeEqualToSize(textView.bounds.size, CGSizeZero))
            ) {
                return;
            }

            const textViewSize = textView.frame.size;
            const fixedWidth = Math.floor(width !== undefined ? width : textViewSize.width);
            const fixedHeight = Math.floor(height !== undefined ? height : textViewSize.height);
            if (fixedWidth === 0 || fixedHeight === 0) {
                return;
            }
            const autoSizeKey = fixedWidth + '_' + fixedHeight;
            if (!force && autoSizeKey === this._lastAutoSizeKey) {
                return;
            }
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
            this.fontSizeRatio = expectFont.pointSize / fontSize;
            this.updateTextContainerInset();
        }
    }
    [autoFontSizeProperty.setNative](value: boolean) {
        if (value) {
            if (this.isLayoutValid && (this.text || this.html || this.formattedText)) {
                this.textViewDidChange(this.nativeTextViewProtected, undefined, undefined, true);
            }
        } else {
            this[fontInternalProperty.setNative](this.style.fontInternal);
        }
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        this.updateTextContainerInset();
    }
}
