declare class LabelLinkGestureRecognizer extends UITapGestureRecognizer {
    static alloc(): LabelLinkGestureRecognizer; // inherited from NSObject

    static new(): LabelLinkGestureRecognizer; // inherited from NSObject

    linkAttribute: string;

    tapDelegate: UILabelLinkHandlerTapDelegate;

    constructor(o: { delegate: UILabelLinkHandlerTapDelegate });

    handleTapWithTapGesture(tapGesture: UIGestureRecognizer): void;

    initWithDelegate(withDelegate: UILabelLinkHandlerTapDelegate): this;
}

declare class NLabel extends UILabel {
    static alloc(): NLabel; // inherited from NSObject

    static appearance(): NLabel; // inherited from UIAppearance

    static appearanceForTraitCollection(trait: UITraitCollection): NLabel; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): NLabel; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
        trait: UITraitCollection,
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NLabel; // inherited from UIAppearance

    static appearanceWhenContainedIn(ContainerClass: typeof NSObject): NLabel; // inherited from UIAppearance

    static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]): NLabel; // inherited from UIAppearance

    static new(): NLabel; // inherited from NSObject

    borderThickness: UIEdgeInsets;

    padding: UIEdgeInsets;

    textContainerInset: UIEdgeInsets;

    zoomScale: number;

    commonInit(): void;
}

declare class NLabelUtils extends NSObject {
    static alloc(): NLabelUtils; // inherited from NSObject

    static insetWithRectUIEdgeInsets(rect: CGRect, uIEdgeInsets: UIEdgeInsets): CGRect;

    static new(): NLabelUtils; // inherited from NSObject

    static setTextDecorationAndTransformOnViewTextTextDecorationLetterSpacingLineHeightColor(
        view: UIView,
        text: string,
        textDecoration: string,
        letterSpacing: number,
        lineHeight: number,
        color: UIColor
    ): void;
    static updateFontRatioRatio(view: UIView, ratio: number): void;
}

declare class NLabelTextView extends UITextView {
    static alloc(): NLabelTextView; // inherited from NSObject

    static appearance(): NLabelTextView; // inherited from UIAppearance

    static appearanceForTraitCollection(trait: UITraitCollection): NLabelTextView; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): NLabelTextView; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
        trait: UITraitCollection,
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NLabelTextView; // inherited from UIAppearance

    static appearanceWhenContainedIn(ContainerClass: typeof NSObject): NLabelTextView; // inherited from UIAppearance

    static appearanceWhenContainedInInstancesOfClasses(
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NLabelTextView; // inherited from UIAppearance

    static new(): NLabelTextView; // inherited from NSObject

    static textViewUsingTextLayoutManager(usingTextLayoutManager: boolean): NLabelTextView; // inherited from UITextView

    borderThickness: UIEdgeInsets;

    padding: UIEdgeInsets;

    commonInit(): void;
}

interface UILabelLinkHandlerTapDelegate {
    onLinkTapped(value: any): void;
}
// eslint-disable-next-line no-redeclare
declare const UILabelLinkHandlerTapDelegate: {
    prototype: UILabelLinkHandlerTapDelegate;
};

interface NSAttributedString {
    hasAttribute(attribute: string): boolean;
}
