import Foundation
import UIKit

@objcMembers
@objc(NSLabelUtils)
class NSLabelUtils: NSObject {
  class func setTextDecorationAndTransformOn(view:UIView!, text:String!, textDecoration:String!, letterSpacing:CGFloat, lineHeight:CGFloat, color:UIColor!) {
    let attrDict:NSMutableDictionary! = NSMutableDictionary()
    var paragraphStyle:NSMutableParagraphStyle! = nil
    let isTextType:Bool = (view is UITextField) || (view is UITextView) || (view is UILabel) || (view is UIButton)
    let isTextView:Bool = (view is UITextView)
    
    if textDecoration.contains("underline") {
      attrDict[NSAttributedString.Key.underlineStyle] = (NSUnderlineStyle.single)
    }
    
    if textDecoration.contains("line-through") {
      attrDict[NSAttributedString.Key.strikethroughStyle] = (NSUnderlineStyle.single)
    }
    
    if letterSpacing != 0 && isTextType && (view as! UILabel).font != nil {
      let kern:NSNumber! = NSNumber.init(value: letterSpacing * (view as! UILabel).font.pointSize)
      attrDict[NSAttributedString.Key.kern] = kern
    }
    var fLineHeight = lineHeight
    if fLineHeight >= 0 {
      if fLineHeight == 0 {
        fLineHeight = 0.00001
      }
      if paragraphStyle == nil {
        paragraphStyle = NSMutableParagraphStyle()
      }
      paragraphStyle.minimumLineHeight = fLineHeight
      paragraphStyle.maximumLineHeight = fLineHeight
      // make sure a possible previously set text alignment setting is not lost when line height is specified
      
      
    }
    if (paragraphStyle != nil) {
      if (view is UIButton) {
        paragraphStyle.alignment = (view as! UIButton).titleLabel!.textAlignment
      } else {
        paragraphStyle.alignment = (view as! UILabel).textAlignment
      }
      if (view is UILabel) {
        // make sure a possible previously set line break mode is not lost when line height is specified
        paragraphStyle.lineBreakMode = (view as! UILabel).lineBreakMode
      }
      attrDict[NSAttributedString.Key.paragraphStyle] = paragraphStyle
    }
    
    if attrDict.count > 0 {
      if isTextView && ((view as! UITextView).font != nil) {
        // UITextView's font seems to change inside.
        attrDict[NSAttributedString.Key.font] = (view as! UITextView).font
      }
      
      if color != nil {
        attrDict[NSAttributedString.Key.foregroundColor] = color
      }
      
      let result:NSMutableAttributedString! = NSMutableAttributedString(string:text)
      result.setAttributes((attrDict as! [NSAttributedString.Key : Any]), range:NSRange(location: 0, length: text.count))
      
      if (view is UIButton) {
        (view as! UIButton).setAttributedTitle(result, for:UIControl.State.normal)
      }
      else if(view is UILabel) {
        (view as! UILabel).attributedText = result
      } else if(view is UITextView) {
        (view as! UITextView).attributedText = result
      }
    } else {
      if (view is UIButton) {
        // Clear attributedText or title won't be affected.
        (view as! UIButton).setAttributedTitle(nil, for:UIControl.State.normal)
        (view as! UIButton).setTitle(text, for:UIControl.State.normal)
      } else if(view is UILabel) {
        // Clear attributedText or text won't be affected.
        (view as! UILabel).attributedText = nil
        (view as! UILabel).text = text
      } else if(view is UITextView) {
        // Clear attributedText or text won't be affected.
        (view as! UITextView).attributedText = nil
        (view as! UITextView).text = text
      }
    }
  }
  class func inset(rect:CGRect, uIEdgeInsets:UIEdgeInsets) -> CGRect {
    return rect.inset(by: uIEdgeInsets)
  }
  enum NSLabelOrNSTextView: Equatable {
      case NSLabel(NSLabel)
      case NSTextView(NSTextView)
  }
  enum Component {
    case `switch`(UISwitch)
    case stepper(UIStepper)
    
    var control: UIControl {
      switch self {
        case .switch(let comp):
          return comp
        case .stepper(let comp):
          return comp
      }
    }
  }
  
  class func updateFontRatio(_ view: UIView, ratio: CGFloat){
    var currentAttributedString: NSAttributedString? = nil
    switch view {
    case is NSLabel:
      currentAttributedString = (view as! NSLabel).attributedText
    case is NSTextView:
      currentAttributedString = (view as! NSTextView).attributedText
    default: break
    }
    if (currentAttributedString == nil) {
      return;
    }
    let toChange: NSMutableAttributedString = (currentAttributedString as? NSMutableAttributedString) ?? NSMutableAttributedString.init(attributedString: currentAttributedString!)
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
      switch view {
      case is NSLabel:
        (view as! NSLabel).attributedText = toChange;
      case is NSTextView:
        (view as! NSTextView).attributedText = toChange;
      default: break
      }
    }
  }
}

@objc extension NSAttributedString {
  func hasAttribute(_ attribute: String) -> Bool {
    var result = false;
    self.enumerateAttribute(NSAttributedString.Key(rawValue: attribute), in: NSRange(location: 0, length: length)) { value, range, stop in
      if ((value != nil) && range.length > 0) {
        result = true
        stop.pointee = true
      }
    }
    return result;
  }
}
