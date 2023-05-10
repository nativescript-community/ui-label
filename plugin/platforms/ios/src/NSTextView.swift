import UIKit

@objcMembers
@objc(NSTextView)
class NSTextView: UITextView {
  var padding: UIEdgeInsets = UIEdgeInsets.zero
  var borderThickness:UIEdgeInsets = UIEdgeInsets.zero
  override init(frame: CGRect, textContainer: NSTextContainer?) {
    super.init(frame: frame, textContainer:textContainer )
    commonInit()
    
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }
  func commonInit() {
    if ((self.font == nil)) {
      self.font = UIFont.systemFont(ofSize: 12);
    }
    if #available(iOS 13, *) {
      self.textColor = UIColor.label;
    }
    // view.linkTextAttributes = NSDictionary.new();
    self.isScrollEnabled = false;
    self.isEditable = false;
    self.isSelectable = false;
    self.backgroundColor = UIColor.clear;
    // self.userInteractionEnabled = true;
    self.dataDetectorTypes = UIDataDetectorTypes.all;
    self.textContainerInset = UIEdgeInsets.zero;
    self.textContainer.lineFragmentPadding = 0;
    // ignore font leading just like UILabel does
    self.layoutManager.usesFontLeading = false;
  }
}
