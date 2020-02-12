package com.nativescript.label;

import android.graphics.Typeface;
import android.content.Context;
import android.text.method.TransformationMethod;

public class Label extends com.lsjwzh.widget.text.FastTextView {
    public Label(Context context) {
        super(context);
    }

    public TransformationMethod getTransformationMethod() {
        return null;
    }

    public void setTransformationMethod(TransformationMethod value) {

    }

    public void setSingleLine(boolean value) {

    }

    public void setMinLines(int value) {

    }

    public void setMinHeight(int value) {

    }

    public void setMaxHeight(int value) {

    }

    public int getMinHeight() {
        return 0;

    }

    public int getMinLines() {
        return 0;

    }

    public int getMaxHeight() {
        return 0;

    }

    public int getLineSpacingExtra() {
        return 0;

    }

    public void setLineSpacing(float add, float mult) {

    }

    public void setLetterSpacing(float value) {
        getTextPaint().setLetterSpacing(value);
    }

    public float getLetterSpacing() {
        return getTextPaint().getLetterSpacing();
    }

    public Typeface getTypeface() {
        return getTextPaint().getTypeface();
    }

    public void setTypeface(Typeface typeface) {
        getTextPaint().setTypeface(typeface);
    }

    public int getPaintFlags() {
        return getTextPaint().getFlags();
    }

    public void setPaintFlags(int typeface) {
        getTextPaint().setFlags(typeface);
    }
}