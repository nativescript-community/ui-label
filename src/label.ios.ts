import { Color, View } from '@nativescript/core';
import {
    Length,
    borderBottomWidthProperty,
    borderLeftWidthProperty,
    borderRightWidthProperty,
    borderTopWidthProperty,
    colorProperty,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty,
} from '@nativescript/core/ui/styling/style-properties';

import { lineHeightProperty } from '@nativescript/core/ui/text-base/text-base-common';
import {
    TextAlignment,
    TextTransform,
    WhiteSpace,
    letterSpacingProperty,
    whiteSpaceProperty,
} from '@nativescript/core/ui/text-base';
import { isString } from '@nativescript/core/utils/types';
import { layout } from '@nativescript/core/utils/utils';
import { TextShadow, VerticalTextAlignment } from './label';
import {
    LabelBase,
    htmlProperty,
    lineBreakProperty,
    maxLinesProperty,
    needFormattedStringComputation,
    textAlignmentConverter,
    textShadowProperty,
    verticalTextAlignmentProperty,
} from './label-common';

export * from './label-common';
enum FixedSize {
    NONE = 0,
    WIDTH = 1,
    HEIGHT = 2,
    BOTH = 3,
}

declare module '@nativescript/core/ui/text-base' {
    interface TextBase {
        _requestLayoutOnTextChanged();
        _setNativeText();
        // createNSMutableAttributedString(formattedString: FormattedString);
    }
}

