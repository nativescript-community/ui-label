import {
    VerticalTextAlignment,
    computeBaseLineOffset,
    createNativeAttributedString,
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
import { letterSpacingProperty, textDecorationProperty, whiteSpaceProperty } from '@nativescript/core/ui/text-base';
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
    needFormattedStringComputation,
    selectableProperty,
    textShadowProperty
} from './label-common';

export { createNativeAttributedString, enableIOSDTCoreText } from '@nativescript-community/text';
export * from './label-common';

const majorVersion = iOSNativeHelper.MajorVersion;

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
        if (this._htmlTapGestureRecognizer) {
            this.nativeViewProtected.removeGestureRecognizer(this._htmlTapGestureRecognizer);
            this._htmlTapGestureRecognizer = null;
        }
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
        const font = this.nativeViewProtected.font;
        const text = this.formattedText || this.html ? tv.attributedText : tv.text;
        if (text instanceof NSAttributedString) {
            const rect = text.boundingRectWithSizeOptionsContext(size, NSStringDrawingOptions.UsesLineFragmentOrigin, null);
            return rect.size.height;
        }
        return NSString.stringWithString(text).sizeWithFontConstrainedToSizeLineBreakMode(
            font,
            size,
            tv.textContainer.lineBreakMode
        ).height;
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
                this.textViewDidChange(
                    nativeView,
                    Math.floor(layout.toDeviceIndependentPixels(width)),
                    Math.floor(layout.toDeviceIndependentPixels(height))
                );
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
    _htmlTappable = false;
    _htmlTapGestureRecognizer;

    textViewShouldInteractWithURLInRangeInteraction?(
        textView: UITextView,
        URL: NSURL,
        characterRange: NSRange,
        interaction: UITextItemInteraction
    ) {
        this.notify({ eventName: 'linkTap', object: this, link: URL.toString() });
        return false;
    }

    updateHTMLString() {
        if (!this.html) {
            this.nativeTextViewProtected.selectable = this.selectable === true;
            this.attributedString = null;
        } else {
            const font = this.nativeViewProtected.font;
            const fontSize = this.fontSize || font?.pointSize || 17;
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
                this
            ) as NSMutableAttributedString;
            // if (this.linkColor) {
            // this.nativeTextViewProtected.linkTextAttributes = null;
            // const color =this.linkColor.ios;
            let hasLink = false;
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
            // }

            this.attributedString = result;
        }
        if (this.nativeViewProtected) {
            this.nativeViewProtected.attributedText = this.attributedString;
        }
        this._requestLayoutOnTextChanged();
    }
    [colorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;
        // if (!this.formattedText && !this.html) {
        const nativeView = this.nativeTextViewProtected;
        nativeView.textColor = color;
        // }
    }
    [linkColorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;
        const nativeView = this.nativeTextViewProtected;
        let attributes = nativeView.linkTextAttributes;
        if (!(attributes instanceof NSMutableDictionary)) {
            attributes = NSMutableDictionary.new();
        }
        attributes.setValueForKey(color, NSForegroundColorAttributeName);
        if (this.linkUnderline !== false) {
            attributes.setValueForKey(color, NSUnderlineColorAttributeName);
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
            if (this.linkColor) {
                attributes.setValueForKey(this.linkColor.ios, NSUnderlineColorAttributeName);
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
        // if (!this.style.fontInternal) {
        this.updateHTMLString();
        // }
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
    // [textAlignmentProperty.setNative](value: number) {
    //     super[textAlignmentProperty.setNative](value);
    // }
    _setNativeText() {
        if (this.html) {
            this.updateHTMLString();
        } else {
            super._setNativeText();
        }
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
                dict.set(NSForegroundColorAttributeName, style.color.ios);
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

    textViewDidChange(textView: UITextView, width?, height?) {
        if (this.autoFontSize) {
            if ((!textView.attributedText && !textView.text) || CGSizeEqualToSize(textView.bounds.size, CGSizeZero)) {
                return;
            }
            const nbLines = textView.textContainer.maximumNumberOfLines;
            // we need to reset verticalTextAlignment or computation will be wrong
            this.updateTextContainerInset(false);
            const textViewSize = textView.frame.size;
            const fixedWidth = width || textViewSize.width;
            const fixedHeight = height || textViewSize.height;

            const fontSize = this.style.fontSize || 17;
            let expectFont: UIFont = (this.style.fontInternal || Font.default).getUIFont(UIFont.systemFontOfSize(fontSize));
            //first reset the font size
            textView.font = expectFont;
            let expectSize;
            const size = () => {
                if (nbLines === 1) {
                    expectSize = textView.sizeThatFits(CGSizeMake(Number.MAX_SAFE_INTEGER, fixedHeight));
                } else {
                    expectSize = textView.sizeThatFits(CGSizeMake(fixedWidth, Number.MAX_SAFE_INTEGER));
                }
            };
            size();
            if (expectSize.height > textViewSize.height || expectSize.width > textViewSize.width) {
                while (
                    (expectSize.height > textViewSize.height || expectSize.width > textViewSize.width) &&
                    expectFont.pointSize > (this.minFontSize || 12)
                ) {
                    const newFont = expectFont.fontWithSize(expectFont.pointSize - 1);
                    textView.font = newFont;
                    size();
                    if (expectSize.height >= textViewSize.height || expectSize.width >= textViewSize.width) {
                        expectFont = newFont;
                    } else {
                        textView.font = newFont;
                        break;
                    }
                }
            } else {
                while (
                    (expectSize.height < textViewSize.height || expectSize.width < textViewSize.width) &&
                    expectFont.pointSize < (this.maxFontSize || 200)
                ) {
                    const newFont = expectFont.fontWithSize(expectFont.pointSize + 1);
                    textView.font = newFont;
                    size();

                    if (expectSize.height <= textViewSize.height || expectSize.width <= textViewSize.width) {
                        expectFont = newFont;
                    } else {
                        textView.font = newFont;
                        break;
                    }
                }
            }
            this.updateTextContainerInset();
        }
    }
    _onSizeChanged(): void {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        super._onSizeChanged();
        if (this.autoFontSize) {
            this.textViewDidChange(nativeView);
        }
    }
    [autoFontSizeProperty.setNative](value: boolean) {
        if (value && this.text) {
            this.textViewDidChange(this.nativeTextViewProtected);
        } else {
            this[fontInternalProperty.setNative](this.style.fontInternal);
        }
    }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        this.updateTextContainerInset();
    }
}
