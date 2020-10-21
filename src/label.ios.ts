import { VerticalTextAlignment, createNativeAttributedString, verticalTextAlignmentProperty } from '@nativescript-community/text';
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
import {
    TextAlignment,
    TextTransform,
    WhiteSpace,
    letterSpacingProperty,
    whiteSpaceProperty,
} from '@nativescript/core/ui/text-base';
import { lineHeightProperty } from '@nativescript/core/ui/text-base/text-base-common';
import { isNullOrUndefined, isString } from '@nativescript/core/utils/types';
import { iOSNativeHelper, layout } from '@nativescript/core/utils/utils';
import { TextShadow } from './label';
import {
    LabelBase,
    htmlProperty,
    lineBreakProperty,
    maxLinesProperty,
    needFormattedStringComputation,
    textShadowProperty,
} from './label-common';

export { enableIOSDTCoreText, createNativeAttributedString } from '@nativescript-community/text';

export * from './label-common';
const majorVersion = iOSNativeHelper.MajorVersion;

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

    updateHTMLString() {
        if (!this.html) {
            this.attributedString = null;
        } else {
            const font = this.nativeViewProtected.font;
            const fontSize = this.fontSize || font.pointSize;
            const familyName = this.style.fontFamily || this.style.fontInternal.fontFamily || font.familyName;

            this.attributedString = createNativeAttributedString({
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
                length: source.length,
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
    [paddingTopProperty.getDefault](): Length {
        return {
            value: 0,
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
            value: 0,
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
            value: 0,
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
            value: 0,
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
            value: 0,
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
            value: 0,
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
            value: 0,
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
            value: 0,
            unit: 'px',
        };
    }
    [borderLeftWidthProperty.setNative](value: Length) {
        const inset = this.nativeTextViewProtected.textContainerInset;
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        this.nativeTextViewProtected.textContainerInset = { top: inset.top, left, bottom: inset.bottom, right: inset.right };
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
