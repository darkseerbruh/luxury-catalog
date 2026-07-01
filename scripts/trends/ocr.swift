import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count > 1 else { exit(1) }
let path = args[1]
guard let img = NSImage(contentsOfFile: path),
      let tiff = img.tiffRepresentation,
      let bmp = NSBitmapImageRep(data: tiff),
      let cg = bmp.cgImage else { print("ERR load"); exit(1) }

let req = VNRecognizeTextRequest { r, _ in
    guard let obs = r.results as? [VNRecognizedTextObservation] else { return }
    // sort top-to-bottom (Vision y is bottom-up, so higher y = higher on screen)
    let sorted = obs.sorted { $0.boundingBox.origin.y > $1.boundingBox.origin.y }
    for o in sorted {
        if let t = o.topCandidates(1).first {
            let y = String(format: "%.3f", o.boundingBox.origin.y)
            print("\(y)\t\(t.string)")
        }
    }
}
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
let h = VNImageRequestHandler(cgImage: cg, options: [:])
try? h.perform([req])
