import UIKit

@objcMembers
@objc(NSLabel)
class NSLabel: UILabel {
  var zoomScale:Float = 1.0;
  var textContainerInset: UIEdgeInsets = UIEdgeInsets.zero
  var padding: UIEdgeInsets = UIEdgeInsets.zero
  var borderThickness:UIEdgeInsets = UIEdgeInsets.zero
  override init(frame: CGRect) {
    super.init(frame: frame )
    commonInit()
    
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }
  
  func commonInit() {
    if #available(iOS 13, *) {
      self.textColor = UIColor.label
      self.isUserInteractionEnabled = true
    }
  }
  
  
  override func textRect(forBounds bounds:CGRect, limitedToNumberOfLines numberOfLines:Int) -> CGRect {
    // UILabel.textRectForBounds:limitedToNumberOfLines: returns rect with CGSizeZero when empty
    if self.text?.count == 0 {
      return super.textRect(forBounds: bounds, limitedToNumberOfLines:numberOfLines)
    }
    
    // 1. Subtract the insets (border thickness & padding)
    // 2. Calculate the original label bounds
    // 3. Add the insets again
    let insets:UIEdgeInsets = UIEdgeInsets(top: self.borderThickness.top + self.padding.top,
                                           left: self.borderThickness.left + self.padding.left,
                                           bottom: self.borderThickness.bottom + self.padding.bottom,
                                           right: self.borderThickness.right + self.padding.right)
    
    let rect:CGRect = super.textRect(forBounds: bounds.inset(by: insets), limitedToNumberOfLines:numberOfLines)
    
    let inverseInsets:UIEdgeInsets = UIEdgeInsets(top: -(self.borderThickness.top + self.padding.top),
                                                  left: -(self.borderThickness.left + self.padding.left),
                                                  bottom: -(self.borderThickness.bottom + self.padding.bottom),
                                                  right: -(self.borderThickness.right + self.padding.right))
    
    return rect.inset(by: inverseInsets)
  }
  
  override func drawText(in rect:CGRect) {
    super.drawText(in: rect.inset(by: self.textContainerInset))
  }
  // - (void)drawTextInRect:(CGRect)rect {
  
  //     [super drawTextInRect:UIEdgeInsetsInsetRect(rect, self.textContainerInset)];
  // }
  override public var intrinsicContentSize: CGSize {
    get {
      var intrinsicContentSize:CGSize = super.intrinsicContentSize
      intrinsicContentSize.width += self.padding.left + self.padding.right
      intrinsicContentSize.height += self.padding.top + self.padding.bottom
      return intrinsicContentSize
    }
  }
  
  func updateFontRatio(_ ratio: CGFloat){
    let toChange: NSMutableAttributedString = attributedText as? NSMutableAttributedString ?? NSMutableAttributedString.init(attributedString: attributedText!)
    var found = false;
    toChange.enumerateAttribute(NSAttributedString.Key(rawValue: "OriginalFontSize"), in: NSRange(location: 0, length: toChange.length)) { value, range, stop in
      if ((value != nil) && range.length > 0) {
        toChange.enumerateAttribute(NSAttributedString.Key.font, in: range) { value2, range2, stop2 in
          if let font = (value2 as? UIFont) {
            if ( ratio != font.pointSize) {
              let newFont = font.withSize(round(value as! CGFloat * ratio))
                found = true;
                toChange.removeAttribute(NSAttributedString.Key.font, range: range)
                toChange.addAttribute(NSAttributedString.Key.font, value: newFont, range: range)
              
            }
            
          }
          
        }
      }
    }
    
    if (found) {
      self.attributedText = toChange;
    }
  }
}
