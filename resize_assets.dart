import 'dart:io';
import 'package:image/image.dart';

void main() {
  final featurePath = r'G:\ExamYemen\website\assets\app-mockup.png';
  final outDir = Directory(r'G:\ExamYemen\store_assets');
  if (!outDir.existsSync()) {
    outDir.createSync(recursive: true);
  }

  final featureFile = File(featurePath);
  if (featureFile.existsSync()) {
    var originalImage = decodeImage(featureFile.readAsBytesSync());
    if (originalImage != null) {
      print('Original size: ${originalImage.width}x${originalImage.height}');
      
      // 1. Create blurred background (stretched to 1024x500)
      var bg = copyResize(originalImage, width: 1024, height: 500);
      bg = gaussianBlur(bg, radius: 25); // Heavy blur to make it a nice backdrop
      
      // 2. Resize foreground image so its height is exactly 500, preserving aspect ratio
      // In package:image 4.x, if you pass height but not width, it maintains aspect ratio.
      var fg = copyResize(originalImage, height: 500);
      
      // 3. Composite the clear foreground image into the center of the blurred background
      int dx = (1024 - fg.width) ~/ 2;
      compositeImage(bg, fg, dstX: dx, dstY: 0);
      
      // 4. Save
      File(r'G:\ExamYemen\store_assets\feature_graphic.png').writeAsBytesSync(encodePng(bg));
      print('Saved perfect uncropped feature_graphic.png (1024x500)');
    }
  } else {
    print('File not found: $featurePath');
  }

  // Also do the icon if it exists (assuming user might have updated path)
  final iconPath = r'G:\ExamYemen\website\assets\app-icon.png';
  final iconFile = File(iconPath);
  if (iconFile.existsSync()) {
    var iconImage = decodeImage(iconFile.readAsBytesSync());
    if (iconImage != null) {
      var minDimension = iconImage.width < iconImage.height ? iconImage.width : iconImage.height;
      var squared = copyCrop(iconImage, 
        x: (iconImage.width - minDimension) ~/ 2, 
        y: (iconImage.height - minDimension) ~/ 2, 
        width: minDimension, 
        height: minDimension);
      var resizedIcon = copyResize(squared, width: 512, height: 512);
      File(r'G:\ExamYemen\store_assets\store_icon.png').writeAsBytesSync(encodePng(resizedIcon));
      print('Saved store_icon.png (512x512)');
    }
  }
}
