import UIKit

@objc(UILabelLinkHandlerTapDelegate)
protocol UILabelLinkHandlerTapDelegate: class {
  func onLinkTapped(_ value: Any)
}

@objc(LabelLinkGestureRecognizer)
@objcMembers
class LabelLinkGestureRecognizer : UITapGestureRecognizer {
  private var layoutManager: NSLayoutManager = NSLayoutManager()
  private var textContainer: NSTextContainer = NSTextContainer(size: CGSizeZero)
  weak var tapDelegate: UILabelLinkHandlerTapDelegate?
  var linkAttribute = "CustomLinkAttribute"
  
  
  public init(withDelegate: UILabelLinkHandlerTapDelegate) {
    super.init(target: nil, action: nil)
    addTarget(self, action: #selector(handleTap))
    tapDelegate = withDelegate
    layoutManager.addTextContainer(textContainer)
}
  
  @objc func handleTap(tapGesture: UIGestureRecognizer) {
   guard let label = tapGesture.view  as? NSLabel, let attributedText: NSAttributedString = label.attributedText, tapGesture.state == .ended else {
     return
   }
   let bounds = label.bounds
   let textStorage = NSTextStorage(attributedString: attributedText)
   textStorage.addLayoutManager(layoutManager)

   textContainer.lineFragmentPadding = 0
   textContainer.lineBreakMode = label.lineBreakMode
   textContainer.maximumNumberOfLines = label.numberOfLines
   textContainer.size = bounds.size
   var offsetXMultiplier: CGFloat!
   switch label.textAlignment {
   case .left, .natural, .justified:
     offsetXMultiplier = 0.0
   case .center:
     offsetXMultiplier = 0.5
   case .right:
     offsetXMultiplier = 1.0
   }
    let offsetYMultiplier: CGFloat! = 0.5
    let labelSize = label.bounds.size
    textContainer.size = CGSizeMake(
     labelSize.width -
     label.padding.left -
     label.padding.right -
     label.borderThickness.left -
     label.borderThickness.right,
     labelSize.width -
     label.padding.top -
     label.padding.bottom -
     label.borderThickness.top -
     label.borderThickness.bottom
   )

   let locationOfTouchInLabel = tapGesture.location(in: label)
   let textBoundingBox = layoutManager.usedRect(for: textContainer)

   let insetedLabelRect = label.bounds.inset(by: label.textContainerInset)
   let textContainerOffset = CGPointMake(
     (insetedLabelRect.size.width - textBoundingBox.size.width) * offsetXMultiplier -
     textBoundingBox.origin.x +
     insetedLabelRect.origin.x,
     (insetedLabelRect.size.height - textBoundingBox.size.height) * offsetYMultiplier -
     textBoundingBox.origin.y +
     insetedLabelRect.origin.y
   )
   let locationOfTouchInTextContainer = CGPointMake(
     locationOfTouchInLabel.x - textContainerOffset.x,
     locationOfTouchInLabel.y - textContainerOffset.y
   )
   // Check if tap was inside text bounding rect
   if (CGRectContainsPoint(textBoundingBox, locationOfTouchInTextContainer)) {
     // According to Apple docs, if no glyph is under point, the nearest glyph is returned
     let glyphIndex = layoutManager.glyphIndex(for: locationOfTouchInTextContainer, in: textContainer, fractionOfDistanceThroughGlyph: nil)
     // In order to determine whether the tap point actually lies within the bounds
     // of the glyph returned, we call the method below and test
     // whether the point falls in the rectangle returned by that method
     let glyphRect = layoutManager.boundingRect(forGlyphRange: NSRange(location: glyphIndex, length: 1), in: textContainer)

     // Ensure that an actual glyph was tapped
     if (CGRectContainsPoint(glyphRect, locationOfTouchInTextContainer)) {
       let indexOfCharacter = layoutManager.characterIndexForGlyph(at: glyphIndex)
       let value = label.attributedText?.attribute(NSAttributedString.Key(rawValue: linkAttribute) , at: indexOfCharacter, effectiveRange: nil)
       if ((tapDelegate != nil) && value != nil) {
         tapDelegate?.onLinkTapped(value!)
       }
     }
     textStorage.removeLayoutManager(layoutManager)
   }
    
  }
}
