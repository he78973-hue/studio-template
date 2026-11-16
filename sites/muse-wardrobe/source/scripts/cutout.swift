import Foundation
import Vision
import CoreImage
import AppKit

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let image = CIImage(contentsOf: input)!
let handler = VNImageRequestHandler(ciImage: image, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else { fatalError("No subject detected") }
let mask = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
let maskImage = CIImage(cvPixelBuffer: mask)
    .applyingFilter("CIMorphologyMinimum", parameters: [kCIInputRadiusKey: 8])
    .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: 1])
let composite = image.applyingFilter("CIBlendWithMask", parameters: [
    kCIInputMaskImageKey: maskImage,
    kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: image.extent)
])
let context = CIContext()
try context.writePNGRepresentation(of: composite, to: output, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("Cutout saved: \(output.lastPathComponent)")