function NSStringFromNSAttributedString(source: NSAttributedString | string): NSString {
    return NSString.stringWithString((source instanceof NSAttributedString && source.string) || (source as string));
}
export function getTransformedText(text: string, textTransform: TextTransform): string {
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
function whiteSpaceToLineBreakMode(value: WhiteSpace) {
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
class ObserverClass extends NSObject {
    _owner: WeakRef<Label>;
    // NOTE: Refactor this - use Typescript property instead of strings....
    observeValueForKeyPathOfObjectChangeContext(path: string, tv: UITextView) {
        if (path === 'contentSize') {
            const owner = this._owner && this._owner.get();
            if (owner) {
                owner.updateVerticalAlignment();
            }
        }
    }
}

let iOSUseDTCoreText = false;
export function enableIOSDTCoreText() {
    iOSUseDTCoreText = true;
}

function HTMLStringToNSMutableAttributedString({
    text,
    familyName = '-apple-system',
    fontSize,
    letterSpacing,
    lineHeight,
    color,
    textAlignment,
}: {
    text: string;
    color: Color;
    familyName: string;
    fontSize: number;
    letterSpacing?: number;
    lineHeight?: number;
    textAlignment: NSTextAlignment;
}) {
    let htmlString;
    if (iOSUseDTCoreText) {
        htmlString =
            color || familyName || fontSize
                ? `<span style=" ${color ? `color: ${color};` : ''}  ${
                    familyName ? `font-family:'${familyName.replace(/'/g, '')}';` : ''
                }${fontSize ? `font-size: ${fontSize}px;` : ''}">${text}</span>`
                : text;
        // `<span style="font-family: ${fontFamily}; font-size:${fontSize};">${htmlString}</span>`;
    } else {
        htmlString =
            color || familyName || fontSize
                ? `<style>body{ ${color ? `color: ${color};` : ''}  ${
                    familyName ? `font-family:"${familyName.replace(/'/g, '')}";` : ''
                }${fontSize ? `font-size: ${fontSize}px;` : ''}}</style>${text}`
                : text;
    }
    const nsString = NSString.stringWithString(htmlString);
    const nsData = nsString.dataUsingEncoding(NSUTF16StringEncoding);
    let attrText;
    if (iOSUseDTCoreText) {
        // on iOS 13.3 there is bug with the system font
        // https://github.com/Cocoanetics/DTCoreText/issues/1168
        const options = {
            [DTDefaultTextAlignment]: kCTLeftTextAlignment,
            // [NSTextSizeMultiplierDocumentOption]: 1,
            // [DTIgnoreLinkStyleOption]: false,
            // [DTDefaultFontFamily]: familyName,
            // [NSFontAttributeName]: familyName,
            // [NSTextSizeMultiplierDocumentOption]: 17 / 12.0,
            [DTUseiOS6Attributes]: true,
            [DTDocumentPreserveTrailingSpaces]: true,
            // [DTDefaultLineBreakMode]: kCTLineBreakByWordWrapping
        } as any;
        attrText = NSMutableAttributedString.alloc().initWithHTMLDataOptionsDocumentAttributes(nsData, options, null);
        attrText.enumerateAttributesInRangeOptionsUsingBlock(
            { location: 0, length: attrText.length },
            NSAttributedStringEnumerationReverse,
            (attributes: NSDictionary<any, any>, range, stop) => {
                if (!!attributes.valueForKey('DTGUID')) {
                    // We need to remove this attribute or links are not colored right
                    //
                    // @see https://github.com/Cocoanetics/DTCoreText/issues/792
                    attrText.removeAttributeRange('CTForegroundColorFromContext', range);
                }
            }
        );
    } else {
        attrText = NSMutableAttributedString.alloc().initWithDataOptionsDocumentAttributesError(
            nsData,
            {
                [NSDocumentTypeDocumentAttribute]: NSHTMLTextDocumentType,
            } as any,
            null
        );
    }
    // console.log('attrText', attrText)

    // TODO: letterSpacing should be applied per Span.
    if (letterSpacing !== undefined) {
        attrText.addAttributeValueRange(NSKernAttributeName, letterSpacing * fontSize, { location: 0, length: attrText.length });
    }

    if (lineHeight !== undefined) {
        const paragraphStyle = NSMutableParagraphStyle.alloc().init();
        paragraphStyle.lineSpacing = this.lineHeight;
        // make sure a possible previously set text alignment setting is not lost when line height is specified
        paragraphStyle.alignment = textAlignment;
        // if (this.nativeTextViewProtected instanceof UILabel) {
        //     // make sure a possible previously set line break mode is not lost when line height is specified
        //     paragraphStyle.lineBreakMode = this.nativeTextViewProtected.lineBreakMode;
        // }
        attrText.addAttributeValueRange(NSParagraphStyleAttributeName, paragraphStyle, { location: 0, length: attrText.length });
    } else if (textAlignment !== undefined) {
        const paragraphStyle = NSMutableParagraphStyle.alloc().init();
        paragraphStyle.alignment = textAlignment;
        attrText.addAttributeValueRange(NSParagraphStyleAttributeName, paragraphStyle, { location: 0, length: attrText.length });
    }
    return attrText;
}
export function buildHTMLString(data: {
    text: string;
    color?: Color | string | number;
    familyName?: string;
    fontSize?: number;
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
    return HTMLStringToNSMutableAttributedString(data as any);
}

export class Label extends LabelBase {
    private _observer: NSObject;
    nativeViewProtected: UITextView;
    nativeTextViewProtected: UITextView;
    attributedString: NSMutableAttributedString;
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
            right: 0,
        };
        return view;
    }

    public initNativeView() {
        super.initNativeView();
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
        super.disposeNativeView();
        if (this._observer) {
            this.nativeViewProtected.removeObserverForKeyPath(this._observer, 'contentSize');
            this._observer = null;
        }
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
    updateVerticalAlignment() {
        const tv = this.nativeTextViewProtected;
        const inset = this.nativeViewProtected.textContainerInset;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        switch (this.verticalTextAlignment) {
            case 'initial': // not supported
            case 'top':
                this.nativeViewProtected.textContainerInset = {
                    top,
                    left: inset.left,
                    bottom: inset.bottom,
                    right: inset.right,
                };
                break;

            case 'middle':
            case 'center': {
                const height = this.computeTextHeight(CGSizeMake(tv.bounds.size.width, 10000));
                let topCorrect = (tv.bounds.size.height - height * tv.zoomScale) / 2.0;
                topCorrect = topCorrect < 0.0 ? 0.0 : topCorrect;
                // tv.contentOffset = CGPointMake(0, -topCorrect);
                this.nativeViewProtected.textContainerInset = {
                    top: top + topCorrect,
                    left: inset.left,
                    bottom: inset.bottom,
                    right: inset.right,
                };
                break;
            }

            case 'bottom': {
                const height = this.computeTextHeight(CGSizeMake(tv.bounds.size.width, 10000));
                let bottomCorrect = tv.bounds.size.height - height * tv.zoomScale;
                bottomCorrect = bottomCorrect < 0.0 ? 0.0 : bottomCorrect;
                // tv.contentOffset = CGPointMake(0, -bottomCorrect);
                this.nativeViewProtected.textContainerInset = {
                    top: top + bottomCorrect,
                    left: inset.left,
                    bottom: inset.bottom,
                    right: inset.right,
                };
                break;
            }
        }
    }

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
    //         console.log('setTextDecorationAndTransform', style.color);
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
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);

            const desiredSize = layout.measureNativeView(nativeView, width, widthMode, height, heightMode);

            const labelWidth = widthMode === layout.AT_MOST ? Math.min(desiredSize.width, width) : desiredSize.width;
            const measureWidth = Math.max(labelWidth, this.effectiveMinWidth);
            const measureHeight = Math.max(desiredSize.height, this.effectiveMinHeight);

            const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);

            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }

    [htmlProperty.getDefault](): string {
        return null;
    }

    updateHTMLString() {
        if (!this.html) {
            this.attributedString = null;
        } else {
            const font = this.nativeView.font;
            const fontSize = this.fontSize || font.pointSize;
            const familyName = this.style.fontFamily || this.style.fontInternal.fontFamily || font.familyName;
            this.attributedString = HTMLStringToNSMutableAttributedString({
                text: this.html,
                fontSize,
                familyName,
                color: this.color,
                letterSpacing: this.letterSpacing,
                lineHeight: this.lineHeight,
                textAlignment: this.nativeTextViewProtected.textAlignment,
            });

            this._requestLayoutOnTextChanged();
        }
        if (this.nativeViewProtected) {
            this.nativeViewProtected.attributedText = this.attributedString;
        }
    }
    [colorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;
        // if (!this.formattedText && !this.html) {
        const nativeView = this.nativeTextViewProtected;
        nativeView.textColor = color;
        // }
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
    // createNSMutableAttributedString(formattedString: FormattedString): NSMutableAttributedString {
    //     return super.createNSMutableAttributedString(formattedString);
    // }
    // [formattedTextProperty.setNative](value: FormattedString) {
    //     super[formattedTextProperty.setNative](value);
    // }
    // [fontInternalProperty.getDefault](): UIFont {
    //     const nativeView = this.nativeViewProtected;
    //     return nativeView.font;
    // }
    // [fontInternalProperty.setNative](value: Font | UIFont) {
    //     super[fontInternalProperty.setNative](value);
    // }

    [paddingTopProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.top,
            unit: 'px',
        };
    }
    [paddingTopProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        this.nativeViewProtected.textContainerInset = {
            top,
            left: inset.left,
            bottom: inset.bottom,
            right: inset.right,
        };
    }

    [paddingRightProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.right,
            unit: 'px',
        };
    }
    [paddingRightProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const right = layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left: inset.left,
            bottom: inset.bottom,
            right,
        };
    }

    [paddingBottomProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.bottom,
            unit: 'px',
        };
    }
    [paddingBottomProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const bottom = layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left: inset.left,
            bottom,
            right: inset.right,
        };
    }
    [paddingLeftProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.left,
            unit: 'px',
        };
    }
    [paddingLeftProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left,
            bottom: inset.bottom,
            right: inset.right,
        };
    }

    [borderTopWidthProperty.getDefault](): Length {
        return {
            value: this.nativeTextViewProtected.textContainerInset.top,
            unit: 'px',
        };
    }
    [borderTopWidthProperty.setNative](value: Length) {
        const inset = this.nativeTextViewProtected.textContainerInset;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        this.nativeTextViewProtected.textContainerInset = { top, left: inset.left, bottom: inset.bottom, right: inset.right };
    }

    [borderRightWidthProperty.getDefault](): Length {
        return {
            value: this.nativeTextViewProtected.textContainerInset.right,
            unit: 'px',
        };
    }
    [borderRightWidthProperty.setNative](value: Length) {
        const inset = this.nativeTextViewProtected.textContainerInset;
        const right = layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        this.nativeTextViewProtected.textContainerInset = { top: inset.top, left: inset.left, bottom: inset.bottom, right };
    }

    [borderBottomWidthProperty.getDefault](): Length {
        return {
            value: this.nativeTextViewProtected.textContainerInset.bottom,
            unit: 'px',
        };
    }
    [borderBottomWidthProperty.setNative](value: Length) {
        const inset = this.nativeTextViewProtected.textContainerInset;
        const bottom = layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        this.nativeTextViewProtected.textContainerInset = { top: inset.top, left: inset.left, bottom, right: inset.right };
    }

    [borderLeftWidthProperty.getDefault](): Length {
        return {
            value: this.nativeTextViewProtected.textContainerInset.left,
            unit: 'px',
        };
    }
    [borderLeftWidthProperty.setNative](value: Length) {
        const inset = this.nativeTextViewProtected.textContainerInset;
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        this.nativeTextViewProtected.textContainerInset = { top: inset.top, left, bottom: inset.bottom, right: inset.right };
    }

    [maxLinesProperty.getDefault](): number | string {
        return 'none';
    }
    [maxLinesProperty.setNative](value: number | string) {
        if (value === 'none') {
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
    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        const nativeView = this.nativeTextViewProtected;
        // only if no lineBreak
        if (!this.lineBreak) {
            nativeView.textContainer.lineBreakMode = whiteSpaceToLineBreakMode(value);
        }
    }
    // [autoFontSizeProperty.getDefault](): boolean {
    //     return this.nativeViewProtected.adjustsFontSizeToFitWidth;
    // }
    // [maxLinesProperty.setNative](value: number | string) {
    //     if (value === 'none') {
    //         this.nativeViewProtected.textContainer.maximumNumberOfLines = 0;
    //     } else {
    //         this.nativeViewProtected.textContainer.maximumNumberOfLines = value as number;
    //     }
    // }

    [verticalTextAlignmentProperty.setNative](value: VerticalTextAlignment) {
        this.updateVerticalAlignment();
    }
}
