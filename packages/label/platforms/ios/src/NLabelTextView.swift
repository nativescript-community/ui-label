import UIKit

// The Obj-C runtime has a flat namespace, so the classes exported from here use
// an `N` prefix rather than `NS`. This one used to be exported as `NSTextView`,
// which AppKit owns: on Mac Catalyst the collision dropped the class from the
// generated NativeScript metadata ("ReferenceError: NSTextView is not defined").
@objcMembers
@objc(NLabelTextView)
class NLabelTextView: UITextView {
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
    self.isUserInteractionEnabled = true;
    self.dataDetectorTypes = UIDataDetectorTypes.all;
    self.textContainerInset = UIEdgeInsets.zero;
    self.textContainer.lineFragmentPadding = 0;
    // ignore font leading just like UILabel does
    self.layoutManager.usesFontLeading = false;
  }
}
